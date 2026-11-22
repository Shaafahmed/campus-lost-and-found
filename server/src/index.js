require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const { seedData } = require('./seed');

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set in server/.env - using a development default');
  process.env.JWT_SECRET = 'lostfound_dev_secret_change_me';
}

const app = express();
app.set('query parser', 'simple'); // no nested objects in query strings

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '100kb' }));
app.use(require('./middleware/sanitize'));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Serve the built React app (after `npm run build` in client/) so one server runs everything
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON in request body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large' });
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 3 MB' : err.message;
    return res.status(400).json({ message: msg });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Image must be smaller than 3 MB' });
  if (err.message && err.message.startsWith('Only JPG')) return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(async () => {
    // First run: load demo data so the portal is not empty
    if ((await User.countDocuments()) === 0) await seedData();
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Shut the database down cleanly on Ctrl+C
['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, async () => {
    await disconnectDB().catch(() => {});
    process.exit(0);
  })
);

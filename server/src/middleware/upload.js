const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
  cb(ok ? null : new Error('Only JPG, PNG, WEBP or GIF images are allowed'), ok);
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

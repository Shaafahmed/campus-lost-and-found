const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { signToken, publicUser } = require('../utils/token');
const { EMAIL_RX, filledStrings } = require('../utils/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, usn, phone } = req.body;
    if (!filledStrings(name, email, password)) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!EMAIL_RX.test(email.trim())) return res.status(400).json({ message: 'Please enter a valid email address' });
    if ((usn !== undefined && typeof usn !== 'string') || (phone !== undefined && typeof phone !== 'string')) {
      return res.status(400).json({ message: 'Invalid USN or phone' });
    }
    if (phone && !/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({ name, email: email.trim(), password, usn, phone });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!filledStrings(email, password)) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked by the admin' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/me  (update profile)
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, usn, phone } = req.body;
    if ([name, usn, phone].some((v) => v !== undefined && typeof v !== 'string')) {
      return res.status(400).json({ message: 'Invalid profile data' });
    }
    if (name !== undefined && !name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
    if (phone && !/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }
    if (name !== undefined) req.user.name = name;
    if (usn !== undefined) req.user.usn = usn;
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

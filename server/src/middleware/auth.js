const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT sent in the Authorization header and attaches the user to req.user
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked by the admin' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

// Like protect, but never blocks: sets req.user if a valid token is sent, otherwise continues as a guest
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) req.user = user;
    } catch (err) {
      // invalid token -> treat as guest
    }
  }
  next();
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access only' });
}

module.exports = { protect, optionalAuth, adminOnly };

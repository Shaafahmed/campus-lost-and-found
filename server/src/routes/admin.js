const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [users, lost, found, open, claimed, resolved, pendingClaims, byCategory] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'open' }),
      Item.countDocuments({ status: 'claimed' }),
      Item.countDocuments({ status: 'resolved' }),
      Claim.countDocuments({ status: 'pending' }),
      Item.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    res.json({ users, lost, found, open, claimed, resolved, pendingClaims, byCategory });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/items
router.get('/items', async (req, res, next) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).populate('postedBy', 'name email').lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const counts = await Item.aggregate([{ $group: { _id: '$postedBy', count: { $sum: 1 } } }]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json(users.map((u) => ({ ...u, itemCount: map[String(u._id)] || 0 })));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/block  { isBlocked }
router.patch('/users/:id/block', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot block an admin' });
    if (typeof req.body.isBlocked !== 'boolean') return res.status(400).json({ message: 'isBlocked must be true or false' });
    user.isBlocked = req.body.isBlocked;
    await user.save();
    res.json({ _id: user._id, isBlocked: user.isBlocked });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

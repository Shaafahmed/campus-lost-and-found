const express = require('express');
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/claims  { itemId, message }
router.post('/', protect, async (req, res, next) => {
  try {
    const { itemId, message } = req.body;
    if (typeof itemId !== 'string' || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Please describe why this item matches yours' });
    }
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (String(item.postedBy) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot send a request on your own post' });
    }
    if (item.status !== 'open') return res.status(400).json({ message: 'This item is no longer open' });

    const existing = await Claim.findOne({ item: itemId, claimant: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already sent a request for this item' });

    const claim = await Claim.create({ item: itemId, claimant: req.user._id, message });
    res.status(201).json(claim);
  } catch (err) {
    next(err);
  }
});

// GET /api/claims/sent  - requests I have made
router.get('/sent', protect, async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'item',
        select: 'title type image status postedBy contactInfo',
        populate: { path: 'postedBy', select: 'name email phone' },
      })
      .lean();
    // Only reveal the poster's contact details once the request is approved
    claims.forEach((c) => {
      if (c.item && c.status !== 'approved') {
        if (c.item.postedBy) c.item.postedBy = { name: c.item.postedBy.name };
        delete c.item.contactInfo;
      }
    });
    res.json(claims.filter((c) => c.item));
  } catch (err) {
    next(err);
  }
});

// GET /api/claims/received  - requests made on my items
router.get('/received', protect, async (req, res, next) => {
  try {
    const myItems = await Item.find({ postedBy: req.user._id }).select('_id');
    const claims = await Claim.find({ item: { $in: myItems.map((i) => i._id) } })
      .sort({ createdAt: -1 })
      .populate('item', 'title type image status')
      .populate('claimant', 'name email phone usn')
      .lean();
    res.json(claims);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/claims/:id  { status: 'approved' | 'rejected' }  (item owner only)
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const claim = await Claim.findById(req.params.id).populate('item');
    if (!claim || !claim.item) return res.status(404).json({ message: 'Request not found' });
    if (String(claim.item.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the person who posted the item can respond' });
    }
    if (claim.status !== 'pending') return res.status(400).json({ message: 'This request was already answered' });
    if (status === 'approved' && claim.item.status !== 'open') {
      return res.status(400).json({ message: `This item is already ${claim.item.status}` });
    }

    claim.status = status;
    await claim.save();

    if (status === 'approved') {
      // Mark the item as claimed and reject the other pending requests
      await Item.findByIdAndUpdate(claim.item._id, { status: 'claimed' });
      await Claim.updateMany(
        { item: claim.item._id, _id: { $ne: claim._id }, status: 'pending' },
        { status: 'rejected' }
      );
    }
    res.json(claim);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

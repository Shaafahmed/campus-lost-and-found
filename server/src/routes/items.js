const express = require('express');
const fs = require('fs');
const path = require('path');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { filledStrings, dateError } = require('../utils/validate');

const router = express.Router();
const { CATEGORIES } = Item;
const EDITABLE = ['type', 'title', 'description', 'category', 'location', 'date', 'contactInfo', 'status'];

function deleteFile(image) {
  if (!image) return;
  const file = path.join(__dirname, '..', '..', image.replace(/^\//, ''));
  fs.unlink(file, () => {});
}

// Deletes an image file only if no other item still uses it
async function removeImageIfUnused(image, exceptItemId) {
  if (!image) return;
  const others = await Item.countDocuments({ image, _id: { $ne: exceptItemId } });
  if (others === 0) deleteFile(image);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Query values must be plain strings (blocks ?type[$ne]=x style injection)
const qs = (v) => (typeof v === 'string' ? v : '');

// GET /api/items/categories
router.get('/categories', (req, res) => res.json(CATEGORIES));

// GET /api/items/stats  - public numbers for the home page
router.get('/stats', async (req, res, next) => {
  try {
    const [lost, found, resolved] = await Promise.all([
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: { $in: ['claimed', 'resolved'] } }),
    ]);
    res.json({ lost, found, resolved, total: lost + found });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/mine  - items posted by the logged-in user
router.get('/mine', protect, async (req, res, next) => {
  try {
    const items = await Item.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).lean();
    const ids = items.map((i) => i._id);
    const counts = await Claim.aggregate([
      { $match: { item: { $in: ids }, status: 'pending' } },
      { $group: { _id: '$item', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json(items.map((i) => ({ ...i, pendingClaims: map[String(i._id)] || 0 })));
  } catch (err) {
    next(err);
  }
});

// GET /api/items?type=&category=&status=&q=&page=&limit=&sort=
router.get('/', async (req, res, next) => {
  try {
    const type = qs(req.query.type);
    const category = qs(req.query.category);
    const status = qs(req.query.status);
    const q = qs(req.query.q);
    const sort = qs(req.query.sort) || 'newest';
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = { $ne: 'resolved' };
    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { location: rx }];
    }

    const sortBy = sort === 'oldest' ? { date: 1, createdAt: 1 } : { date: -1, createdAt: -1 };
    const [items, total] = await Promise.all([
      Item.find(filter)
        .select('-contactInfo') // private: shared only with approved claimants
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('postedBy', 'name')
        .lean(),
      Item.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id  (contactInfo is included only for the poster or an admin)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('postedBy', 'name usn').lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const canSeeContact =
      req.user && (req.user.role === 'admin' || String(req.user._id) === String(item.postedBy?._id));
    if (!canSeeContact) delete item.contactInfo;
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id/matches  - possible matches (opposite type, same category, similar words, close dates)
router.get('/:id/matches', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const candidates = await Item.find({
      _id: { $ne: item._id },
      type: item.type === 'lost' ? 'found' : 'lost',
      category: item.category,
      status: { $ne: 'resolved' },
    })
      .select('-contactInfo')
      .populate('postedBy', 'name')
      .lean();

    // Common words that say nothing about the item itself
    const stop = new Set([
      'the', 'and', 'with', 'near', 'for', 'was', 'has', 'have', 'this', 'that', 'from', 'left', 'after',
      'before', 'lost', 'found', 'some', 'small', 'inside', 'its', 'his', 'her', 'one', 'two', 'three',
      'colour', 'color', 'during', 'somewhere', 'probably', 'kept', 'block', 'floor', 'room',
    ]);
    const words = (s) =>
      new Set(
        String(s)
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length > 2 && !stop.has(w))
      );
    const base = words(`${item.title} ${item.description} ${item.location}`);

    const scored = candidates
      .map((c) => {
        const w = words(`${c.title} ${c.description} ${c.location}`);
        let common = 0;
        w.forEach((x) => {
          if (base.has(x)) common += 1;
        });
        const days = Math.abs(new Date(c.date) - new Date(item.date)) / 86400000;
        const score = common * 10 + Math.max(0, 14 - days);
        return { ...c, score: Math.round(score), common };
      })
      .filter((c) => c.common > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    res.json(scored);
  } catch (err) {
    next(err);
  }
});

// POST /api/items  (multipart/form-data with optional "image")
router.post('/', protect, upload.single('image'), async (req, res, next) => {
  const uploaded = req.file ? `/uploads/${req.file.filename}` : '';
  const fail = (code, message) => {
    deleteFile(uploaded);
    return res.status(code).json({ message });
  };
  try {
    const { type, title, description, category, location, date, contactInfo } = req.body;
    if (!filledStrings(type, title, description, category, location, date)) {
      return fail(400, 'Please fill all the required fields');
    }
    const dErr = dateError(date);
    if (dErr) return fail(400, dErr);

    const item = await Item.create({
      type,
      title,
      description,
      category,
      location,
      date,
      contactInfo: typeof contactInfo === 'string' ? contactInfo : '',
      image: uploaded,
      postedBy: req.user._id,
    });
    res.status(201).json(item);
  } catch (err) {
    deleteFile(uploaded);
    next(err);
  }
});

// PUT /api/items/:id  (owner or admin)
router.put('/:id', protect, upload.single('image'), async (req, res, next) => {
  const uploaded = req.file ? `/uploads/${req.file.filename}` : '';
  const fail = (code, message) => {
    deleteFile(uploaded);
    return res.status(code).json({ message });
  };
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return fail(404, 'Item not found');
    const isOwner = String(item.postedBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return fail(403, 'Not allowed');

    for (const f of EDITABLE) {
      const v = req.body[f];
      if (v === undefined) continue;
      if (typeof v !== 'string') return fail(400, `Invalid value for ${f}`);
      if (f !== 'contactInfo' && !v.trim()) return fail(400, `${f} cannot be empty`);
    }
    if (req.body.date !== undefined) {
      const dErr = dateError(req.body.date);
      if (dErr) return fail(400, dErr);
    }

    const wasStatus = item.status;
    EDITABLE.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    const oldImage = item.image;
    if (uploaded) item.image = uploaded;
    await item.save(); // runs schema validation (enums etc.)

    if (uploaded && oldImage) await removeImageIfUnused(oldImage, item._id);
    // When an item is closed, pending requests on it can no longer be accepted
    if (item.status !== 'open' && wasStatus === 'open') {
      await Claim.updateMany({ item: item._id, status: 'pending' }, { status: 'rejected' });
    }
    res.json(item);
  } catch (err) {
    deleteFile(uploaded);
    next(err);
  }
});

// DELETE /api/items/:id  (owner or admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const isOwner = String(item.postedBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed' });

    await Claim.deleteMany({ item: item._id });
    await item.deleteOne();
    await removeImageIfUnused(item.image, item._id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

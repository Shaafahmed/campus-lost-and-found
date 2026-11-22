const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'ID Card / Documents',
  'Books & Stationery',
  'Wallet / Money',
  'Keys',
  'Bags',
  'Clothing & Accessories',
  'Water Bottle',
  'Other',
];

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    image: { type: String, default: '' },
    status: { type: String, enum: ['open', 'claimed', 'resolved'], default: 'open' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contactInfo: { type: String, trim: true },
  },
  { timestamps: true }
);

// Text index for keyword search
itemSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;

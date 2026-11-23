const mongoose = require('mongoose');

const CATEGORIES = [
  'food',
  'transport',
  'housing',
  'utilities',
  'entertainment',
  'health',
  'shopping',
  'education',
  'income',
  'other',
];

const expenseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, enum: ['expense', 'income'], required: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be positive'] },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;

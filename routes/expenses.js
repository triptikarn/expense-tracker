const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const requireAuth = require('../middleware/auth');
const { summarise, monthlyTotals } = require('../utils/summary');

const router = express.Router();

// All expense routes require auth and are scoped to the owner.
router.use(requireAuth);

function ownerFilter(req, extra = {}) {
  return { owner: new mongoose.Types.ObjectId(req.userId), ...extra };
}

// GET /api/expenses?month=2026-11&category=food&type=expense — list entries
router.get('/', async (req, res) => {
  try {
    const filter = ownerFilter(req);
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.month) {
      const [year, month] = req.query.month.split('-').map(Number);
      if (year && month >= 1 && month <= 12) {
        filter.date = {
          $gte: new Date(Date.UTC(year, month - 1, 1)),
          $lt: new Date(Date.UTC(year, month, 1)),
        };
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ error: 'Could not load expenses' });
  }
});

// POST /api/expenses — add an entry
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, note, date } = req.body;
    if (!type || amount === undefined) {
      return res.status(400).json({ error: 'type and amount are required' });
    }

    const expense = await Expense.create({
      owner: req.userId,
      type,
      amount,
      category,
      note,
      date: date || undefined,
    });
    res.status(201).json({ expense });
  } catch (err) {
    res.status(400).json({ error: 'Could not create entry' });
  }
});

// PATCH /api/expenses/:id — update my entry
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['type', 'amount', 'category', 'note', 'date'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Entry not found' });
    res.json({ expense });
  } catch (err) {
    res.status(400).json({ error: 'Could not update entry' });
  }
});

// DELETE /api/expenses/:id — delete my entry
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!expense) return res.status(404).json({ error: 'Entry not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Could not delete entry' });
  }
});

// GET /api/expenses/summary — totals + per-category breakdown (all time,
// or ?month=2026-11 for a single month). Registered before /:id-style
// routes would ever shadow it — Express matches in order, and this path
// is a literal segment.
router.get('/summary', async (req, res) => {
  try {
    const match = ownerFilter(req);
    if (req.query.month) {
      const [year, month] = req.query.month.split('-').map(Number);
      if (year && month >= 1 && month <= 12) {
        match.date = {
          $gte: new Date(Date.UTC(year, month - 1, 1)),
          $lt: new Date(Date.UTC(year, month, 1)),
        };
      }
    }
    const items = await Expense.find(match).lean();
    res.json({ summary: summarise(items) });
  } catch (err) {
    res.status(500).json({ error: 'Could not build summary' });
  }
});

// GET /api/expenses/monthly — totals grouped by month
router.get('/monthly', async (req, res) => {
  try {
    const items = await Expense.find(ownerFilter(req)).lean();
    res.json({ monthly: monthlyTotals(items) });
  } catch (err) {
    res.status(500).json({ error: 'Could not build monthly report' });
  }
});

module.exports = router;

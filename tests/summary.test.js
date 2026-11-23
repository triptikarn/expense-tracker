const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarise, monthlyTotals } = require('../utils/summary');

test('summarise totals income, expense and balance', () => {
  const s = summarise([
    { type: 'income', amount: 50000, category: 'income' },
    { type: 'expense', amount: 1200.5, category: 'food' },
    { type: 'expense', amount: 300, category: 'transport' },
  ]);
  assert.equal(s.totalIncome, 50000);
  assert.equal(s.totalExpense, 1500.5);
  assert.equal(s.balance, 48499.5);
  assert.equal(s.count, 3);
});

test('summarise groups expenses by category (income excluded)', () => {
  const s = summarise([
    { type: 'expense', amount: 100, category: 'food' },
    { type: 'expense', amount: 50, category: 'food' },
    { type: 'expense', amount: 20, category: 'health' },
    { type: 'income', amount: 999, category: 'income' },
  ]);
  assert.deepEqual(s.byCategory, { food: 150, health: 20 });
});

test('summarise avoids floating-point drift', () => {
  const s = summarise([
    { type: 'expense', amount: 0.1, category: 'other' },
    { type: 'expense', amount: 0.2, category: 'other' },
  ]);
  assert.equal(s.totalExpense, 0.3);
});

test('summarise handles an empty list', () => {
  const s = summarise([]);
  assert.deepEqual(s, {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    byCategory: {},
    count: 0,
  });
});

test('monthlyTotals groups by YYYY-MM with balances', () => {
  const m = monthlyTotals([
    { type: 'income', amount: 1000, date: '2026-11-05T10:00:00Z' },
    { type: 'expense', amount: 250, date: '2026-11-20T10:00:00Z' },
    { type: 'expense', amount: 100, date: '2026-10-02T10:00:00Z' },
  ]);
  assert.deepEqual(m['2026-11'], { income: 1000, expense: 250, balance: 750 });
  assert.deepEqual(m['2026-10'], { income: 0, expense: 100, balance: -100 });
});

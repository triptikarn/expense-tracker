/**
 * Pure summary helpers — kept free of Express/Mongoose so they can be
 * unit-tested directly. Amounts are summed in the smallest currency
 * unit (cents/paise) to avoid floating-point drift.
 */

function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function fromCents(cents) {
  return Math.round(cents) / 100;
}

/**
 * Summarise a list of expense documents.
 * @param {Array<{type:string, amount:number, category:string}>} items
 * @returns {{totalIncome:number, totalExpense:number, balance:number,
 *            byCategory: Object<string, number>, count: number}}
 */
function summarise(items) {
  let incomeCents = 0;
  let expenseCents = 0;
  const byCategoryCents = {};

  for (const item of items) {
    const cents = toCents(item.amount);
    if (item.type === 'income') {
      incomeCents += cents;
    } else {
      expenseCents += cents;
      const cat = item.category || 'other';
      byCategoryCents[cat] = (byCategoryCents[cat] || 0) + cents;
    }
  }

  const byCategory = {};
  for (const [cat, cents] of Object.entries(byCategoryCents)) {
    byCategory[cat] = fromCents(cents);
  }

  return {
    totalIncome: fromCents(incomeCents),
    totalExpense: fromCents(expenseCents),
    balance: fromCents(incomeCents - expenseCents),
    byCategory,
    count: items.length,
  };
}

/**
 * Group items by calendar month ("2026-11") with per-month totals.
 * @param {Array<{type:string, amount:number, date:Date|string}>} items
 * @returns {Object<string, {income:number, expense:number, balance:number}>}
 */
function monthlyTotals(items) {
  const months = {};

  for (const item of items) {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    const cents = toCents(item.amount);
    if (item.type === 'income') months[key].income += cents;
    else months[key].expense += cents;
  }

  const result = {};
  for (const [key, m] of Object.entries(months)) {
    result[key] = {
      income: fromCents(m.income),
      expense: fromCents(m.expense),
      balance: fromCents(m.income - m.expense),
    };
  }
  return result;
}

module.exports = { summarise, monthlyTotals, toCents, fromCents };

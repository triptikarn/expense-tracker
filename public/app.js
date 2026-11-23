// Expense Tracker frontend — talks to the Express API in ../routes
const API = '/api';
let token = localStorage.getItem('et_token') || null;
let mode = 'login'; // or 'register'
let currency = 'INR';

const $ = (id) => document.getElementById(id);

function fmt(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---------- Auth ----------

$('switchMode').addEventListener('click', (e) => {
  e.preventDefault();
  mode = mode === 'login' ? 'register' : 'login';
  $('authTitle').textContent = mode === 'login' ? 'Log in' : 'Create an account';
  $('authSubmit').textContent = mode === 'login' ? 'Log in' : 'Sign up';
  $('nameField').classList.toggle('hidden', mode === 'login');
  $('switchText').textContent = mode === 'login' ? 'New here?' : 'Already have an account?';
  $('switchMode').textContent = mode === 'login' ? 'Create an account' : 'Log in';
  $('authError').classList.add('hidden');
});

$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { email: $('emailInput').value.trim(), password: $('passwordInput').value };
  if (mode === 'register') body.name = $('nameInput').value.trim();

  try {
    const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
    token = data.token;
    currency = data.user.currency || 'INR';
    localStorage.setItem('et_token', token);
    localStorage.setItem('et_name', data.user.name);
    localStorage.setItem('et_currency', currency);
    showDashboard();
  } catch (err) {
    $('authError').textContent = err.message;
    $('authError').classList.remove('hidden');
  }
});

$('logoutBtn').addEventListener('click', () => {
  token = null;
  localStorage.removeItem('et_token');
  $('dashView').classList.add('hidden');
  $('userBar').classList.add('hidden');
  $('authView').classList.remove('hidden');
});

// ---------- Dashboard ----------

async function refresh() {
  const [{ summary }, { expenses }] = await Promise.all([
    api('/expenses/summary'),
    api('/expenses'),
  ]);

  $('statIncome').textContent = fmt(summary.totalIncome);
  $('statExpense').textContent = fmt(summary.totalExpense);
  $('statBalance').textContent = fmt(summary.balance);

  drawChart(summary.byCategory);
  renderEntries(expenses);
}

function drawChart(byCategory) {
  const canvas = $('chart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  $('chartEmpty').classList.toggle('hidden', entries.length > 0);
  if (!entries.length) return;

  const max = entries[0][1];
  const barHeight = 26;
  const gap = 12;
  const labelWidth = 110;

  ctx.font = '13px "Segoe UI", sans-serif';
  entries.slice(0, 8).forEach(([category, value], i) => {
    const y = 10 + i * (barHeight + gap);
    const width = ((canvas.width - labelWidth - 70) * value) / max;
    ctx.fillStyle = '#1f2a24';
    ctx.fillText(category, 4, y + barHeight / 2 + 4);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(labelWidth, y, width, barHeight);
    ctx.fillStyle = '#1f2a24';
    ctx.fillText(fmt(value), labelWidth + width + 8, y + barHeight / 2 + 4);
  });
}

function renderEntries(expenses) {
  const list = $('entryList');
  list.innerHTML = '';
  for (const entry of expenses.slice(0, 30)) {
    const li = document.createElement('li');

    const left = document.createElement('div');
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = entry.note || entry.category;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${entry.category} · ${new Date(entry.date).toLocaleDateString()}`;
    left.append(note, meta);

    const right = document.createElement('div');
    const amt = document.createElement('span');
    amt.className = `amt ${entry.type === 'income' ? 'in' : 'out'}`;
    amt.textContent = `${entry.type === 'income' ? '+' : '−'} ${fmt(entry.amount)}`;
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      await api(`/expenses/${entry._id}`, { method: 'DELETE' });
      refresh();
    });
    right.append(amt, del);

    li.append(left, right);
    list.appendChild(li);
  }
}

$('entryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await api('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      type: $('typeInput').value,
      amount: Number($('amountInput').value),
      category: $('categoryInput').value,
      note: $('noteInput').value.trim(),
      date: $('dateInput').value || undefined,
    }),
  });
  $('amountInput').value = '';
  $('noteInput').value = '';
  refresh();
});

// ---------- Boot ----------

function showDashboard() {
  $('authView').classList.add('hidden');
  $('dashView').classList.remove('hidden');
  $('userBar').classList.remove('hidden');
  $('userName').textContent = localStorage.getItem('et_name') || '';
  currency = localStorage.getItem('et_currency') || currency;
  refresh();
}

if (token) showDashboard();

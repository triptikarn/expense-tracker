# Expense Tracker

A full-stack personal finance app: track income and expenses, see category breakdowns and monthly reports, and keep everything private behind JWT authentication. An Express + MongoDB REST API on the backend with a dependency-free vanilla JavaScript dashboard — including a hand-drawn canvas bar chart, no chart library.

## Features

- **User accounts** — register & login with bcrypt-hashed passwords and JWT sessions
- **Income & expense entries** — amount, category, note and date, all scoped to the owner
- **Live dashboard** — total income, total expenses and balance at a glance
- **Category breakdown** — spending per category rendered as a canvas bar chart
- **Reports API** — `/summary` for totals + per-category sums, `/monthly` for month-by-month income/expense/balance
- **Filters** — list entries by month, category or type
- **Careful money math** — sums are computed in cents to avoid floating-point drift

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML, CSS, vanilla JavaScript (fetch API, Canvas) |
| Backend  | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth     | JSON Web Tokens (jsonwebtoken) + bcryptjs |

## Getting started

```bash
git clone https://github.com/triptikarn/expense-tracker.git
cd expense-tracker
npm install
cp .env.example .env   # fill in MONGO_URI and a strong JWT_SECRET
npm run dev            # or: npm start
```

Open http://localhost:5001 — the API and the dashboard are served by the same Express app.

## API reference

| Method | Endpoint                | Auth | Description |
|--------|-------------------------|------|-------------|
| POST   | `/api/auth/register`    | —    | Create an account |
| POST   | `/api/auth/login`       | —    | Log in, receive a JWT |
| GET    | `/api/expenses`         | JWT  | List my entries (filters: `?month=2026-11`, `?category=`, `?type=`) |
| POST   | `/api/expenses`         | JWT  | Add an entry |
| PATCH  | `/api/expenses/:id`     | JWT  | Update my entry |
| DELETE | `/api/expenses/:id`     | JWT  | Delete my entry |
| GET    | `/api/expenses/summary` | JWT  | Totals + per-category breakdown |
| GET    | `/api/expenses/monthly` | JWT  | Totals grouped by month |
| GET    | `/api/health`           | —    | Health check |

Send the token as `Authorization: Bearer <token>` on authenticated routes.

## Tests

```bash
npm test   # node:test unit tests for the summary math and JWT helper
```

## Project structure

```
expense-tracker/
├── server.js            # Express app + startup
├── models/              # Mongoose schemas (User, Expense)
├── routes/              # /api/auth and /api/expenses routers
├── middleware/auth.js   # JWT route protection
├── utils/               # token.js (JWT) + summary.js (report math)
├── public/              # frontend (index.html, styles.css, app.js)
└── tests/               # unit tests
```

## License

MIT © Tripti Karn

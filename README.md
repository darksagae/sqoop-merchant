# Sqoop Merchant

**Sell more. Count less.** Sqoop is a simple back office for growing shops: take orders, keep stock right and see sales across every branch from any phone. It is priced in Uganda shillings.

Built for Galuxium Nexus V2.

## Features

- **Workspaces:** each shop signs up for its own isolated workspace (business, owner account and first store). Every query is scoped to the signed-in workspace.
- **Live demo:** opening the site drops a new visitor straight into a fresh demo shop with 12 products, 2 branches and two weeks of orders ("Try the demo shop" on the sign-in page does the same). Demo shops are deleted after a week.
- **Products:** SKU, price, stock and reorder level; low-stock flags; search; archive and restore; total stock value.
- **Orders:** a fast order builder with product search, quantity steppers that can't exceed stock, a running total, optional customer details, and paid-now or pay-later.
  - Status flow: pending → paid (cash / mobile money / card) → fulfilled, or cancel.
  - Stock is taken out when an order is created and put back when it is cancelled, inside one database transaction.
  - Order numbers are sequential per workspace, and receipts print cleanly.
- **Dashboard:** revenue this month vs last, paid orders, average order, open orders, a 14-day revenue chart, low stock, recent orders and best sellers.
- **Stores & team:** add and rename branches. Owners add or remove staff and rename the business; staff can sell and manage products.
- **Billing:** live usage meters (stores, team members, non-cancelled orders this month) and an itemised estimate, monthly or annual. The logic lives in `lib/pricing.ts`.

## Pricing model

One plan. UGX 25,000 a month includes 1 store, 3 team members and 100 orders. Beyond that:

| Extra       | Price      |
| ----------- | ---------- |
| Store       | UGX 10,000 |
| Team member | UGX 3,000  |
| Order       | UGX 100    |

Annual billing charges 10 months. The logic lives in [`lib/pricing.ts`](lib/pricing.ts). The prototype never collects payments.

## Security

| Concern   | How it is handled                                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passwords | scrypt (N=16384, r=8, p=1) with a per-user salt. Unknown emails are checked against a dummy hash so timing doesn't reveal accounts.                                              |
| Sessions  | A random 256-bit token in an `httpOnly`, `SameSite=Lax` cookie. Only its SHA-256 hash is stored, and sessions expire after 30 days.                                              |
| Tenancy   | Every repository function takes the workspace ID and filters on it. Orders can't reference another workspace's products or stores. Tests cover cross-workspace reads and writes. |
| Writes    | Server Actions, which Next.js checks for same-origin. Input is validated with zod, and stock changes run in SQL transactions with `CHECK` constraints.                           |
| Abuse     | Per-IP and per-email rate limits on sign-in, sign-up and demo creation.                                                                                                          |
| Browser   | Per-request nonce CSP (`proxy.ts`), `frame-ancestors 'none'`, `no-referrer`, `nosniff`.                                                                                          |

Set `SQOOP_SECURE_COOKIES=1` when serving over HTTPS without a proxy that sends `X-Forwarded-Proto` (Vercel and most proxies send it).

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · zod · SQLite via Node's built-in `node:sqlite` · Vitest · Playwright.

```
app/                   (auth)/login|signup, app/* (dashboard, orders, products, settings, billing)
components/            UI: order builder, revenue chart, forms
lib/
  repo/                accounts, team, stores, products, orders, stats, demo (all workspace-scoped)
  actions/             server actions for auth, catalogue, orders, settings
  auth.ts session.ts passwords.ts pricing.ts validation.ts db.ts
proxy.ts               per-request CSP nonce
tests/unit/            pricing, accounts and sessions, orders/stock/tenancy, demo seed
tests/e2e/             sign up → product → order → paid → fulfilled → reports → isolation → sign in
```

## Run it

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev            # http://localhost:3000
```

Production: `npm run build && npm start`. Data is stored in `data/sqoop.sqlite3`; set `SQOOP_DB` to change the location.

## Test

```sh
npm test               # 17 unit tests
npm run lint           # formatting and type check
npm run build && npm run test:e2e   # 3 browser journeys on desktop and mobile
```

Set `CHROMIUM_PATH` to use an existing Chromium for Playwright.

## Next steps

- Hosted Postgres and a shared rate-limit store before running more than one instance.
- Password reset and email verification.
- A mobile-money payment sandbox (e.g. MTN MoMo or Airtel Money) for real collection.
- Per-store stock levels and stock transfers.
- CSV export.

## License

MIT

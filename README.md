# Wholesale Distributor Management System

A full-stack, production-ready **Dealer Inventory, Delivery, Billing, and Payment Tracking Web Application** designed for wholesale distributors who manage daily stock shipments, deliver to local retail shops, track customer credit limits, and monitor outstanding payment collections.

---

## 🚀 Getting Started

The system is configured to run out-of-the-box using file-based **SQLite** for local zero-configuration development, with support for **PostgreSQL** in production environments.

### 1. Installation

From the root directory, install all dependencies for the workspace, server, and client apps:
```bash
npm run setup
```

### 2. Database Sync & Initial Seeding

Run the migrations to create the database schema and populate it with initial categories, products, shops, and default administrator credentials:
```bash
npm run db:migrate
```

*The seed script will create a default administrator:*
* **Username:** `admin`
* **Password:** `admin123`

### 3. Running Locally (Development Mode)

Launch both the Node Express API server (on port `5000`) and the Vite React client (on port `3000`) concurrently:
```bash
npm run dev
```

Open your browser to `http://localhost:3000` to interact with the application.

---

## 🗄️ Database Configurations

You can swap between database providers (SQLite and PostgreSQL) at any time.

* **To Use Local SQLite (Default):**
  ```bash
  npm run use-sqlite
  npm run db:migrate
  ```
* **To Use PostgreSQL:**
  Modify `server/.env` (or create one using the templates) and add your connection string, then run:
  ```bash
  npm run use-postgres
  npm run db:migrate
  ```

---

## 🛠️ File Structure & Architecture

```
├── package.json          # Root orchestration scripts
├── README.md             # Documentation guide
├── scripts/              # Switch-db automation scripts
├── prisma/               # Shared schema files
└── server/               # Express backend application
    ├── src/
    │   ├── index.js      # App entry point
    │   ├── controllers/  # Business controllers
    │   ├── routes/       # API endpoints definitions
    │   └── middleware/   # Route guards & error handlers
└── client/               # Vite React client application
    ├── src/
    │   ├── App.jsx       # Routing panel
    │   ├── main.jsx      # Vite React mounter
    │   ├── index.css     # Premium styling themes & print-only sheets
    │   ├── services/     # API fetch utilities
    │   ├── hooks/        # Auth Context hooks
    │   ├── components/
    │   │   ├── layout/   # Sidebar / Header wrappers
    │   │   └── ui/       # Custom components (Button, Cards, Modals)
    │   └── pages/        # Dashboard, CRUD modules, and Reports views
```

---

## 💎 Premium Features Implemented

1. **Authentication:** Secure session routes guarded by JSON Web Token (JWT) tokens.
2. **Dashboard Visualizations:** Real-time analytics stats cards, area charts for sales ledgers, and horizontal bar charts for debtor credits using **Recharts**.
3. **Automated Stock Deductions:**
   * Incoming Stock replenishment increases product catalog stocks.
   * Dispatched Delivery Invoices deduct from catalog stocks (with validations to block negative stock levels).
4. **Account Balances (Dues):**
   * Invoice dispatches add to outstanding shop balances.
   * Collections subtract from remaining invoice dues and shop balances.
5. **FIFO Collection Routing:** Logs general payments against customer accounts, automatically applying allocations to the oldest unpaid invoices first (FIFO).
6. **Printable Invoices:** High-fidelity business invoice structures that render clean print-previews and call `window.print()` dynamically.
7. **CSV Exports:** Client-side CSV generation allowing data downloads directly to Excel format.
8. **JSON Data Backups:** Allows administrators to download structured JSON snapshots of the system database.

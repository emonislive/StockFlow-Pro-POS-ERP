# StockFlow Pro POS & ERP

A high-performance, commercial-grade Mini POS, Inventory, and Retail ERP suite built with a decoupled **Laravel 11/13 REST API**, **Next.js 16 (App Router) Frontend**, and a dual **SQLite / MySQL Database Architecture**.

Designed with a distinctive **Regal Purple and Imperial Gold** aesthetic, dense tabular numbers, tactile micro-interactions, dark and light modes, and zero em/en-dashes.

---

## System Overview & Architecture

```
                       +-----------------------------------+
                       |      Next.js 16 Client (App)      |
                       |    Tailwind CSS | React 19        |
                       |  Regal Purple & Imperial Gold     |
                       +-----------------+-----------------+
                                         |
                                         | REST / JSON
                                         | Bearer Token (Sanctum)
                                         v
                       +-----------------------------------+
                       |     Laravel 11/13 API Backend     |
                       |    Sanctum Auth | RBAC Guard      |
                       |   Auditable Trait | Transactions  |
                       +-----------------+-----------------+
                                         |
                                         | Eloquent ORM
                                         v
                       +-----------------------------------+
                       |   Database (SQLite / MySQL 8.x)   |
                       | Indexed SKUs, Barcodes, Ledgers   |
                       +-----------------------------------+
```

- **Frontend Client**: Next.js 16 with Turbopack, React 19, Tailwind CSS, hardware Barcode Scanner listener hook, real-time API health monitor, interactive admin endpoint explorer, and CSS print-optimized 80mm/58mm thermal receipt layouts.
- **Backend API**: Laravel 11/13, Laravel Sanctum token authentication, atomic multi-step `DB::transaction()` checkout and payment execution, automated `Auditable` observer logging JSON state diffs into `audit_logs`, and security headers middleware.
- **Database Engine**: Zero-configuration SQLite for immediate plug-and-play development, fully compatible with MySQL 8.x (InnoDB) with indexes on Barcodes, SKUs, Customer Phone numbers, and Expense dates.

---

## One-Click Quick Start (Windows)

Launch both services simultaneously using the root launcher:

```cmd
# Double click or run from terminal:
start-all.bat
```

Or start each service in its own terminal window:
- **Backend API**: Run `start-backend.bat` (available at `http://127.0.0.1:8000`)
- **Frontend App**: Run `start-frontend.bat` (available at `http://localhost:3000`)

---

## Default Access Credentials

The database seeder provisions two default accounts with distinct role capabilities:

| Role | Email | Password | Access Clearance |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stockflow.com` | `password123` | Full access: POS, Inventory, Category/Unit creation, Expenses, Baki Khata, Financial Statements, Audit Trail, and API Explorer |
| **Store Cashier** | `cashier@stockflow.com` | `password123` | Terminal operations: POS Checkout, Invoice history, Customer Due Collection. Category/Unit creation is locked to select-only |

*Quick-fill credentials buttons are provided directly on the login screen for testing convenience.*

---

## Feature Matrix & How Everything Works

### 1. Real-Time API Health Indicator
- **Live Header Beacon**: Positioned in the navigation header next to the live clock. Automatically polls `GET /api/health` every 30 seconds.
- **Visual Status**: Shows a pulsing green indicator with `API: Online` and round-trip latency in milliseconds (e.g. `12ms`). Switches to amber/red `API: Offline` if connectivity is interrupted.
- **Interactive Diagnostics Modal**: Clicking the indicator opens an instant diagnostic inspection:
  - Database engine and connection status (`Connected`, `0.42ms` query latency).
  - Runtime environment details: PHP version (`8.5.10`), Laravel framework version (`13.29.0`), and Memory footprint.
  - "Test Connection Now" button for immediate on-demand polling.
  - Direct shortcut for administrators to the API Endpoints Explorer.

### 2. Admin API Endpoints Explorer & Documentation (`/admin/endpoints`)
- **Admin Clearance Guard**: Accessible only to users with the `admin` role via the sidebar navigation item (badged with `REST`). Non-admin visitors see an authorization restriction notice.
- **Comprehensive Catalog (23 Endpoints)**: Introspects all registered routes across 8 core modules: System, Auth, Products, Categories, POS Sales, Customer Ledger, Expenses, and Audit Reports.
- **Method Badges**: Color-coded badges for `GET` (Regal Purple), `POST` (Imperial Gold), `PUT` (Blue), and `DELETE` (Red).
- **Interactive Filtering Matrix**: Filter by HTTP method, module dropdown, access clearance (`Public`, `Admin Only`, `Cashier & Admin`), or live search across paths, handlers, and parameters.
- **Parameter Schemas**: Structured table listing parameter names, data types, requirement flags (`REQUIRED` vs `OPTIONAL`), and descriptions.
- **cURL Request Generator**: Generates formatted cURL command examples with auto-injected headers and Bearer auth tokens.
- **Live Test Ping**:
  - Runs live `GET` requests against the backend and renders status codes (`200 OK`), latency (ms), and formatted JSON output with copy functionality.
  - Safe dry-run schema previews for mutating requests (`POST`, `PUT`, `DELETE`).

### 3. High-Speed POS Terminal (`/pos`)
- **Hardware Barcode Scanner Listener**: The `useBarcodeScanner` hook continuously monitors keyboard scan bursts from USB or Bluetooth barcode guns without requiring the search input to be focused. Scanning a barcode automatically adds the item to the cart or increments its quantity.
- **Dynamic Cart Calculations**: Subtotal, line-item discounts, VAT, net payable, and cash change return are calculated on every keystroke.
- **Baki Khata Integration**: Dropdown customer selector displaying existing ledger debt in red. Includes an inline modal to register a new credit customer on the spot.
- **CSS Print-Ready Thermal Receipt**: Generates 80mm and 58mm receipts with store headers, itemized breakdowns, cashier signature line, and barcode footers.

### 4. Role-Based Category & Unit Management
- **Admin Capability**: Administrators can create new product categories and units of measure on the fly directly inside the product modal using the "+ Add new" toggle or selecting "+ Create New...".
- **Cashier Safety Restriction**: Cashiers can only select from existing, approved categories and units. Creation controls are automatically hidden to prevent taxonomy duplication or clutter.

### 5. Warehouse Inventory Management (`/inventory`)
- **Live Search & Filter**: Search products by name, SKU, or barcode; filter by category.
- **Stock Depletion Warnings**: Quantities below 10 units display stark amber/red low stock alerts.
- **Atomic Stock Adjustment**: Operators can adjust quantities using `Set (=)`, `Add (+)`, or `Subtract (-)`. Every adjustment requires a mandatory reason, which is automatically recorded in the audit trail.

### 6. Customer Credit Ledger (Baki Khata) (`/customers`)
- **Storewide Receivables Banner**: Displays the total outstanding credit balance across all customers.
- **Customer Directory**: Search customers by name or phone number, with a quick filter toggle for debtors only.
- **Atomic Due Collection**: Modal to collect partial or full debt payments via Cash, Card, or Mobile Financial Services (bKash/Nagad), with instant credit balance updates and audit logging.

### 7. Operational Expense Tracking (`/expenses`)
- **Categorized Overhead**: Track rent, utilities, salaries, supplies, maintenance, and marketing expenses.
- **Date Filtering**: View daily, weekly, or monthly expenses with automatic category totals.
- **P&L Impact**: Logged expenses are immediately reflected in the Profit & Loss statement.

### 8. System Audit Trail (`/audit-logs`)
- **Automated Logging**: The backend `Auditable` observer automatically captures every checkout, stock adjustment, due collection, and CRUD mutation.
- **JSON State Diff Viewer**: Interactive before-and-after attribute diffs showing exactly who changed what, when, and from which IP address.

### 9. Financial Statements & Executive Reports (`/reports`)
- **Sales Summary Ledger**: Filterable invoice history with payment method breakdowns.
- **Itemized Profit & Loss (P&L)**: Real-time calculation of Gross Sales, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Operating Margin.
- **Low Stock Report**: Exportable reorder list for depleted stock.
- **Commercial Print Engine**: Formatted print layout tailored for formal accounting statements and tax documentation.

### 10. Executive Dashboard (`/dashboard`)
- Real-time KPI summary cards: Today Gross Sales, Monthly Revenue, Operating Expenses, Net Operating Margin, and Total Baki Khata Receivables.
- Live low stock warning table with direct restock links.
- Recent completed invoices stream with operator metadata.
- Top selling products leaderboard.

---

## Design System & Aesthetic Standards

- **Color Palette**:
  - Primary Action / Accent: Regal Purple (`#6b21a8` Light / `#7e22ce` Dark)
  - Secondary Highlight: Imperial Gold (`#b45309` Light / `#fbbf24` Dark)
  - Surface Backgrounds: Architectural Bone (`#f8f7f4`) in Light Mode, Charcoal Obsidian (`#111215`, `#17191e`) in Dark Mode
  - Warning / Debt: Brick Ochre (`#c2410c`) and Signal Coral (`#f87171`)
- **Typography**: Dense tabular numbers with `font-mono tabular-nums` for alignment of monetary figures and timestamps.
- **Dark Mode**: Integrated theme toggle in the header with persistent localStorage storage and smooth transitions.
- **Strict Copy Rule**: Zero em-dashes (`—`) or en-dashes (`–`) anywhere across all user-facing interfaces and documentation.

---

## Manual Step-by-Step Installation

### Prerequisites
- PHP 8.2 or higher with `pdo_sqlite` or `pdo_mysql`, `mbstring`, `openssl`, and `tokenizer` extensions.
- Node.js 18.x or higher with npm.
- Composer 2.x.

### 1. Backend Setup (Laravel API)
```bash
cd backend

# Copy environment configuration
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations and seed sample retail catalog and test users
php artisan migrate:fresh --seed

# Start the Laravel API server
php artisan serve --port=8000
```

> [!NOTE]
> The backend defaults to zero-configuration SQLite (`database/database.sqlite`). To use MySQL instead, set `DB_CONNECTION=mysql` in `backend/.env` with your MySQL credentials and re-run migrations.

### 2. Frontend Setup (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## REST API Catalog Summary

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health, database latency, and runtime metrics |
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive Sanctum Bearer token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke active access token |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated profile |
| `GET` | `/api/admin/endpoints` | Admin Only | Complete API route catalog and documentation |
| `GET` | `/api/products` | Authenticated | Searchable product inventory list |
| `POST` | `/api/products` | Admin Only | Create a new product |
| `GET` | `/api/products/{id}` | Authenticated | Single product details |
| `PUT` | `/api/products/{id}` | Admin Only | Update product details |
| `DELETE` | `/api/products/{id}` | Admin Only | Delete product |
| `POST` | `/api/products/{id}/adjust-stock` | Authenticated | Atomic stock adjustment with audit reason |
| `GET` | `/api/categories` | Authenticated | List all product categories |
| `POST` | `/api/categories` | Admin Only | Create a new category |
| `GET` | `/api/units` | Authenticated | List all measurement units |
| `POST` | `/api/units` | Admin Only | Create a new measurement unit |
| `GET` | `/api/sales` | Authenticated | Sales ledger and transaction history |
| `POST` | `/api/sales` | Authenticated | Atomic POS checkout transaction |
| `GET` | `/api/sales/{id}` | Authenticated | Order invoice details with line items |
| `GET` | `/api/customers` | Authenticated | Customer directory and credit ledger |
| `POST` | `/api/customers` | Authenticated | Register a new customer |
| `GET` | `/api/customers/{id}` | Authenticated | Customer details and order history |
| `POST` | `/api/customers/{id}/collect-due` | Authenticated | Atomic due payment collection |
| `GET` | `/api/expenses` | Authenticated | Operational expenses ledger |
| `POST` | `/api/expenses` | Authenticated | Record an operational expense |
| `DELETE` | `/api/expenses/{id}` | Admin Only | Remove an expense entry |
| `GET` | `/api/audit-logs` | Admin Only | System security and audit trail logs |
| `GET` | `/api/reports/dashboard` | Authenticated | Real-time business KPIs and alert metrics |
| `GET` | `/api/reports/sales-summary` | Authenticated | Date-filtered sales and revenue breakdown |
| `GET` | `/api/reports/stock-alert` | Authenticated | Products below reorder thresholds |
| `GET` | `/api/reports/profit-loss` | Admin Only | Itemized Profit and Loss financial statement |

---

## License

This project is licensed under the MIT License.
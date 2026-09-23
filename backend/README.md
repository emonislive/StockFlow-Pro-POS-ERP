# StockFlow Pro - Backend REST API

Commercial-grade, high-reliability RESTful API backend for StockFlow Pro POS & ERP built with **Laravel 11/13**, **Laravel Sanctum**, and a dual **SQLite / MySQL Database Architecture**.

Designed for transaction safety, audit compliance, and strict role-based access control.

---

## Technical Stack

- **Framework**: Laravel 11/13
- **PHP Version**: PHP 8.2 or higher (verified on PHP 8.5.10)
- **Authentication**: Laravel Sanctum Bearer token authentication
- **Database**: Zero-configuration SQLite (`database/database.sqlite`) with full MySQL 8.x (InnoDB) compatibility
- **Architecture**: Service/Controller architecture with atomic `DB::transaction()` blocks and automated Eloquent audit observers

---

## Security & Architecture Highlights

### 1. Atomic Transaction Guarantees
All multi-step financial and inventory mutations are strictly wrapped inside atomic `DB::transaction()` closures to guarantee ACID compliance:
- **POS Checkout (`POST /api/sales`)**: Creates the order record, inserts line items, decrements product stock, updates customer credit debt if unpaid, and records an audit log entry in a single atomic transaction. Any error triggers an immediate database rollback.
- **Due Payment Collection (`POST /api/customers/{id}/collect-due`)**: Creates a payment invoice, decrements customer credit balance, and logs the transaction atomically.
- **Stock Adjustment (`POST /api/products/{id}/adjust-stock`)**: Atomically updates product inventory while recording the adjustment delta and mandatory operator reason in the audit trail.

### 2. Automated State Diff Auditing (`Auditable` Trait)
- Every critical Eloquent model (`Product`, `Order`, `Customer`, `Expense`, `Category`, `Unit`) utilizes an `Auditable` observer trait.
- Automatically captures the operator's User ID, action (`created`, `updated`, `deleted`, `checkout`, `stock_adjusted`, `due_collected`), IP address, user agent, and a JSON diff of old values versus new values into the `audit_logs` table.

### 3. Role-Based Access Control (RBAC)
- Custom middleware `RoleMiddleware` enforces granular access clearances:
  - `role:admin`: Access to all routes, including Category/Unit creation, Product management, Expense deletion, Audit logs, Financial reports, and the API Endpoints Catalog.
  - `role:cashier`: Restricted to POS Checkout, Sales history, and Customer due collection.
- Unauthorized attempts return HTTP 403 Forbidden with descriptive error messages.

### 4. Security Headers Middleware
- `SecurityHeadersMiddleware` enforces enterprise security headers on every response:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Directory Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php      # User Authentication & Profile
│   │   │       ├── AuditLogController.php  # Audit Trail Querying
│   │   │       ├── CategoryController.php  # Category Taxonomy Management
│   │   │       ├── CustomerController.php  # Baki Khata & Due Collection
│   │   │       ├── ExpenseController.php   # Operational Expense Tracking
│   │   │       ├── ProductController.php   # Product Inventory & Adjustments
│   │   │       ├── ReportController.php    # KPIs, Sales & Profit/Loss
│   │   │       ├── SaleController.php      # POS Atomic Checkouts
│   │   │       ├── SystemController.php    # API Health & Endpoints Catalog
│   │   │       └── UnitController.php      # Unit of Measure Management
│   │   └── Middleware/
│   │       ├── RoleMiddleware.php          # RBAC Route Authorization Guard
│   │       └── SecurityHeadersMiddleware.php # HTTP Security Headers
│   ├── Models/
│   │   ├── AuditLog.php                    # Immutable Audit Trail Record
│   │   ├── Category.php                    # Product Category Taxonomy
│   │   ├── Customer.php                    # Customer & Baki Khata Account
│   │   ├── Expense.php                     # Operational Expense Record
│   │   ├── Order.php                       # Sales Invoice Header
│   │   ├── OrderItem.php                   # Itemized Sale Line Item
│   │   ├── Product.php                     # Warehouse Inventory Product
│   │   ├── Unit.php                        # Unit of Measure Taxonomy
│   │   └── User.php                        # Sanctum Authenticated Operator
│   └── Traits/
│       └── Auditable.php                   # Model State Diff Observer
├── config/                                 # Laravel Application Config
├── database/
│   ├── migrations/                         # Indexed Table Migrations
│   ├── seeders/
│   │   └── DatabaseSeeder.php              # Sample Retail Catalog & Users
│   └── database.sqlite                     # Zero-Config Development Database
├── routes/
│   └── api.php                             # REST API Route Declarations
└── artisan                                 # CLI Tool
```

---

## Complete REST API Catalog (23 Endpoints)

### 1. System & Health
- `GET /api/health` (Public): Returns operational health status, SQLite database connectivity, latency measurement, PHP/Laravel versions, and memory usage.
- `GET /api/admin/endpoints` (Admin Only): Returns an exhaustive catalog of all 23 API endpoints, parameter schemas, and access levels.

### 2. Authentication & Profile
- `POST /api/auth/register` (Public): Register a new user account.
- `POST /api/auth/login` (Public): Authenticate credentials and generate Sanctum Bearer token.
- `POST /api/auth/logout` (Authenticated): Revoke current active access token.
- `GET /api/auth/me` (Authenticated): Retrieve authenticated user profile and role.

### 3. Inventory & Products
- `GET /api/products` (Authenticated): Filterable product catalog (search, category, low stock filter).
- `POST /api/products` (Admin Only): Create a new product.
- `GET /api/products/{id}` (Authenticated): Retrieve single product details.
- `PUT /api/products/{id}` (Admin Only): Update product specifications.
- `DELETE /api/products/{id}` (Admin Only): Delete product from inventory.
- `POST /api/products/{id}/adjust-stock` (Authenticated): Atomically adjust quantity with `Set`, `Add`, or `Subtract` and a mandatory reason.

### 4. Categories & Units of Measure
- `GET /api/categories` (Authenticated): List all product categories.
- `POST /api/categories` (Admin Only): Create a new category.
- `GET /api/units` (Authenticated): List all units of measure.
- `POST /api/units` (Admin Only): Create a new unit of measure.

### 5. POS Sales & Checkout
- `GET /api/sales` (Authenticated): Query sales invoices with pagination and date filters.
- `POST /api/sales` (Authenticated): Atomic multi-item POS checkout with stock decrement and optional Baki Khata credit debt update.
- `GET /api/sales/{id}` (Authenticated): Itemized invoice details for thermal receipt printing.

### 6. Customer Credit Ledger (Baki Khata)
- `GET /api/customers` (Authenticated): List customers with outstanding debt summary.
- `POST /api/customers` (Authenticated): Register a new customer account.
- `GET /api/customers/{id}` (Authenticated): Customer credit ledger history.
- `POST /api/customers/{id}/collect-due` (Authenticated): Atomic due collection with instant credit deduction.

### 7. Operational Expenses
- `GET /api/expenses` (Authenticated): Filterable expense records by date and category.
- `POST /api/expenses` (Authenticated): Log an operational expense.
- `DELETE /api/expenses/{id}` (Admin Only): Delete an expense record.

### 8. System Audit & Financial Analytics
- `GET /api/audit-logs` (Admin Only): Activity logs with JSON before-and-after attribute diffs.
- `GET /api/reports/dashboard` (Authenticated): Key performance indicators (Today Gross, Month Revenue, Low Stock).
- `GET /api/reports/sales-summary` (Authenticated): Date-filtered sales and revenue breakdown.
- `GET /api/reports/stock-alert` (Authenticated): Products below reorder thresholds.
- `GET /api/reports/profit-loss` (Admin Only): Itemized Profit & Loss statement (Revenue, COGS, Gross Profit, Expenses, Margin).

---

## Installation & Setup

### 1. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

Generate the application encryption key:
```bash
php artisan key:generate
```

### 2. Database Setup

#### Option A: Zero-Configuration SQLite (Default)
The project comes pre-configured with SQLite:
```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

Run migrations and seed default data:
```bash
php artisan migrate:fresh --seed
```

#### Option B: MySQL 8.x
If connecting to MySQL (e.g. Laragon, XAMPP, or standalone MySQL):
1. Create a database named `stockflow_pro`.
2. Update `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=stockflow_pro
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Run migrations and seed data:
   ```bash
   php artisan migrate:fresh --seed
   ```

### 3. Start API Server
```bash
php artisan serve --port=8000
```
The API is available at `http://127.0.0.1:8000/api`.

---

## Seeded Default Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stockflow.com` | `password123` | Full access to all endpoints including admin catalog, P&L, and taxonomy creation |
| **Cashier** | `cashier@stockflow.com` | `password123` | Operational access to POS checkout, customer due collection, and inventory lookup |

---

## Testing & Verification

Run health check:
```bash
curl http://127.0.0.1:8000/api/health
```

Run automated endpoint test script:
```powershell
powershell -ExecutionPolicy Bypass -File ../scratch/test_endpoints.ps1
```

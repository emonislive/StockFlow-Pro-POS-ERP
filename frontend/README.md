# StockFlow Pro - Frontend Application

Modern, high-performance retail ERP client built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS**, and **Turbopack**.

Features a bespoke **Regal Purple and Imperial Gold** design aesthetic, dark and light mode support, hardware barcode scanner listener, real-time API health monitor, and an interactive Admin API Explorer.

---

## Technical Stack & Libraries

- **Framework**: Next.js 16.3 (App Router with Turbopack)
- **UI Runtime**: React 19
- **Styling**: Tailwind CSS with custom CSS variables, tactile micro-transitions, and custom scrollbars
- **Typography**: Geist Sans & Geist Mono with `tabular-nums` formatting for financial figures
- **Icons**: Custom lightweight SVG icon library (`components/Icons.tsx`)
- **API Service**: Native `fetch` wrapper with Bearer token injection and global error interception (`services/api.ts`)

---

## Design System & Theme Tokens

### Color Palette Architecture
| Role | Light Mode Token | Dark Mode Token | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand Accent** | `#6b21a8` (Regal Purple) | `#7e22ce` / `#a855f7` | Primary buttons ("Open Register", "Charge POS", "Add Product"), active nav links, focus rings |
| **Primary Hover / Pressed**| `#581c87` (Deep Purple) | `#6b21a8` | Hover and active button states |
| **Imperial Gold Highlight** | `#b45309` / `#d97706` | `#fbbf24` / `#f59e0b` | Net Payable grand total, Gross Profit, live clock beacon, brand logo typography |
| **Base Canvas** | `#f8f7f4` (Bone) | `#111215` (Charcoal Obsidian) | Page backgrounds |
| **Surface Cards** | `#ffffff` (Clean White) | `#17191e` (Dark Slate) | Workspace cards, tables, modal containers |
| **Dividers & Borders** | `#e3e1da` | `#252830` | Subtle structural borders |
| **Debt / Depletion Alerts** | `#c2410c` (Brick Ochre) | `#f87171` (Signal Coral) | Unpaid credit ledger and low stock warnings |

### Dark and Light Mode
- Managed via `ThemeContext` (`context/ThemeContext.tsx`).
- Toggled via the sun/moon button in the top navigation header.
- Automatically stores preference in `localStorage.theme` and applies the `.dark` class to the root HTML document.

### Copywriting Constraint
- Zero em-dashes (`—`) or en-dashes (`–`) anywhere across all user-facing strings and comments.

---

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── endpoints/       # Admin API Catalog & Live Ping Explorer
│   │   ├── audit-logs/          # System Audit Trail with JSON Diff Inspector
│   │   ├── auth/
│   │   │   ├── login/           # User Sign In with Quick-Fill credentials
│   │   │   └── register/        # Account Registration
│   │   ├── customers/           # Baki Khata Ledger & Payment Collection
│   │   ├── dashboard/           # Executive KPI Cards & Real-Time Analytics
│   │   ├── expenses/            # Operational Expenses & Categorization
│   │   ├── inventory/           # Warehouse Products & Stock Adjustments
│   │   ├── pos/                 # High-Speed POS Terminal & Thermal Receipt
│   │   ├── reports/             # P&L Statements & Print Ready Reports
│   │   ├── layout.tsx           # Global Root Layout & Providers
│   │   └── page.tsx             # Root Redirection Guard
│   ├── components/
│   │   ├── ApiHealthIndicator.tsx # Live API Heartbeat Beacon & Modal
│   │   ├── AppShell.tsx         # Responsive Sidebar + Header Shell
│   │   ├── ConfirmModal.tsx     # Reusable Action Confirmation Dialog
│   │   ├── CopyButton.tsx       # One-Click Clipboard Copy with Feedback
│   │   ├── Header.tsx           # Top Bar: Title, Clock, Theme, Health Beacon
│   │   ├── Icons.tsx            # SVG Icon System (Zero dependencies)
│   │   ├── Sidebar.tsx          # Collapsible Navigation with RBAC filters
│   │   ├── SkeletonLoader.tsx   # Tactile Loading States
│   │   └── ThermalReceipt.tsx   # 80mm & 58mm CSS Print Receipt
│   ├── context/
│   │   ├── AuthContext.tsx      # User State, Sanctum Token, RBAC Helpers
│   │   └── ThemeContext.tsx     # Dark / Light Mode Provider
│   ├── hooks/
│   │   ├── useBarcodeScanner.ts # Hardware Barcode Gun Burst Accumulator
│   │   └── useDebounce.ts       # Debounced Input Search Hook
│   └── services/
│       └── api.ts               # Centralized REST Client
├── public/                      # Static Assets
├── next.config.ts               # Next.js Configuration
└── tailwind.config.js           # Tailwind Styling Directives
```

---

## Page Modules & How They Work

### 1. POS Register Terminal (`/pos`)
- **Barcode Scanner Hook (`useBarcodeScanner`)**: Listens to global `keydown` events. Rapid keystrokes (<50ms between characters) terminated by `Enter` are recognized as barcode scanner bursts. The product is queried and pushed to the active cart automatically.
- **Real-Time Dynamic Cart**: Calculates line-item discounts, subtotal, VAT, net payable, and cash change return.
- **Baki Khata Selector**: Link sales to credit customers or create a new customer inline.
- **Thermal Receipt (`ThermalReceipt`)**: Previews an 80mm/58mm thermal receipt with auto-print capability.

### 2. Real-Time API Health Monitor (`components/ApiHealthIndicator.tsx`)
- Polls `GET /api/health` every 30 seconds.
- Displays connection status (`API: Online` / `API: Offline`) and round-trip latency in milliseconds.
- Clicking the pill opens the **System API Diagnostics** modal displaying SQLite connection state, query latency, PHP/Laravel versions, and memory usage.
- Includes a direct shortcut for administrators to the API Endpoints Explorer.

### 3. Admin API Endpoints Explorer (`/admin/endpoints`)
- **Restricted Access**: Only users with the `admin` role can access this page. Non-admin users receive a security notice.
- **Catalog of 23 REST Endpoints**: Displays method badges, paths, module categories, clearance levels, descriptions, and handlers.
- **Filter Matrix**: Search by path or description; filter by HTTP method (`GET`, `POST`, `PUT`, `DELETE`), module, or access clearance.
- **cURL Generator**: Copy ready-to-run cURL snippets with headers and authorization tokens.
- **Parameter Schemas**: Detailed breakdown of request query and body parameters.
- **Live Test Ping**: Execute live `GET` requests directly from the UI and view response times, status codes, and formatted JSON output.

### 4. Warehouse Inventory (`/inventory`)
- Search by product name, SKU, or barcode.
- Low stock indicators (<10 units) highlighted in bold alerts.
- **Role-Based Taxonomy**:
  - Administrators can create new categories and units of measure directly inside the product modal.
  - Cashiers are restricted to selecting from approved categories and units.
- **Atomic Stock Adjustments**: Adjust stock with `Set (=)`, `Add (+)`, or `Subtract (-)` with mandatory audit reasons.

### 5. Customer Credit Ledger (Baki Khata) (`/customers`)
- Summary cards showing total storewide outstanding credit debt.
- Search and filter customers with active debt.
- **Collect Due Modal**: Collect cash, card, or MFS payments with immediate ledger deduction and invoice generation.

### 6. Operational Expenses (`/expenses`)
- Track overhead costs across categories (Rent, Utilities, Salaries, Supplies, Maintenance).
- Date-filtered ledger with automatic category totals.
- Instantly reflected in the Profit and Loss statement.

### 7. System Audit Trail (`/audit-logs`)
- Live activity stream of all checkout operations, stock adjustments, customer due payments, and product CRUD actions.
- Interactive before/after JSON state diff viewer.

### 8. Financial Reports (`/reports`)
- Date-filtered Sales Summary and invoice ledger.
- Real-time Profit and Loss (P&L) calculation (Revenue, COGS, Gross Profit, Expenses, Net Operating Margin).
- Commercial Print Engine optimized for multi-page financial audits and tax statements.

---

## Development & Build Commands

```bash
# Run local development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Run Next.js production build
npm run build

# Start production server
npm start

# Run ESLint validation
npm run lint
```

---

## Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# URL pointing to the Laravel REST API
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

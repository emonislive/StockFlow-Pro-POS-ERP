You are an expert full-scale Autonomous Software Engineer and System Architect. We are building a production-ready, commercial-grade Mini POS, Inventory, and ERP system called "StockFlow Pro POS & ERP" using a decoupled Laravel 11 Backend API, a Next.js (App Router) Frontend, and a MySQL database.

To ensure a bug-free, clean, high-performance, and visually stunning build without manual tweaks, execute the build process following this strict 4-Phase Agentic Workflow. Do not skip steps.

---

### Phase 1: Environment & MySQL Database Architecture (Laravel Backend Core)
1. Initialize the Laravel 11 project structure and configure environment files (.env) to use MySQL.
2. Create database migrations with proper indexing, foreign key constraints, and InnoDB engine support for:
   - products (id, name, sku, barcode, category, cost_price, selling_price, stock_quantity, unit, timestamps, indexed on barcode and sku)
   - suppliers (id, name, phone, address, total_due, timestamps)
   - purchases & purchase_items
   - customers / baki_khata (id, name, phone, address, total_due, timestamps, indexed on phone)
   - orders & order_items (supporting Paid and Due sale types, discount, change, payment_method, customer_id foreign key set null on delete)
   - expenses (id, title, category, amount, expense_date, notes, timestamps, indexed on expense_date)
   - audit_logs (id, user_id, action, model_type, model_id, old_values (json), new_values (json), ip_address, timestamps)
3. Set up Eloquent models with strict mass-assignment protection and clean relationship definitions.

### Phase 2: Business Logic, Audit Trailing & Transactions (Laravel APIs)
1. Configure Laravel Sanctum for API authentication.
2. Implement a reusable Audit Logging observer/service that automatically tracks state changes (creates, updates, deletes) on critical models into the audit_logs table.
3. Build the core API Controllers ensuring all multi-step operations (especially POS Checkouts: wrapping order creation, item logging, product stock decrements, and customer due updates) are strictly wrapped inside DB::transaction() blocks to guarantee atomicity and prevent race conditions.
4. Implement RESTful controllers returning standardized JSON responses with proper HTTP status codes for Products, POS Checkouts, Customer Due ("Baki") Collections, Expenses, Audit Logs, and Dashboard Metrics.

### Phase 3: Frontend Scaffolding, UI/UX Design Standards & State Architecture (Next.js App Router)
1. Initialize the Next.js project with Tailwind CSS and a clean folder layout (components, services, app pages).
2. Integrate strict UI/UX Design Standards (Taste Skill / design-taste-frontend v2 protocols) to ensure a high-end, non-templated look and feel:
   - **Brief Inference & Layout Variance:** Avoid generic AI clichés, three-equal-card feature rows, and predictable grids. Use intentional asymmetric spacing, proper typography hierarchy, and a restrained professional palette.
   - **The Locks:** Enforce Color Consistency Lock (one single accent color across the app), Shape Consistency Lock (uniform border radii), and Page Theme Lock.
   - **Hero Discipline:** Desktops must feature a clean viewport-fitting hero, max 2-line headline, max 20-word subtext, and a visible primary CTA without scrolling.
   - **The Anti-Slop Ban System (Strictly Enforced):** 
     - ABSOLUTELY NO em-dashes or en-dashes anywhere in copy (use simple hyphens or rewrite).
     - NO AI-purple or mesh blob gradients.
     - NO decorative status dots, fake window animation listeners (`window.addEventListener('scroll'`), version footers, or city/weather atmospheric strips.
     - NO div-based fake product UIs.
3. Set up a centralized API client with global error interceptors, loading state management, and Sanctum token handling.
4. Build the core responsive views:
   - /auth/login & /auth/register
   - /dashboard (real-time business overview cards for revenue, expenses, net profit, and low-stock/due alerts)
   - /inventory (searchable product catalog, SKU/barcode fields, and quick stock adjustments)
   - /pos (High-speed checkout terminal featuring barcode scanner event listener, dynamic cart calculation, customer dropdown selector for "Baki Khata" crediting, and a CSS print-optimized Thermal Receipt view layout)
   - /customers (Baki Khata manager and payment collection modals)
   - /expenses (expense tracking table and entry forms)
   - /audit-logs (system security activity streams)
   - /reports (date-filtered sales/financial views)

### Phase 4: Integration, Seeding & Documentation
1. Create comprehensive database seeders using MySQL factory data for sample products, categories, and test user accounts so the application runs instantly out-of-the-box.
2. Configure CORS settings properly in Laravel to seamlessly accept requests from the Next.js client.
3. Generate a detailed root README.md containing clear, step-by-step terminal commands for running migrations, seeders, and booting both the Laravel API server and Next.js development server simultaneously.
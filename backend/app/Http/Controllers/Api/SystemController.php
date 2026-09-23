<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

class SystemController extends Controller
{
    /**
     * Check backend system and database health.
     *
     * @return JsonResponse
     */
    public function health(): JsonResponse
    {
        $startTime = microtime(true);
        $dbStatus = 'connected';
        $dbLatency = 0;

        try {
            $dbStart = microtime(true);
            DB::connection()->getPdo();
            $dbLatency = round((microtime(true) - $dbStart) * 1000, 2);
        } catch (\Exception $e) {
            $dbStatus = 'disconnected';
            $dbLatency = 0;
        }

        $totalLatency = round((microtime(true) - $startTime) * 1000, 2);

        $isHealthy = ($dbStatus === 'connected');

        return response()->json([
            'success' => $isHealthy,
            'status' => $isHealthy ? 'healthy' : 'degraded',
            'message' => $isHealthy ? 'StockFlow Pro API service is operating normally.' : 'Database connectivity degraded.',
            'data' => [
                'service' => 'StockFlow Pro REST API',
                'version' => '1.0.0',
                'environment' => config('app.env', 'production'),
                'server_time' => now()->toIso8601String(),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'database' => [
                    'driver' => config('database.default'),
                    'status' => $dbStatus,
                    'latency_ms' => $dbLatency,
                ],
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'latency_ms' => $totalLatency,
            ],
        ], $isHealthy ? 200 : 503);
    }

    /**
     * Return comprehensive directory of all API endpoints and their documentation for administrators.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function endpoints(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Administrative credentials required to inspect system endpoint directory.',
            ], 403);
        }

        $endpoints = [
            // Authentication
            [
                'module' => 'Authentication',
                'method' => 'POST',
                'path' => '/api/auth/register',
                'action' => 'AuthController@register',
                'auth' => 'Public',
                'rate_limit' => '6 requests / minute',
                'description' => 'Registers a new store account and provisions an initial user with administrative credentials.',
                'parameters' => [
                    'name' => 'string, required (User full name)',
                    'email' => 'string, email, required, unique',
                    'password' => 'string, min:6, required',
                    'password_confirmation' => 'string, required (matching password)',
                ],
                'responses' => [
                    '201' => 'User registered successfully with initial Sanctum bearer token',
                    '422' => 'Validation error (duplicate email or mismatched password confirmation)',
                ],
            ],
            [
                'module' => 'Authentication',
                'method' => 'POST',
                'path' => '/api/auth/login',
                'action' => 'AuthController@login',
                'auth' => 'Public',
                'rate_limit' => '6 requests / minute',
                'description' => 'Authenticates cashier or store administrator credentials and issues a secure Sanctum bearer token.',
                'parameters' => [
                    'email' => 'string, email, required',
                    'password' => 'string, required',
                ],
                'responses' => [
                    '200' => 'User authenticated successfully with token and role profile',
                    '401' => 'Invalid email or password credentials',
                ],
            ],
            [
                'module' => 'Authentication',
                'method' => 'GET',
                'path' => '/api/auth/me',
                'action' => 'AuthController@me',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Retrieves the currently authenticated user profile, assigned store role, and session identity.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Returns authenticated user object (id, name, email, role)',
                    '401' => 'Unauthenticated or expired token',
                ],
            ],
            [
                'module' => 'Authentication',
                'method' => 'POST',
                'path' => '/api/auth/logout',
                'action' => 'AuthController@logout',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Revokes the current Sanctum access token and invalidates active session credentials.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Session terminated successfully',
                ],
            ],

            // Dashboard
            [
                'module' => 'Dashboard & Analytics',
                'method' => 'GET',
                'path' => '/api/dashboard/metrics',
                'action' => 'DashboardController@metrics',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Computes real-time KPI metrics including today sales, month sales, operational overhead, net profit margin, customer credit receivables, low stock watchlist, and top moving products.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Summary metrics, recent completed orders, top product volume, and low stock list',
                ],
            ],

            // POS Register Terminal
            [
                'module' => 'POS Register Terminal',
                'method' => 'POST',
                'path' => '/api/pos/checkout',
                'action' => 'PosCheckoutController@checkout',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Executes an atomic sales transaction. Atomically validates inventory availability, decrements stock quantities, writes customer credit ledger (Baki Khata) if due, and records an immutable audit log entry.',
                'parameters' => [
                    'customer_id' => 'integer, optional (Foreign key to customer record)',
                    'items' => 'array of objects, required ([{ product_id, quantity, unit_price }])',
                    'discount' => 'numeric, min:0, optional (Promotional discount amount)',
                    'paid_amount' => 'numeric, min:0, required (Amount tendered by customer)',
                    'payment_method' => 'string, required (cash | card | mobile_banking | due)',
                ],
                'responses' => [
                    '201' => 'Order created with unique invoice number and detailed item receipts',
                    '400' => 'Insufficient stock or invalid item quantities',
                    '422' => 'Validation error',
                ],
            ],

            // Inventory & Products
            [
                'module' => 'Inventory & Products',
                'method' => 'GET',
                'path' => '/api/products',
                'action' => 'ProductController@index',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Lists catalog products with optional filtering by search keyword (name, SKU, barcode) or category.',
                'parameters' => [
                    'search' => 'query string, optional',
                    'category' => 'query string, optional',
                ],
                'responses' => [
                    '200' => 'Array of product records with current inventory levels and pricing',
                ],
            ],
            [
                'module' => 'Inventory & Products',
                'method' => 'POST',
                'path' => '/api/products',
                'action' => 'ProductController@store',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Creates a new product record in the catalog. Category and Unit of Measure can be dynamically created by Admins or selected from existing options by Cashiers.',
                'parameters' => [
                    'name' => 'string, required',
                    'barcode' => 'string, required, unique',
                    'sku' => 'string, required, unique',
                    'category' => 'string, required',
                    'cost_price' => 'numeric, min:0, required',
                    'selling_price' => 'numeric, min:0, required',
                    'stock_quantity' => 'integer, min:0, required',
                    'unit' => 'string, required (e.g. pcs, kg, litre, box)',
                ],
                'responses' => [
                    '201' => 'Product created and logged to audit trail',
                    '422' => 'Duplicate barcode or SKU validation error',
                ],
            ],
            [
                'module' => 'Inventory & Products',
                'method' => 'GET',
                'path' => '/api/products/barcode',
                'action' => 'ProductController@findByBarcode',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Fast barcode scanner lookup endpoint for immediate checkout addition by barcode string.',
                'parameters' => [
                    'barcode' => 'query string, required',
                ],
                'responses' => [
                    '200' => 'Product match found',
                    '404' => 'No item matching barcode located',
                ],
            ],
            [
                'module' => 'Inventory & Products',
                'method' => 'GET',
                'path' => '/api/products/categories',
                'action' => 'ProductController@categories',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Returns list of unique product categories currently registered in inventory.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Array of unique category names',
                ],
            ],
            [
                'module' => 'Inventory & Products',
                'method' => 'GET',
                'path' => '/api/products/units',
                'action' => 'ProductController@units',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Returns list of unique units of measure currently registered in inventory.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Array of unit strings (pcs, kg, litre, box, etc.)',
                ],
            ],
            [
                'module' => 'Inventory & Products',
                'method' => 'POST',
                'path' => '/api/products/{product}/adjust-stock',
                'action' => 'ProductController@adjustStock',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Performs manual stock level adjustments (add, subtract, or set absolute count) with reason logging and audit trail record.',
                'parameters' => [
                    'type' => 'string, required (add | subtract | set)',
                    'quantity' => 'integer, min:0, required',
                    'reason' => 'string, optional (e.g. Damaged inventory, Supplier restock)',
                ],
                'responses' => [
                    '200' => 'Stock adjusted successfully with prior and updated stock quantities',
                ],
            ],
            [
                'module' => 'Inventory & Products',
                'method' => 'DELETE',
                'path' => '/api/products/{product}',
                'action' => 'ProductController@destroy',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Deletes a product item from the catalog and logs previous state to audit logs.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Product removed from catalog',
                ],
            ],

            // Customers & Baki Khata
            [
                'module' => 'Customers & Baki Khata',
                'method' => 'GET',
                'path' => '/api/customers',
                'action' => 'CustomerController@index',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Lists customer accounts with current credit debt balances (total_due) and contact information.',
                'parameters' => [
                    'search' => 'query string, optional',
                    'only_due' => 'boolean query flag, optional (filters only customers with balance > 0)',
                ],
                'responses' => [
                    '200' => 'Array of customer accounts and total aggregate debt',
                ],
            ],
            [
                'module' => 'Customers & Baki Khata',
                'method' => 'POST',
                'path' => '/api/customers',
                'action' => 'CustomerController@store',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Registers a new customer ledger account for credit sales and loyalty tracking.',
                'parameters' => [
                    'name' => 'string, required',
                    'phone' => 'string, optional',
                    'address' => 'string, optional',
                ],
                'responses' => [
                    '201' => 'Customer registered with 0 initial due balance',
                ],
            ],
            [
                'module' => 'Customers & Baki Khata',
                'method' => 'POST',
                'path' => '/api/customers/{customer}/collect-due',
                'action' => 'CustomerController@collectDue',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Settles and collects outstanding Baki Khata debt. Decrements customer due balance, generates settlement invoice, and logs payment transaction to audit trail.',
                'parameters' => [
                    'amount' => 'numeric, min:0.01, required',
                    'payment_method' => 'string, required (cash | card | mobile_banking)',
                    'notes' => 'string, optional (Settlement context or memo)',
                ],
                'responses' => [
                    '200' => 'Payment collected, customer balance reduced',
                ],
            ],

            // Operational Expenses
            [
                'module' => 'Operational Expenses',
                'method' => 'GET',
                'path' => '/api/expenses',
                'action' => 'ExpenseController@index',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Lists recorded store overhead expenses with optional category filtering and search.',
                'parameters' => [
                    'search' => 'query string, optional',
                    'category' => 'query string, optional',
                ],
                'responses' => [
                    '200' => 'Array of expense records and aggregate expenditure sum',
                ],
            ],
            [
                'module' => 'Operational Expenses',
                'method' => 'POST',
                'path' => '/api/expenses',
                'action' => 'ExpenseController@store',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Logs a business expense into the accounting system (e.g. Utility bills, Store rent, Packaging, Salaries).',
                'parameters' => [
                    'title' => 'string, required',
                    'category' => 'string, required',
                    'amount' => 'numeric, min:0.01, required',
                    'expense_date' => 'date (YYYY-MM-DD), required',
                    'notes' => 'string, optional',
                ],
                'responses' => [
                    '201' => 'Expense logged and audited',
                ],
            ],

            // Accounting & Reports
            [
                'module' => 'Accounting & Reports',
                'method' => 'GET',
                'path' => '/api/reports/sales',
                'action' => 'ReportController@sales',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Fetches detailed sales ledger and transaction item breakdowns within an optional date range for reconciliation.',
                'parameters' => [
                    'start_date' => 'date (YYYY-MM-DD), optional',
                    'end_date' => 'date (YYYY-MM-DD), optional',
                ],
                'responses' => [
                    '200' => 'Aggregated sales volume, collected cash, total receivables, and individual invoice list',
                ],
            ],
            [
                'module' => 'Accounting & Reports',
                'method' => 'GET',
                'path' => '/api/reports/financial',
                'action' => 'ReportController@financial',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Generates standard Profit and Loss Statement calculating Gross Operating Revenue, Cost of Goods Sold (COGS), Gross Profit, Categorized Overheads, and Net Operating Margin.',
                'parameters' => [
                    'start_date' => 'date (YYYY-MM-DD), optional',
                    'end_date' => 'date (YYYY-MM-DD), optional',
                ],
                'responses' => [
                    '200' => 'Standard P&L accounting statement object',
                ],
            ],

            // System Audit Trail
            [
                'module' => 'System Audit Trail',
                'method' => 'GET',
                'path' => '/api/audit-logs',
                'action' => 'AuditLogController@index',
                'auth' => 'Sanctum Bearer Token',
                'rate_limit' => '60 requests / minute',
                'description' => 'Fetches system audit trail records with before/after state diffs, operator names, and client IP addresses.',
                'parameters' => [
                    'action' => 'query string, optional (checkout, due_collected, stock_adjusted, created, updated, deleted)',
                    'search' => 'query string, optional',
                ],
                'responses' => [
                    '200' => 'Array of chronological audit log entries with JSON diff payloads',
                ],
            ],

            // System & Health
            [
                'module' => 'System & Diagnostics',
                'method' => 'GET',
                'path' => '/api/health',
                'action' => 'SystemController@health',
                'auth' => 'Public (Heartbeat)',
                'rate_limit' => '120 requests / minute',
                'description' => 'Real-time API health monitor. Checks database connection, measures latency, inspects memory footprint, and verifies service availability.',
                'parameters' => [],
                'responses' => [
                    '200' => 'System healthy with DB status and response latency in ms',
                    '503' => 'System degraded or database unreachable',
                ],
            ],
            [
                'module' => 'System & Diagnostics',
                'method' => 'GET',
                'path' => '/api/admin/endpoints',
                'action' => 'SystemController@endpoints',
                'auth' => 'Sanctum Bearer Token (Admin Role Required)',
                'rate_limit' => '60 requests / minute',
                'description' => 'Returns the complete administrative directory of all registered API endpoints, request schemas, parameters, and documentation.',
                'parameters' => [],
                'responses' => [
                    '200' => 'Catalog of system endpoints and usage descriptions',
                    '403' => 'Forbidden if user role is not admin',
                ],
            ],
        ];

        $formattedCatalog = array_map(function ($ep) {
            $authStr = strtolower($ep['auth'] ?? '');
            $isPublic = str_contains($authStr, 'public');
            $isAdminOnly = str_contains($authStr, 'admin');

            $roles = $isPublic ? ['public'] : ($isAdminOnly ? ['admin'] : ['cashier', 'admin']);

            $paramList = [];
            if (!empty($ep['parameters']) && is_array($ep['parameters'])) {
                foreach ($ep['parameters'] as $name => $desc) {
                    if (is_array($desc) && isset($desc['name'])) {
                        $paramList[] = $desc;
                    } else {
                        $descStr = (string)$desc;
                        $parts = array_map('trim', explode(',', $descStr));
                        $type = $parts[0] ?? 'string';
                        $isRequired = str_contains(strtolower($descStr), 'required');
                        $paramList[] = [
                            'name' => (string)$name,
                            'type' => $type,
                            'required' => $isRequired,
                            'description' => $descStr,
                        ];
                    }
                }
            }

            return array_merge($ep, [
                'auth_required' => !$isPublic,
                'roles' => $roles,
                'formatted_parameters' => $paramList,
            ]);
        }, $endpoints);

        return response()->json([
            'success' => true,
            'data' => [
                'total_endpoints' => count($formattedCatalog),
                'generated_at' => now()->toIso8601String(),
                'server_url' => config('app.url', 'http://127.0.0.1:8000'),
                'endpoints' => $formattedCatalog,
            ],
        ]);
    }
}

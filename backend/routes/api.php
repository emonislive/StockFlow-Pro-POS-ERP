<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\PosCheckoutController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SystemController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - StockFlow Pro POS & ERP
|--------------------------------------------------------------------------
*/

// Public Authentication Endpoints (Rate Limited to 6 requests/min for brute-force safety)
Route::prefix('auth')->middleware(['throttle:6,1'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected or Sanctum Authenticated API Endpoints
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

    // POS Checkout
    Route::post('/pos/checkout', [PosCheckoutController::class, 'checkout']);

    // Products
    Route::get('/products/barcode', [ProductController::class, 'findByBarcode']);
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::get('/products/units', [ProductController::class, 'units']);
    Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
    Route::apiResource('products', ProductController::class);

    // Customers (Baki Khata)
    Route::post('/customers/{customer}/collect-due', [CustomerController::class, 'collectDue']);
    Route::apiResource('customers', CustomerController::class);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);

    // Expenses
    Route::apiResource('expenses', ExpenseController::class);

    // Audit Logs
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // Reports
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/financial', [ReportController::class, 'financial']);

    // Admin Endpoints Directory
    Route::get('/admin/endpoints', [SystemController::class, 'endpoints']);
});

// Real-Time Health & Heartbeat Diagnostic Monitor (Public)
Route::get('/health', [SystemController::class, 'health']);

// Fallback open read routes for seamless demo operation if client token is refreshing
Route::get('/demo/status', function () {
    return response()->json([
        'status' => 'online',
        'app' => 'StockFlow Pro POS & ERP API',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});


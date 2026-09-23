<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get business KPI overview metrics.
     */
    public function metrics(): JsonResponse
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // Sales Metrics
        $totalSalesAll = (float) Order::sum('total_amount');
        $totalSalesToday = (float) Order::whereDate('created_at', $today)->sum('total_amount');
        $totalSalesMonth = (float) Order::whereDate('created_at', '>=', $startOfMonth)->sum('total_amount');

        // Receivables (Baki Khata)
        $totalCustomerDue = (float) Customer::sum('total_due');

        // Expenses
        $totalExpensesAll = (float) Expense::sum('amount');
        $totalExpensesMonth = (float) Expense::whereDate('expense_date', '>=', $startOfMonth)->sum('amount');

        // Net Profit (Sales - Expenses)
        $netProfitMonth = $totalSalesMonth - $totalExpensesMonth;

        // Inventory health
        $totalProducts = Product::where('is_active', true)->count();
        $lowStockProducts = Product::where('is_active', true)
            ->where('stock_quantity', '<=', 10)
            ->orderBy('stock_quantity')
            ->limit(8)
            ->get();

        // Recent Orders
        $recentOrders = Order::with('customer:id,name,phone')
            ->latest()
            ->limit(6)
            ->get();

        // Top 5 Selling Products
        $topProducts = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->with('product:id,name,sku,selling_price')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'sales_today' => $totalSalesToday,
                    'sales_month' => $totalSalesMonth,
                    'sales_total' => $totalSalesAll,
                    'expenses_month' => $totalExpensesMonth,
                    'expenses_total' => $totalExpensesAll,
                    'net_profit_month' => $netProfitMonth,
                    'total_receivables' => $totalCustomerDue,
                    'total_products' => $totalProducts,
                    'low_stock_count' => $lowStockProducts->count(),
                ],
                'low_stock_products' => $lowStockProducts,
                'recent_orders' => $recentOrders,
                'top_products' => $topProducts,
            ],
        ]);
    }
}

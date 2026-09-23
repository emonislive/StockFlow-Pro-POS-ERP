<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Sales report by date range.
     */
    public function sales(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $orders = Order::with(['customer:id,name', 'items.product:id,name'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $totalSales = (float) $orders->sum('total_amount');
        $totalDiscount = (float) $orders->sum('discount');
        $totalPaid = (float) $orders->sum('paid_amount');
        $totalDue = (float) $orders->sum('due_amount');

        // Sales grouped by payment method
        $paymentMethods = Order::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->select('payment_method', DB::raw('COUNT(*) as total_orders'), DB::raw('SUM(total_amount) as total_amount'))
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'order_count' => $orders->count(),
                    'total_sales' => $totalSales,
                    'total_discount' => $totalDiscount,
                    'total_paid' => $totalPaid,
                    'total_due' => $totalDue,
                ],
                'payment_breakdown' => $paymentMethods,
                'orders' => $orders,
            ],
        ]);
    }

    /**
     * Profit and loss statement.
     */
    public function financial(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $totalRevenue = (float) Order::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('total_amount');

        // Cost of goods sold (COGS)
        $cogs = (float) OrderItem::whereHas('order', function ($q) use ($startDate, $endDate) {
            $q->whereDate('created_at', '>=', $startDate)
              ->whereDate('created_at', '<=', $endDate);
        })->join('products', 'order_items.product_id', '=', 'products.id')
          ->select(DB::raw('SUM(order_items.quantity * products.cost_price) as total_cost'))
          ->value('total_cost') ?? 0;

        $grossProfit = $totalRevenue - $cogs;

        $totalExpenses = (float) Expense::whereDate('expense_date', '>=', $startDate)
            ->whereDate('expense_date', '<=', $endDate)
            ->sum('amount');

        $netProfit = $grossProfit - $totalExpenses;

        $expensesByCategory = Expense::whereDate('expense_date', '>=', $startDate)
            ->whereDate('expense_date', '<=', $endDate)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'revenue' => $totalRevenue,
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'expenses_by_category' => $expensesByCategory,
            ],
        ]);
    }
}

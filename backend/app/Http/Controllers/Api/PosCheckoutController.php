<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\AuditService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosCheckoutController extends Controller
{
    /**
     * Process high-speed POS checkout inside an atomic DB::transaction block.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount' => 'nullable|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,mobile_banking,due',
            'notes' => 'nullable|string',
        ]);

        try {
            $order = DB::transaction(function () use ($validated) {
                $subtotal = 0;
                $itemsToInsert = [];

                // 1. Lock and verify stock for all items
                foreach ($validated['items'] as $itemData) {
                    $product = Product::lockForUpdate()->find($itemData['product_id']);

                    if (! $product) {
                        throw new Exception("Product ID {$itemData['product_id']} not found.");
                    }

                    if ($product->stock_quantity < $itemData['quantity']) {
                        throw new Exception("Insufficient stock for '{$product->name}'. Available: {$product->stock_quantity}, Requested: {$itemData['quantity']}");
                    }

                    $unitPrice = (float) $product->selling_price;
                    $itemSubtotal = $unitPrice * $itemData['quantity'];
                    $subtotal += $itemSubtotal;

                    $itemsToInsert[] = [
                        'product' => $product,
                        'product_id' => $product->id,
                        'quantity' => $itemData['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $itemSubtotal,
                    ];
                }

                $discount = (float) ($validated['discount'] ?? 0);
                $totalAmount = max(0, $subtotal - $discount);
                $paidAmount = (float) $validated['paid_amount'];

                $dueAmount = max(0, $totalAmount - $paidAmount);
                $change = max(0, $paidAmount - $totalAmount);

                $saleType = 'Paid';
                if ($dueAmount > 0) {
                    $saleType = ($paidAmount > 0) ? 'Partial' : 'Due';
                }

                // If sale involves credit/due, customer is required
                if ($dueAmount > 0 && empty($validated['customer_id'])) {
                    throw new Exception("Customer selection is required for credit / due transactions (Baki Khata).");
                }

                // 2. Generate unique invoice number
                $invoiceNo = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                // 3. Create Order
                $order = Order::create([
                    'customer_id' => $validated['customer_id'] ?? null,
                    'invoice_no' => $invoiceNo,
                    'sale_type' => $saleType,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'due_amount' => $dueAmount,
                    'change' => $change,
                    'payment_method' => $validated['payment_method'],
                    'status' => 'completed',
                    'notes' => $validated['notes'] ?? null,
                ]);

                // 4. Create Order Items and Decrement Product Stock
                foreach ($itemsToInsert as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'subtotal' => $item['subtotal'],
                    ]);

                    $item['product']->decrement('stock_quantity', $item['quantity']);
                }

                // 5. Update Customer Baki Khata if due exists
                if (! empty($validated['customer_id']) && $dueAmount > 0) {
                    $customer = Customer::lockForUpdate()->find($validated['customer_id']);
                    if ($customer) {
                        $customer->increment('total_due', $dueAmount);
                    }
                }

                // 6. Audit Trail
                AuditService::log(
                    action: 'checkout',
                    model: $order,
                    oldValues: null,
                    newValues: [
                        'invoice_no' => $order->invoice_no,
                        'total_amount' => $totalAmount,
                        'paid_amount' => $paidAmount,
                        'due_amount' => $dueAmount,
                        'items_count' => count($itemsToInsert),
                    ],
                    description: "POS Checkout completed: {$order->invoice_no} ({$saleType})"
                );

                return $order;
            });

            return response()->json([
                'success' => true,
                'message' => 'Order completed successfully',
                'data' => $order->load(['customer', 'items.product']),
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

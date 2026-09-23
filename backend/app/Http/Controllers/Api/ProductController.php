<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of products with optional search and category filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->where('is_active', true);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($request->boolean('all')) {
            $products = $query->orderBy('name')->get();
            return response()->json(['success' => true, 'data' => $products]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $products = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
                'per_page' => $products->perPage(),
            ],
        ]);
    }

    /**
     * Get distinct product categories.
     */
    public function categories(): JsonResponse
    {
        $defaultCategories = ['Groceries', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Meat & Fish', 'Produce', 'Personal Care', 'Household'];
        $dbCategories = Product::distinct()->pluck('category')->filter()->values()->toArray();
        $merged = array_values(array_unique(array_merge($defaultCategories, $dbCategories)));
        sort($merged);
        return response()->json(['success' => true, 'data' => $merged]);
    }

    /**
     * Get distinct product units of measure.
     */
    public function units(): JsonResponse
    {
        $defaultUnits = ['pcs', 'packet', 'kg', 'gram', 'litre', 'ml', 'box', 'bottle', 'can', 'bundle'];
        $dbUnits = Product::distinct()->pluck('unit')->filter()->values()->toArray();
        $merged = array_values(array_unique(array_merge($defaultUnits, $dbUnits)));
        sort($merged);
        return response()->json(['success' => true, 'data' => $merged]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'barcode' => 'required|string|max:100|unique:products,barcode',
            'category' => 'nullable|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        // Restrict Cashiers from inventing arbitrary new categories or units
        if ($request->user() && $request->user()->role === 'cashier') {
            $allowedCategories = array_values(array_unique(array_merge(
                ['Groceries', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Meat & Fish', 'Produce', 'Personal Care', 'Household'],
                Product::distinct()->pluck('category')->filter()->values()->toArray()
            )));
            $allowedUnits = array_values(array_unique(array_merge(
                ['pcs', 'packet', 'kg', 'gram', 'litre', 'ml', 'box', 'bottle', 'can', 'bundle'],
                Product::distinct()->pluck('unit')->filter()->values()->toArray()
            )));

            if ($request->filled('category') && !in_array($request->input('category'), $allowedCategories)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cashiers can only select from existing categories. Please contact an administrator to add new categories.',
                ], 403);
            }

            if ($request->filled('unit') && !in_array($request->input('unit'), $allowedUnits)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cashiers can only select from existing units of measure. Please contact an administrator to add new units.',
                ], 403);
            }
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $product]);
    }

    /**
     * Find product by barcode or SKU for instant scanner lookup.
     */
    public function findByBarcode(Request $request): JsonResponse
    {
        $code = $request->input('code');
        if (! $code) {
            return response()->json(['success' => false, 'message' => 'Barcode or SKU code is required'], 400);
        }

        $product = Product::where('barcode', $code)
            ->orWhere('sku', $code)
            ->first();

        if (! $product) {
            return response()->json(['success' => false, 'message' => 'Product not found for code: ' . $code], 404);
        }

        return response()->json(['success' => true, 'data' => $product]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => ['required', 'string', 'max:100', Rule::unique('products')->ignore($product->id)],
            'barcode' => ['required', 'string', 'max:100', Rule::unique('products')->ignore($product->id)],
            'category' => 'nullable|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    /**
     * Quick stock adjustment.
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'adjustment_type' => 'required|in:add,subtract,set',
            'quantity' => 'required|integer|min:0',
            'reason' => 'nullable|string',
        ]);

        $oldStock = $product->stock_quantity;
        $qty = $validated['quantity'];

        if ($validated['adjustment_type'] === 'add') {
            $newStock = $oldStock + $qty;
        } elseif ($validated['adjustment_type'] === 'subtract') {
            $newStock = max(0, $oldStock - $qty);
        } else {
            $newStock = $qty;
        }

        $product->stock_quantity = $newStock;
        $product->save();

        AuditService::log(
            action: 'stock_adjusted',
            model: $product,
            oldValues: ['stock_quantity' => $oldStock],
            newValues: ['stock_quantity' => $newStock],
            description: "Stock adjusted for '{$product->name}' ({$validated['adjustment_type']} {$qty}). Reason: " . ($validated['reason'] ?? 'Manual adjustment')
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully',
            'data' => $product,
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}

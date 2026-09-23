<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\AuditService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers with optional search and due filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('has_due')) {
            $query->where('total_due', '>', 0);
        }

        if ($request->boolean('all')) {
            $customers = $query->orderBy('name')->get();
            return response()->json(['success' => true, 'data' => $customers]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $customers = $query->orderByDesc('total_due')->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'total' => $customers->total(),
                'per_page' => $customers->perPage(),
                'total_receivables' => (float) Customer::sum('total_due'),
            ],
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'total_due' => 'nullable|numeric|min:0',
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => $customer,
        ], 201);
    }

    /**
     * Display the specified customer with recent orders.
     */
    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['orders' => fn ($q) => $q->latest()->limit(10)->with('items.product')]);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer,
        ]);
    }

    /**
     * Collect Due (Baki Khata payment collection) atomically.
     */
    public function collectDue(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,card,mobile_banking',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($customer, $validated) {
                $customer->refresh();
                $oldDue = (float) $customer->total_due;
                $payment = (float) $validated['amount'];

                if ($payment > $oldDue) {
                    throw new Exception("Payment amount ({$payment}) cannot exceed outstanding due ({$oldDue}).");
                }

                $newDue = max(0, $oldDue - $payment);
                $customer->total_due = $newDue;
                $customer->save();

                AuditService::log(
                    action: 'due_collected',
                    model: $customer,
                    oldValues: ['total_due' => $oldDue],
                    newValues: [
                        'total_due' => $newDue,
                        'collected_amount' => $payment,
                        'payment_method' => $validated['payment_method'],
                    ],
                    description: "Collected payment of {$payment} from customer '{$customer->name}'. Remaining due: {$newDue}. Note: " . ($validated['notes'] ?? 'None')
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Payment collected successfully',
                'data' => $customer->fresh(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ]);
    }
}

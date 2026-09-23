<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@stockflow.com'],
            [
                'name' => 'Admin Manager',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@stockflow.com'],
            [
                'name' => 'Store Cashier',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
            ]
        );

        // 2. Seed Suppliers
        $suppliersData = [
            ['name' => 'Metro Wholesale Trading', 'phone' => '01711223344', 'email' => 'contact@metrowholesale.com', 'address' => 'Tejgaon Industrial Area, Dhaka', 'total_due' => 15000.00],
            ['name' => 'Apex Consumer Goods Ltd', 'phone' => '01811334455', 'email' => 'orders@apexcg.com', 'address' => 'Agrabad C/A, Chittagong', 'total_due' => 0.00],
            ['name' => 'Bengal Dairy & Foods', 'phone' => '01911445566', 'email' => 'info@bengaldairy.com', 'address' => 'Savar EPZ Road, Dhaka', 'total_due' => 8400.00],
            ['name' => 'National Beverage Distributors', 'phone' => '01611556677', 'email' => 'sales@natbev.com', 'address' => 'Bogura Highway, Bogura', 'total_due' => 4500.00],
        ];

        foreach ($suppliersData as $sup) {
            Supplier::firstOrCreate(['name' => $sup['name']], $sup);
        }

        // 3. Seed Products (Retail, Groceries, Beverages, Bakery, Snacks)
        $productsData = [
            ['name' => 'Aarong Fresh Pasteurized Milk 1L', 'sku' => 'MLK-AAR-1001', 'barcode' => '894110010001', 'category' => 'Dairy', 'cost_price' => 82.00, 'selling_price' => 95.00, 'stock_quantity' => 45, 'unit' => 'packet'],
            ['name' => 'Pran Frooto Mango Juice 250ml', 'sku' => 'BEV-PRN-2001', 'barcode' => '894110020002', 'category' => 'Beverages', 'cost_price' => 22.00, 'selling_price' => 30.00, 'stock_quantity' => 120, 'unit' => 'bottle'],
            ['name' => 'Coca Cola Can 330ml', 'sku' => 'BEV-COK-2002', 'barcode' => '894110020003', 'category' => 'Beverages', 'cost_price' => 45.00, 'selling_price' => 60.00, 'stock_quantity' => 64, 'unit' => 'can'],
            ['name' => 'Nescafe Classic Instant Coffee 50g', 'sku' => 'BEV-NES-2003', 'barcode' => '894110020004', 'category' => 'Beverages', 'cost_price' => 170.00, 'selling_price' => 210.00, 'stock_quantity' => 22, 'unit' => 'jar'],
            ['name' => 'Radhuni Pure Turmeric Powder 200g', 'sku' => 'GRC-RAD-3001', 'barcode' => '894110030001', 'category' => 'Groceries', 'cost_price' => 75.00, 'selling_price' => 95.00, 'stock_quantity' => 38, 'unit' => 'packet'],
            ['name' => 'Teer Fortified Soybean Oil 2L', 'sku' => 'GRC-TER-3002', 'barcode' => '894110030002', 'category' => 'Groceries', 'cost_price' => 340.00, 'selling_price' => 380.00, 'stock_quantity' => 18, 'unit' => 'bottle'],
            ['name' => 'Chashi Aromatic Chinigura Rice 1kg', 'sku' => 'GRC-CHS-3003', 'barcode' => '894110030003', 'category' => 'Groceries', 'cost_price' => 125.00, 'selling_price' => 150.00, 'stock_quantity' => 50, 'unit' => 'bag'],
            ['name' => 'Ispahani Mirzapore Tea Bag 50s', 'sku' => 'BEV-ISP-2004', 'barcode' => '894110020005', 'category' => 'Beverages', 'cost_price' => 110.00, 'selling_price' => 135.00, 'stock_quantity' => 30, 'unit' => 'box'],
            ['name' => 'Danish Premium Butter Cookies 400g', 'sku' => 'BAK-DNS-4001', 'barcode' => '894110040001', 'category' => 'Bakery', 'cost_price' => 260.00, 'selling_price' => 320.00, 'stock_quantity' => 14, 'unit' => 'tin'],
            ['name' => 'Wonder White Sliced Bread 400g', 'sku' => 'BAK-WND-4002', 'barcode' => '894110040002', 'category' => 'Bakery', 'cost_price' => 45.00, 'selling_price' => 60.00, 'stock_quantity' => 8, 'unit' => 'loaf'], // Low Stock
            ['name' => 'Lays Classic Salted Potato Chips 50g', 'sku' => 'SNK-LAY-5001', 'barcode' => '894110050001', 'category' => 'Snacks', 'cost_price' => 28.00, 'selling_price' => 40.00, 'stock_quantity' => 75, 'unit' => 'packet'],
            ['name' => 'Kurkure Masala Munch 45g', 'sku' => 'SNK-KUR-5002', 'barcode' => '894110050002', 'category' => 'Snacks', 'cost_price' => 18.00, 'selling_price' => 25.00, 'stock_quantity' => 80, 'unit' => 'packet'],
            ['name' => 'Dairy Milk Silk Chocolate 150g', 'sku' => 'SNK-CDY-5003', 'barcode' => '894110050003', 'category' => 'Snacks', 'cost_price' => 220.00, 'selling_price' => 270.00, 'stock_quantity' => 5, 'unit' => 'bar'], // Low Stock
            ['name' => 'Dettol Original Antiseptic Soap 100g', 'sku' => 'PER-DTL-6001', 'barcode' => '894110060001', 'category' => 'Personal Care', 'cost_price' => 50.00, 'selling_price' => 65.00, 'stock_quantity' => 90, 'unit' => 'bar'],
            ['name' => 'Sensodyne Rapid Relief Toothpaste 80g', 'sku' => 'PER-SNS-6002', 'barcode' => '894110060002', 'category' => 'Personal Care', 'cost_price' => 195.00, 'selling_price' => 240.00, 'stock_quantity' => 6, 'unit' => 'tube'], // Low Stock
            ['name' => 'Head & Shoulders Shampoo 180ml', 'sku' => 'PER-HNS-6003', 'barcode' => '894110060003', 'category' => 'Personal Care', 'cost_price' => 230.00, 'selling_price' => 280.00, 'stock_quantity' => 16, 'unit' => 'bottle'],
            ['name' => 'Rin Advanced Detergent Powder 1kg', 'sku' => 'HSE-RIN-7001', 'barcode' => '894110070001', 'category' => 'Household', 'cost_price' => 140.00, 'selling_price' => 165.00, 'stock_quantity' => 28, 'unit' => 'packet'],
            ['name' => 'Harpic Power Plus Toilet Cleaner 500ml', 'sku' => 'HSE-HRP-7002', 'barcode' => '894110070002', 'category' => 'Household', 'cost_price' => 110.00, 'selling_price' => 135.00, 'stock_quantity' => 4, 'unit' => 'bottle'], // Low Stock
            ['name' => 'Good Knight Mosquito Vaporizer Refill', 'sku' => 'HSE-GDK-7003', 'barcode' => '894110070003', 'category' => 'Household', 'cost_price' => 85.00, 'selling_price' => 105.00, 'stock_quantity' => 35, 'unit' => 'unit'],
            ['name' => 'Kinley Purified Drinking Water 500ml', 'sku' => 'BEV-KIN-2005', 'barcode' => '894110020006', 'category' => 'Beverages', 'cost_price' => 11.00, 'selling_price' => 15.00, 'stock_quantity' => 140, 'unit' => 'bottle'],
        ];

        foreach ($productsData as $prod) {
            Product::firstOrCreate(['sku' => $prod['sku']], $prod);
        }

        // 4. Seed Customers (Baki Khata Accounts)
        $customersData = [
            ['name' => 'Hasan Mahmud', 'phone' => '01712345678', 'email' => 'hasan@example.com', 'address' => 'House 14, Road 5, Dhanmondi, Dhaka', 'total_due' => 3450.00],
            ['name' => 'Rahim Uddin', 'phone' => '01819876543', 'email' => 'rahim.u@example.com', 'address' => 'Flat 3B, Sector 3, Uttara, Dhaka', 'total_due' => 1200.00],
            ['name' => 'Fatima Begum', 'phone' => '01912233445', 'email' => 'fatima.b@example.com', 'address' => 'Block C, Bashundhara R/A, Dhaka', 'total_due' => 0.00],
            ['name' => 'Tanvir Ahmed', 'phone' => '01614455667', 'email' => 'tanvir.a@example.com', 'address' => 'Mohakhali DOHS, Dhaka', 'total_due' => 5800.00],
            ['name' => 'Walk-in Retail Customer', 'phone' => '01500000000', 'email' => null, 'address' => 'Store Counter', 'total_due' => 0.00],
        ];

        foreach ($customersData as $cust) {
            Customer::firstOrCreate(['name' => $cust['name']], $cust);
        }

        // 5. Seed Recent Expenses
        $expensesData = [
            ['title' => 'Commercial Shop Monthly Rent', 'category' => 'Rent', 'amount' => 25000.00, 'expense_date' => Carbon::now()->startOfMonth()->toDateString(), 'notes' => 'Paid via Bank Transfer'],
            ['title' => 'DESCO Commercial Electricity Bill', 'category' => 'Utilities', 'amount' => 4200.00, 'expense_date' => Carbon::now()->subDays(5)->toDateString(), 'notes' => 'Meter #449102'],
            ['title' => 'Store Assistant Bi-Weekly Wages', 'category' => 'Salaries', 'amount' => 9000.00, 'expense_date' => Carbon::now()->subDays(10)->toDateString(), 'notes' => 'Cash disbursement'],
            ['title' => 'Thermal Receipt Paper Rolls (50 pack)', 'category' => 'Supplies', 'amount' => 1650.00, 'expense_date' => Carbon::now()->subDays(3)->toDateString(), 'notes' => '80mm rolls from stationery market'],
            ['title' => 'High-Speed Fiber Internet Bill', 'category' => 'Utilities', 'amount' => 1500.00, 'expense_date' => Carbon::now()->subDays(7)->toDateString(), 'notes' => 'Link3 50Mbps connection'],
        ];

        foreach ($expensesData as $exp) {
            Expense::firstOrCreate(['title' => $exp['title']], $exp);
        }

        // 6. Seed Sample Completed POS Orders
        $customerHasan = Customer::where('name', 'Hasan Mahmud')->first();
        $customerWalkin = Customer::where('name', 'Walk-in Retail Customer')->first();
        $coke = Product::where('sku', 'BEV-COK-2002')->first();
        $oil = Product::where('sku', 'GRC-TER-3002')->first();
        $chips = Product::where('sku', 'SNK-LAY-5001')->first();

        if ($customerWalkin && $coke && $chips && Order::count() === 0) {
            // Order 1: Paid in Cash
            $order1 = Order::create([
                'customer_id' => $customerWalkin->id,
                'invoice_no' => 'INV-' . date('Ymd') . '-000101',
                'sale_type' => 'Paid',
                'subtotal' => 160.00,
                'discount' => 10.00,
                'total_amount' => 150.00,
                'paid_amount' => 200.00,
                'due_amount' => 0.00,
                'change' => 50.00,
                'payment_method' => 'cash',
                'status' => 'completed',
                'notes' => 'Walk-in cashier checkout',
            ]);

            OrderItem::create([
                'order_id' => $order1->id,
                'product_id' => $coke->id,
                'quantity' => 2,
                'unit_price' => $coke->selling_price,
                'subtotal' => $coke->selling_price * 2,
            ]);

            OrderItem::create([
                'order_id' => $order1->id,
                'product_id' => $chips->id,
                'quantity' => 1,
                'unit_price' => $chips->selling_price,
                'subtotal' => $chips->selling_price * 1,
            ]);

            // Order 2: Due / Baki Sale
            if ($customerHasan && $oil) {
                $order2 = Order::create([
                    'customer_id' => $customerHasan->id,
                    'invoice_no' => 'INV-' . date('Ymd') . '-000102',
                    'sale_type' => 'Due',
                    'subtotal' => 760.00,
                    'discount' => 0.00,
                    'total_amount' => 760.00,
                    'paid_amount' => 0.00,
                    'due_amount' => 760.00,
                    'change' => 0.00,
                    'payment_method' => 'due',
                    'status' => 'completed',
                    'notes' => 'Added to Hasan Mahmud Baki Khata account',
                ]);

                OrderItem::create([
                    'order_id' => $order2->id,
                    'product_id' => $oil->id,
                    'quantity' => 2,
                    'unit_price' => $oil->selling_price,
                    'subtotal' => $oil->selling_price * 2,
                ]);
            }
        }

        // 7. Seed Initial System Audit Log
        AuditLog::firstOrCreate(
            ['action' => 'system_init'],
            [
                'user_id' => $admin->id,
                'action' => 'system_init',
                'model_type' => 'System',
                'model_id' => 1,
                'old_values' => null,
                'new_values' => ['system' => 'StockFlow Pro POS & ERP', 'seeded_records' => 30],
                'ip_address' => '127.0.0.1',
                'description' => 'System initialized and database seeded successfully.',
            ]
        );
    }
}

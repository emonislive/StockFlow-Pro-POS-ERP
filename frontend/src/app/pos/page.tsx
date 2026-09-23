'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import { useCart, Product, Customer } from '@/context/CartContext';
import { ThermalReceipt } from '@/components/ThermalReceipt';
import { useDebounce } from '@/hooks/useDebounce';
import {
  IconSearch,
  IconBarcode,
  IconPlus,
  IconMinus,
  IconTrash,
  IconUser,
  IconCheck,
  IconClose,
} from '@/components/Icons';

export default function PosPage() {
  const {
    items,
    customer,
    discount,
    setCustomer,
    setDiscount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    total,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce(searchTerm, 200);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [customersList, setCustomersList] = useState<Customer[]>([]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_banking' | 'due'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Thermal Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Quick Customer Creation Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products and customers
  const loadInitialData = async () => {
    const [prodRes, catRes, custRes] = await Promise.all([
      api.get<Product[]>('/products?all=1'),
      api.get<string[]>('/products/categories'),
      api.get<Customer[]>('/customers?all=1'),
    ]);

    if (prodRes.success && prodRes.data) {
      setProducts(prodRes.data);
    }
    if (catRes.success && catRes.data) {
      setCategories(catRes.data);
    }
    if (custRes.success && custRes.data) {
      setCustomersList(custRes.data);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Update paid amount default whenever total changes
  useEffect(() => {
    if (paymentMethod === 'due') {
      setPaidAmount(0);
    } else {
      setPaidAmount(total);
    }
  }, [total, paymentMethod]);

  // Barcode scanner listener
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find((p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    if (matched) {
      const added = addToCart(matched, 1);
      if (added) {
        setBarcodeInput('');
      }
    } else {
      const res = await api.get<Product>(`/products/barcode?code=${encodeURIComponent(code)}`);
      if (res.success && res.data) {
        addToCart(res.data, 1);
        setBarcodeInput('');
      } else {
        alert(`No product found for barcode: ${code}`);
      }
    }
  };

  // Filter products for catalog grid using debouncedSearch
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.barcode.includes(debouncedSearch);
    return matchesCategory && matchesSearch;
  });

  const dueAmount = Math.max(0, total - paidAmount);
  const changeAmount = Math.max(0, paidAmount - total);

  // Process Checkout
  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('Cart is empty. Please add items to checkout.');
      return;
    }

    if (dueAmount > 0 && !customer) {
      setErrorMessage('A customer must be selected to record Baki Khata credit due.');
      return;
    }

    setErrorMessage(null);
    setCheckoutLoading(true);

    const payload = {
      customer_id: customer?.id || null,
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      discount,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
    };

    const res = await api.post<any>('/pos/checkout', payload);
    setCheckoutLoading(false);

    if (res.success && res.data) {
      const createdOrder = res.data;
      clearCart();
      loadInitialData(); // Refresh product stock counts
      setCompletedOrder(createdOrder);
    } else {
      setErrorMessage(res.message || 'Checkout failed. Please check stock quantities and try again.');
    }
  };

  // Quick Add Customer handler
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const res = await api.post<Customer>('/customers', {
      name: newCustomerName,
      phone: newCustomerPhone,
    });

    if (res.success && res.data) {
      const newCust = res.data;
      setCustomersList((prev) => [newCust, ...prev]);
      setCustomer(newCust);
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } else {
      alert(res.message || 'Failed to register customer.');
    }
  };

  return (
    <AppShell title="Register Terminal" subtitle="Continuous barcode scanning and receipt settlement">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-6.5rem)] min-h-[640px]">
        {/* Left Side: Product Catalog (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 shadow-xs">
          {/* Top Scanner & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            {/* Direct Barcode Entry Form */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-1.5">
              <div className="relative flex-1">
                <IconBarcode className="w-4 h-4 text-[#6e6b65] dark:text-[#9698a3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or type SKU..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] rounded-lg text-xs text-[#191817] dark:text-[#f3f3f5] placeholder-[#9c978f] dark:placeholder-[#656773] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] font-mono tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#f8f7f4] hover:bg-[#f0eee9] dark:bg-[#111215] dark:hover:bg-[#1f2229] text-[#191817] dark:text-[#f3f3f5] text-xs font-medium rounded-lg border border-[#e3e1da] dark:border-[#252830] transition-colors btn-tactile"
              >
                Enter
              </button>
            </form>

            {/* Keyword Search */}
            <div className="relative sm:w-52">
              <IconSearch className="w-4 h-4 text-[#6e6b65] dark:text-[#9698a3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] rounded-lg text-xs text-[#191817] dark:text-[#f3f3f5] placeholder-[#9c978f] dark:placeholder-[#656773] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-lg text-xs transition-colors btn-tactile shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-[#191817] text-white dark:bg-[#f3f3f5] dark:text-[#111215] font-semibold'
                  : 'bg-[#f8f7f4] dark:bg-[#111215] text-[#6e6b65] dark:text-[#9698a3] border border-[#e3e1da] dark:border-[#252830] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors btn-tactile shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#191817] text-white dark:bg-[#f3f3f5] dark:text-[#111215] font-semibold'
                    : 'bg-[#f8f7f4] dark:bg-[#111215] text-[#6e6b65] dark:text-[#9698a3] border border-[#e3e1da] dark:border-[#252830] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
            {filteredProducts.map((product) => {
              const inStock = product.stock_quantity > 0;
              const isLowStock = product.stock_quantity <= 10 && inStock;

              return (
                <button
                  key={product.id}
                  onClick={() => inStock && addToCart(product, 1)}
                  disabled={!inStock}
                  className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-colors btn-tactile ${
                    inStock
                      ? 'bg-[#f8f7f4] dark:bg-[#111215] border-[#e3e1da] dark:border-[#252830] hover:border-[#6b21a8] dark:hover:border-[#a855f7] hover:bg-[#ffffff] dark:hover:bg-[#17191e] cursor-pointer'
                      : 'bg-[#f8f7f4]/40 dark:bg-[#111215]/40 border-[#e3e1da]/40 dark:border-[#252830]/40 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] font-mono truncate max-w-[80px]">
                        {product.category}
                      </span>
                      <span
                        className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded ${
                          !inStock
                            ? 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#c2410c] dark:text-[#f87171]'
                            : isLowStock
                            ? 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#d97706] dark:text-[#fbbf24]'
                            : 'bg-[#faf5ff] dark:bg-[#581c87]/30 text-[#6b21a8] dark:text-[#d8b4fe]'
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </div>
                    <div className="font-medium text-xs text-[#191817] dark:text-[#f3f3f5] line-clamp-2 leading-tight">
                      {product.name}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#e3e1da] dark:border-[#252830] flex justify-between items-baseline">
                    <span className="text-xs font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">
                      ৳ {Number(product.selling_price).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#6e6b65] dark:text-[#9698a3]">
                      /{product.unit}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-[#6e6b65] dark:text-[#9698a3] text-xs">
                <div>No items match &quot;{debouncedSearch}&quot;</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Register Tape & Payment Terminal (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 shadow-xs">
          {/* Customer Selection Binder (Baki Khata) */}
          <div className="mb-3 p-3 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-[#191817] dark:text-[#f3f3f5] flex items-center gap-1.5">
                <IconUser className="w-3.5 h-3.5 text-[#6b21a8] dark:text-[#c084fc]" />
                <span>Customer Ledger</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="text-[11px] text-[#6b21a8] dark:text-[#c084fc] hover:underline font-semibold"
              >
                + New account
              </button>
            </div>

            <div className="flex gap-1.5">
              <select
                value={customer?.id || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const found = customersList.find((c) => c.id === id) || null;
                  setCustomer(found);
                }}
                className="flex-1 bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-lg px-2.5 py-1 text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
              >
                <option value="">Walk-in Retail Customer</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {Number(c.total_due) > 0 ? `(Debt: ৳ ${Number(c.total_due).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
              {customer && (
                <button
                  onClick={() => setCustomer(null)}
                  className="px-2 py-1 bg-[#f2f0eb] dark:bg-[#1f2229] text-[#6e6b65] dark:text-[#9698a3] hover:text-[#191817] dark:hover:text-[#f3f3f5] rounded-lg text-xs font-medium btn-tactile"
                >
                  Clear
                </button>
              )}
            </div>

            {customer && Number(customer.total_due) > 0 && (
              <div className="mt-2 text-[11px] text-[#c2410c] dark:text-[#f87171] flex justify-between font-mono tabular-nums px-2 py-1 rounded bg-[#f2f0eb] dark:bg-[#1f2229] border border-[#e3e1da] dark:border-[#252830]">
                <span>Existing Baki Khata Debt:</span>
                <span className="font-bold">৳ {Number(customer.total_due).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Register Tape Line Items */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 mb-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2 max-w-[130px]">
                  <div className="font-medium text-[#191817] dark:text-[#f3f3f5] truncate">{item.product.name}</div>
                  <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] font-mono tabular-nums mt-0.5">
                    ৳ {item.unit_price.toFixed(2)} /{item.product.unit}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-[#ffffff] dark:bg-[#17191e] hover:bg-[#f2f0eb] dark:hover:bg-[#1f2229] flex items-center justify-center text-[#191817] dark:text-[#f3f3f5] border border-[#e3e1da] dark:border-[#252830] btn-tactile"
                  >
                    <IconMinus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono tabular-nums font-bold text-[#191817] dark:text-[#f3f3f5] text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-[#ffffff] dark:bg-[#17191e] hover:bg-[#f2f0eb] dark:hover:bg-[#1f2229] flex items-center justify-center text-[#191817] dark:text-[#f3f3f5] border border-[#e3e1da] dark:border-[#252830] btn-tactile"
                  >
                    <IconPlus className="w-3 h-3" />
                  </button>

                  <div className="w-16 text-right font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">
                    ৳ {item.subtotal.toFixed(2)}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-[#6e6b65] hover:text-[#c2410c] dark:hover:text-[#f87171] transition-colors ml-0.5 rounded"
                    title="Remove item"
                  >
                    <IconTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#6e6b65] dark:text-[#9698a3] text-xs">
                <div className="w-10 h-10 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] flex items-center justify-center text-[#6e6b65] dark:text-[#9698a3] mb-2">
                  <IconBarcode className="w-5 h-5" />
                </div>
                <div className="font-medium text-[#191817] dark:text-[#f3f3f5]">Register tape is clear</div>
                <div className="text-[11px] mt-0.5 text-[#6e6b65] dark:text-[#9698a3]">Scan barcodes or click items to ring sale</div>
              </div>
            )}
          </div>

          {/* Cart Summary & Payment Panel */}
          <div className="border-t border-[#e3e1da] dark:border-[#252830] pt-2.5 space-y-2 text-xs">
            {/* Subtotal & Discount */}
            <div className="flex justify-between text-[#6e6b65] dark:text-[#9698a3]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">৳ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-[#6e6b65] dark:text-[#9698a3]">
              <span>Promotional discount (৳)</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                className="w-20 px-2 py-0.5 bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] rounded text-right font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5] text-xs focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
              />
            </div>

            {/* Net Total Display */}
            <div className="flex justify-between items-baseline p-2.5 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
              <span className="text-xs font-semibold text-[#191817] dark:text-[#f3f3f5]">
                Net Payable
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-[#b45309] dark:text-[#fbbf24]">
                ৳ {total.toFixed(2)}
              </span>
            </div>

            {/* Payment Method Selector Buttons */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {(['cash', 'card', 'mobile_banking', 'due'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-colors btn-tactile ${
                    paymentMethod === method
                      ? method === 'due'
                        ? 'bg-[#c2410c] dark:bg-[#f87171] text-white dark:text-[#111215]'
                        : 'bg-[#6b21a8] dark:bg-[#7e22ce] text-white'
                      : 'bg-[#f8f7f4] dark:bg-[#111215] text-[#6e6b65] dark:text-[#9698a3] border border-[#e3e1da] dark:border-[#252830] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
                  }`}
                >
                  {method === 'mobile_banking' ? 'MFS' : method === 'due' ? 'Baki (Due)' : method.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tendered Amount & Balance */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <label className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] font-medium block mb-1">
                  Tendered amount (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] rounded-lg font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5] text-xs focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] font-medium block mb-1">
                  {dueAmount > 0 ? 'Remaining Due (Baki)' : 'Change Due'}
                </label>
                <div
                  className={`px-2.5 py-1.5 rounded-lg font-mono tabular-nums text-xs font-bold border ${
                    dueAmount > 0
                      ? 'bg-[#f2f0eb] dark:bg-[#1f2229] border-[#e3e1da] dark:border-[#252830] text-[#c2410c] dark:text-[#f87171]'
                      : 'bg-[#f8f7f4] dark:bg-[#111215] border-[#e3e1da] dark:border-[#252830] text-[#6b21a8] dark:text-[#c084fc]'
                  }`}
                >
                  ৳ {dueAmount > 0 ? dueAmount.toFixed(2) : changeAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-lg bg-[#f2f0eb] dark:bg-[#1f2229] border border-[#e3e1da] dark:border-[#252830] text-[#c2410c] dark:text-[#f87171] text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Complete Sale Action */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                disabled={items.length === 0}
                className="px-3 py-2 bg-[#f8f7f4] hover:bg-[#f0eee9] dark:bg-[#111215] dark:hover:bg-[#1f2229] text-[#6e6b65] dark:text-[#9698a3] text-xs font-medium rounded-lg border border-[#e3e1da] dark:border-[#252830] transition-colors btn-tactile disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading || items.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-semibold text-xs py-2 rounded-lg transition-colors btn-tactile disabled:opacity-40"
              >
                <IconCheck className="w-3.5 h-3.5" />
                <span>{checkoutLoading ? 'Processing transaction...' : 'Complete & Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-sm w-full p-5 shadow-xl animate-dialog">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm text-[#191817] dark:text-[#f3f3f5]">
                Register Customer Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-[#6e6b65] hover:text-[#191817] dark:text-[#9698a3] dark:hover:text-[#f3f3f5] p-1"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6e6b65] dark:text-[#9698a3] mb-4">
              Enter customer details for recording Baki Khata credit accounts.
            </p>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#191817] dark:text-[#f3f3f5] block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#191817] dark:text-[#f3f3f5] block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="01700000000"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-1.5 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f2f0eb] dark:hover:bg-[#1f2229] font-medium btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-semibold btn-tactile shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      {completedOrder && (
        <ThermalReceipt
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </AppShell>
  );
}

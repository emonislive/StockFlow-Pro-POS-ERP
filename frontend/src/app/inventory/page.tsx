'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import { Product } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconClose,
} from '@/components/Icons';
import { useDebounce } from '@/hooks/useDebounce';
import { ConfirmModal } from '@/components/ConfirmModal';
import { TableRowSkeleton } from '@/components/SkeletonLoader';
import { CopyButton } from '@/components/CopyButton';

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([
    'Groceries',
    'Dairy',
    'Bakery',
    'Beverages',
    'Snacks',
    'Meat & Fish',
    'Produce',
    'Personal Care',
    'Household',
  ]);
  const [units, setUnits] = useState<string[]>([
    'pcs',
    'packet',
    'kg',
    'gram',
    'litre',
    'ml',
    'box',
    'bottle',
    'can',
    'bundle',
  ]);

  // Delete Confirmation Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Groceries',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    unit: 'pcs',
    description: '',
  });

  // Admin New Category & Unit creation modes
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewUnitMode, setIsNewUnitMode] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Stock replenishment');

  const fetchProducts = async () => {
    setLoading(true);
    const [prodRes, catRes, unitRes] = await Promise.all([
      api.get<Product[]>('/products?all=1'),
      api.get<string[]>('/products/categories'),
      api.get<string[]>('/products/units'),
    ]);

    if (prodRes.success && prodRes.data) {
      setProducts(prodRes.data);
    }
    if (catRes.success && catRes.data && catRes.data.length > 0) {
      setCategories(catRes.data);
    }
    if (unitRes.success && unitRes.data && unitRes.data.length > 0) {
      setUnits(unitRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetAddModal = () => {
    setShowAddModal(false);
    setIsNewCategoryMode(false);
    setNewCategoryName('');
    setIsNewUnitMode(false);
    setNewUnitName('');
    setProductForm({
      name: '',
      sku: '',
      barcode: '',
      category: categories[0] || 'Groceries',
      cost_price: '',
      selling_price: '',
      stock_quantity: '',
      unit: units[0] || 'pcs',
      description: '',
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory =
      isAdmin && isNewCategoryMode && newCategoryName.trim()
        ? newCategoryName.trim()
        : productForm.category;

    const finalUnit =
      isAdmin && isNewUnitMode && newUnitName.trim()
        ? newUnitName.trim()
        : productForm.unit;

    const res = await api.post<Product>('/products', {
      ...productForm,
      category: finalCategory,
      unit: finalUnit,
      cost_price: Number(productForm.cost_price),
      selling_price: Number(productForm.selling_price),
      stock_quantity: Number(productForm.stock_quantity),
    });

    if (res.success && res.data) {
      // If admin created new category, include it in the active categories list
      if (isAdmin && isNewCategoryMode && newCategoryName.trim()) {
        if (!categories.includes(newCategoryName.trim())) {
          setCategories((prev) => [...prev, newCategoryName.trim()].sort());
        }
      }
      // If admin created new unit, include it in active units list
      if (isAdmin && isNewUnitMode && newUnitName.trim()) {
        if (!units.includes(newUnitName.trim())) {
          setUnits((prev) => [...prev, newUnitName.trim()].sort());
        }
      }

      resetAddModal();
      fetchProducts();
    } else {
      alert(res.message || 'Failed to create product.');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const res = await api.post(`/products/${adjustingProduct.id}/adjust-stock`, {
      adjustment_type: adjustmentType,
      quantity: adjustmentQty,
      reason: adjustmentReason,
    });

    if (res.success) {
      setAdjustingProduct(null);
      fetchProducts();
    } else {
      alert(res.message || 'Failed to adjust stock.');
    }
  };

  const executeDeleteProduct = async () => {
    if (!productToDelete) return;
    const res = await api.delete(`/products/${productToDelete.id}`);
    setProductToDelete(null);
    if (res.success) {
      fetchProducts();
    } else {
      alert(res.message || 'Failed to delete product.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.barcode.includes(debouncedSearch);
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell title="Inventory Catalog" subtitle="Track product stock levels, barcodes, and pricing">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-80">
            <IconSearch className="w-4 h-4 text-[#73726c] dark:text-[#a0a2aa] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, SKU, barcode..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] font-medium transition-colors"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => {
            setShowAddModal(true);
            setIsNewCategoryMode(false);
            setIsNewUnitMode(false);
          }}
          className="btn-tactile flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <IconPlus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Inventory Table Card */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#73726c] dark:text-[#a0a2aa] font-semibold text-[11px]">
                <th className="py-2.5 px-4">Item Details</th>
                <th className="py-2.5 px-4 font-mono">Barcode</th>
                <th className="py-2.5 px-4 font-mono">SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Cost Price</th>
                <th className="py-2.5 px-4 text-right">Selling Price</th>
                <th className="py-2.5 px-4 text-center">Stock Level</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e1da] dark:divide-[#252830]">
              {loading ? (
                <TableRowSkeleton columns={8} rows={6} />
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.stock_quantity <= 10;
                  return (
                    <tr key={product.id} className="hover:bg-[#f8f7f4] dark:hover:bg-[#14161b] transition-colors">
                      <td className="py-3 px-4 text-[#191817] dark:text-[#f3f3f5]">
                        <div className="font-medium text-sm text-[#191817] dark:text-[#f3f3f5]">{product.name}</div>
                        {product.description && (
                          <div className="text-[11px] text-[#73726c] dark:text-[#a0a2aa] line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#73726c] dark:text-[#a0a2aa]">
                        <div className="flex items-center gap-1.5">
                          <span className="tabular-nums">{product.barcode}</span>
                          <CopyButton text={product.barcode} label="Barcode" />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#73726c] dark:text-[#a0a2aa]">
                        <div className="flex items-center gap-1.5">
                          <span>{product.sku}</span>
                          <CopyButton text={product.sku} label="SKU" />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#f2f0eb] dark:bg-[#1f2229] text-[#55534e] dark:text-[#c4c7d0] text-[11px] font-medium border border-[#e3e1da] dark:border-[#2a2d36]">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#73726c] dark:text-[#a0a2aa]">
                        ৳ {Number(product.cost_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#191817] dark:text-[#f3f3f5]">
                        ৳ {Number(product.selling_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-medium text-[11px] tabular-nums border ${
                            product.stock_quantity === 0
                              ? 'bg-[#fee2e2] dark:bg-[#7f1d1d]/30 text-[#991b1b] dark:text-[#f87171] border-[#fecaca] dark:border-[#991b1b]/50'
                              : isLow
                              ? 'bg-[#ffedd5] dark:bg-[#7c2d12]/30 text-[#9a3412] dark:text-[#fb923c] border-[#fed7aa] dark:border-[#9a3412]/50'
                              : 'bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#065f46] dark:text-[#34d399] border-[#a7f3d0] dark:border-[#047857]/40'
                          }`}
                        >
                          {product.stock_quantity} {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAdjustingProduct(product)}
                            className="btn-tactile px-2.5 py-1 rounded-md bg-[#f8f7f4] hover:bg-[#e3e1da] dark:bg-[#111215] dark:hover:bg-[#1f2229] text-[#191817] dark:text-[#f3f3f5] text-[11px] font-medium border border-[#e3e1da] dark:border-[#252830] transition-colors cursor-pointer"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="btn-tactile p-1.5 rounded-md text-[#73726c] hover:text-[#c2410c] dark:text-[#a0a2aa] dark:hover:text-[#f87171] transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#73726c] dark:text-[#a0a2aa] text-xs">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-lg w-full p-6 shadow-xl animate-dialog">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-base text-[#191817] dark:text-[#f3f3f5]">Add New Inventory Item</h3>
              <button
                onClick={resetAddModal}
                className="btn-tactile p-1 rounded-md text-[#73726c] hover:text-[#191817] dark:text-[#a0a2aa] dark:hover:text-[#f3f3f5] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Role indicator badge */}
            <div className="mb-4">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                  isAdmin
                    ? 'bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#065f46] dark:text-[#34d399] border-[#a7f3d0] dark:border-[#047857]/40'
                    : 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#73726c] dark:text-[#a0a2aa] border-[#e3e1da] dark:border-[#2a2d36]'
                }`}
              >
                {isAdmin ? 'Admin Mode: Can create new categories and units' : 'Cashier Mode: Select from created options only'}
              </span>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Fresh Dairy Milk 1L"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                    Barcode Number
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="894110000000"
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="MLK-001"
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category with Admin creation toggle & Cashier restricted dropdown */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">
                      Category
                    </label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategoryMode(!isNewCategoryMode);
                          if (!isNewCategoryMode) setNewCategoryName('');
                        }}
                        className="text-[11px] text-[#6b21a8] dark:text-[#c084fc] hover:underline font-medium cursor-pointer"
                      >
                        {isNewCategoryMode ? 'Select existing' : '+ Add new'}
                      </button>
                    )}
                  </div>

                  {isAdmin && isNewCategoryMode ? (
                    <div>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter new category name..."
                        className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#6b21a8] dark:border-[#a855f7] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <select
                      value={productForm.category}
                      onChange={(e) => {
                        if (e.target.value === '__CREATE_NEW__') {
                          setIsNewCategoryMode(true);
                          setNewCategoryName('');
                        } else {
                          setProductForm({ ...productForm, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {isAdmin && (
                        <option value="__CREATE_NEW__" className="text-[#6b21a8] font-semibold">
                          + Create New Category...
                        </option>
                      )}
                    </select>
                  )}
                  {!isAdmin && (
                    <span className="text-[10px] text-[#73726c] dark:text-[#a0a2aa] mt-0.5 block">
                      Cashier: select from existing categories only
                    </span>
                  )}
                </div>

                {/* Unit of Measure with Admin creation toggle & Cashier restricted dropdown */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">
                      Unit of Measure
                    </label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewUnitMode(!isNewUnitMode);
                          if (!isNewUnitMode) setNewUnitName('');
                        }}
                        className="text-[11px] text-[#6b21a8] dark:text-[#c084fc] hover:underline font-medium cursor-pointer"
                      >
                        {isNewUnitMode ? 'Select existing' : '+ Add new'}
                      </button>
                    )}
                  </div>

                  {isAdmin && isNewUnitMode ? (
                    <div>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="Enter new unit (e.g. crate, roll)..."
                        className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#6b21a8] dark:border-[#a855f7] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <select
                      value={productForm.unit}
                      onChange={(e) => {
                        if (e.target.value === '__CREATE_NEW__') {
                          setIsNewUnitMode(true);
                          setNewUnitName('');
                        } else {
                          setProductForm({ ...productForm, unit: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      {isAdmin && (
                        <option value="__CREATE_NEW__" className="text-[#6b21a8] font-semibold">
                          + Create New Unit...
                        </option>
                      )}
                    </select>
                  )}
                  {!isAdmin && (
                    <span className="text-[10px] text-[#73726c] dark:text-[#a0a2aa] mt-0.5 block">
                      Cashier: select from existing units only
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                    Cost Price (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                    placeholder="80.00"
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                    Selling Price (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.selling_price}
                    onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })}
                    placeholder="95.00"
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={resetAddModal}
                  className="btn-tactile flex-1 py-2 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f8f7f4] dark:hover:bg-[#111215] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile flex-1 py-2 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-medium cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-sm w-full p-6 shadow-xl animate-dialog">
            <h3 className="font-semibold text-sm text-[#191817] dark:text-[#f3f3f5] mb-1">Quick Stock Adjustment</h3>
            <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mb-4">
              Item: <span className="text-[#191817] dark:text-[#f3f3f5] font-medium">{adjustingProduct.name}</span> (Current:{' '}
              <span className="font-mono tabular-nums">{adjustingProduct.stock_quantity}</span> {adjustingProduct.unit})
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['add', 'subtract', 'set'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustmentType(type)}
                      className={`btn-tactile py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                        adjustmentType === type
                          ? 'bg-[#6b21a8] dark:bg-[#7e22ce] text-white'
                          : 'bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[#73726c] dark:text-[#a0a2aa]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Supplier delivery, damaged goods"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="btn-tactile flex-1 py-2 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f8f7f4] dark:hover:bg-[#111215] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile flex-1 py-2 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-medium cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Delete Inventory Product"
        message={`Are you sure you want to delete "${productToDelete?.name}" (${productToDelete?.sku})? This product will be permanently removed from catalog.`}
        confirmText="Delete Product"
        type="danger"
        onConfirm={executeDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </AppShell>
  );
}

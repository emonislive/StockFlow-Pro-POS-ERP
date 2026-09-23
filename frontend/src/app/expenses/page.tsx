'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import {
  IconSearch,
  IconPlus,
  IconTrash,
} from '@/components/Icons';
import { TableRowSkeleton } from '@/components/SkeletonLoader';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [totalExpense, setTotalExpense] = useState<number>(0);

  // New Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Delete Expense Confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<any | null>(null);

  const categories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Other'];

  const fetchExpenses = async () => {
    setLoading(true);
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory;

    const res = await api.get<any>('/expenses', params);
    if (res.success && res.data) {
      setExpenses(res.data);
      if (res.meta?.total_expense !== undefined) {
        setTotalExpense(res.meta.total_expense);
      } else {
        const sum = res.data.reduce((acc: number, item: any) => acc + Number(item.amount), 0);
        setTotalExpense(sum);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [searchTerm, selectedCategory]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/expenses', {
      ...formData,
      amount: Number(formData.amount),
    });

    if (res.success) {
      setShowAddModal(false);
      setFormData({
        title: '',
        category: 'Utilities',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchExpenses();
    } else {
      alert(res.message || 'Failed to record expense.');
    }
  };

  const executeDeleteExpense = async () => {
    if (!expenseToDelete) return;
    const res = await api.delete(`/expenses/${expenseToDelete.id}`);
    setExpenseToDelete(null);
    if (res.success) {
      fetchExpenses();
    } else {
      alert(res.message || 'Failed to delete expense.');
    }
  };

  return (
    <AppShell title="Expense Ledger" subtitle="Monitor operational overhead, bills, and vendor disbursements">
      {/* Banner */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">Total Recorded Expenses</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5] mt-0.5">
            ৳ {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mt-0.5">Store overhead and operational payments</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-tactile flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <IconPlus className="w-4 h-4" />
          <span>Log New Expense</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <IconSearch className="w-4 h-4 text-[#73726c] dark:text-[#a0a2aa] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses by title or category..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] font-medium transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#73726c] dark:text-[#a0a2aa] font-semibold text-[11px]">
                <th className="py-2.5 px-4">Expense Title</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4 text-right">Amount (৳)</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e1da] dark:divide-[#252830]">
              {loading ? (
                <TableRowSkeleton columns={6} rows={5} />
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#f8f7f4] dark:hover:bg-[#14161b] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#191817] dark:text-[#f3f3f5]">{exp.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#f2f0eb] dark:bg-[#1f2229] text-[#55534e] dark:text-[#c4c7d0] text-[11px] font-medium border border-[#e3e1da] dark:border-[#2a2d36]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#73726c] dark:text-[#a0a2aa]">{exp.expense_date}</td>
                    <td className="py-3 px-4 text-[#73726c] dark:text-[#a0a2aa] truncate max-w-xs">{exp.notes || 'None'}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#191817] dark:text-[#f3f3f5]">
                      ৳ {Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setExpenseToDelete(exp)}
                        className="btn-tactile p-1.5 rounded-md text-[#73726c] hover:text-[#c2410c] dark:text-[#a0a2aa] dark:hover:text-[#f87171] transition-colors cursor-pointer"
                        title="Delete Expense"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#73726c] dark:text-[#a0a2aa] text-xs">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-sm w-full p-5 shadow-xl animate-dialog">
            <h3 className="font-semibold text-base text-[#191817] dark:text-[#f3f3f5] mb-1">Log Store Expense</h3>
            <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mb-4">Record rent, utility, or supply expenditures.</p>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Title or Reason
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Monthly Electricity Bill"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional context or invoice ref"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-tactile flex-1 py-2 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f8f7f4] dark:hover:bg-[#111215] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile flex-1 py-2 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-medium cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Delete Expense Record"
        message={`Are you sure you want to delete "${expenseToDelete?.title}" (${expenseToDelete ? '৳ ' + Number(expenseToDelete.amount).toFixed(2) : ''})? This will alter financial overhead reporting.`}
        confirmText="Delete Expense"
        type="danger"
        onConfirm={executeDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </AppShell>
  );
}

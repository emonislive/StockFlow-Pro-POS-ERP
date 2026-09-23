'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import { Customer } from '@/context/CartContext';
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [onlyDue, setOnlyDue] = useState(false);
  const [totalReceivables, setTotalReceivables] = useState<number>(0);

  // Delete Customer Modal
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    total_due: '0',
  });

  // Collect Due Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'cash' | 'card' | 'mobile_banking'>('cash');
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [collectLoading, setCollectLoading] = useState<boolean>(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const params: any = { all: 1 };
    if (onlyDue) params.has_due = 1;
    if (debouncedSearch) params.search = debouncedSearch;

    const res = await api.get<Customer[]>('/customers', params);
    if (res.success && res.data) {
      setCustomers(res.data);
      const totalDueSum = res.data.reduce((acc, c) => acc + Number(c.total_due || 0), 0);
      setTotalReceivables(totalDueSum);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [onlyDue, debouncedSearch]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post<Customer>('/customers', {
      ...newCustomer,
      total_due: Number(newCustomer.total_due) || 0,
    });

    if (res.success && res.data) {
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', total_due: '0' });
      fetchCustomers();
    } else {
      alert(res.message || 'Failed to create customer.');
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (collectAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    if (collectAmount > Number(selectedCustomer.total_due)) {
      alert(`Payment cannot exceed existing due (৳ ${Number(selectedCustomer.total_due).toFixed(2)})`);
      return;
    }

    setCollectLoading(true);
    const res = await api.post(`/customers/${selectedCustomer.id}/collect-due`, {
      amount: collectAmount,
      payment_method: collectMethod,
      notes: collectNotes,
    });
    setCollectLoading(false);

    if (res.success) {
      setSelectedCustomer(null);
      setCollectAmount(0);
      setCollectNotes('');
      fetchCustomers();
    } else {
      alert(res.message || 'Failed to record payment.');
    }
  };

  const executeDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const res = await api.delete(`/customers/${customerToDelete.id}`);
    setCustomerToDelete(null);
    if (res.success) {
      fetchCustomers();
    } else {
      alert(res.message || 'Failed to delete customer.');
    }
  };

  return (
    <AppShell title="Baki Khata (Customer Ledger)" subtitle="Track accounts receivable and collect customer payments">
      {/* Overview Banner */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">Total Baki Khata Receivables</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#c2410c] dark:text-[#f87171] mt-0.5">
            ৳ {totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mt-0.5">Total pending balance across all credit customers</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-tactile flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <IconPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 sm:w-80 w-full">
          <IconSearch className="w-4 h-4 text-[#73726c] dark:text-[#a0a2aa] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer by name, phone, address..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-[#191817] dark:text-[#f3f3f5] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyDue}
            onChange={(e) => setOnlyDue(e.target.checked)}
            className="w-4 h-4 rounded text-[#6b21a8] dark:text-[#a855f7] bg-[#f8f7f4] dark:bg-[#111215] border-[#e3e1da] dark:border-[#252830] focus:ring-0"
          />
          <span>Show Only Customers with Due Balance</span>
        </label>
      </div>

      {/* Customers Table */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#73726c] dark:text-[#a0a2aa] font-semibold text-[11px]">
                <th className="py-2.5 px-4">Customer Name</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4">Address</th>
                <th className="py-2.5 px-4 text-right">Outstanding Baki (৳)</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e1da] dark:divide-[#252830]">
              {loading ? (
                <TableRowSkeleton columns={5} rows={5} />
              ) : (
                customers.map((c) => {
                  const hasDue = Number(c.total_due) > 0;
                  return (
                    <tr key={c.id} className="hover:bg-[#f8f7f4] dark:hover:bg-[#14161b] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#191817] dark:text-[#f3f3f5]">
                        <div className="text-sm">{c.name}</div>
                        {c.email && <div className="text-[11px] text-[#73726c] dark:text-[#a0a2aa]">{c.email}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#73726c] dark:text-[#a0a2aa]">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums">{c.phone}</span>
                            <CopyButton text={c.phone} label="Phone" />
                          </div>
                        ) : (
                          <span className="text-[#a09e99] dark:text-[#65676e]">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#73726c] dark:text-[#a0a2aa] truncate max-w-xs">{c.address || 'Local Customer'}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {hasDue ? (
                          <span className="text-[#c2410c] dark:text-[#f87171]">
                            ৳ {Number(c.total_due).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[#6b21a8] dark:text-[#c084fc]">Paid (৳ 0.00)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasDue && (
                            <button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCollectAmount(Number(c.total_due));
                              }}
                              className="btn-tactile px-2.5 py-1 rounded-md bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-[11px] transition-colors cursor-pointer"
                            >
                              Collect Payment
                            </button>
                          )}
                          <button
                            onClick={() => setCustomerToDelete(c)}
                            className="btn-tactile p-1.5 rounded-md text-[#73726c] hover:text-[#c2410c] dark:text-[#a0a2aa] dark:hover:text-[#f87171] transition-colors cursor-pointer"
                            title="Delete Customer"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#73726c] dark:text-[#a0a2aa] text-xs">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-sm w-full p-5 shadow-xl animate-dialog">
            <h3 className="font-semibold text-base text-[#191817] dark:text-[#f3f3f5] mb-1">Collect Due Payment</h3>
            <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mb-4">
              Customer: <span className="text-[#191817] dark:text-[#f3f3f5] font-medium">{selectedCustomer.name}</span>
            </p>

            <div className="mb-4 p-3 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] flex justify-between items-center text-xs">
              <span className="text-[#73726c] dark:text-[#a0a2aa]">Current Outstanding Due:</span>
              <span className="font-semibold font-mono tabular-nums text-[#c2410c] dark:text-[#f87171] text-sm">
                ৳ {Number(selectedCustomer.total_due).toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Payment Amount to Collect (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(selectedCustomer.total_due)}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'card', 'mobile_banking'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCollectMethod(method)}
                      className={`btn-tactile py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                        collectMethod === method
                          ? 'bg-[#6b21a8] dark:bg-[#7e22ce] text-white'
                          : 'bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[#73726c] dark:text-[#a0a2aa]'
                      }`}
                    >
                      {method === 'mobile_banking' ? 'MFS' : method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Notes or Receipt Reference
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="In-store cash settlement"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="btn-tactile flex-1 py-2 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f8f7f4] dark:hover:bg-[#111215] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collectLoading}
                  className="btn-tactile flex-1 py-2 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
                >
                  {collectLoading ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-sm w-full p-5 shadow-xl animate-dialog">
            <h3 className="font-semibold text-base text-[#191817] dark:text-[#f3f3f5] mb-1">Add Customer</h3>
            <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mb-4">Register new customer for Baki Khata credit records.</p>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="01712345678"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] font-mono tabular-nums focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Address or Area"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Delete Customer Record"
        message={`Are you sure you want to delete "${customerToDelete?.name}"? All associated ledger notes will be detached.`}
        confirmText="Delete Customer"
        type="danger"
        onConfirm={executeDeleteCustomer}
        onCancel={() => setCustomerToDelete(null)}
      />
    </AppShell>
  );
}

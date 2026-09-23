'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import {
  IconPos,
  IconInventory,
  IconCustomers,
  IconExpenses,
  IconTrendingUp,
} from '@/components/Icons';
import { CardSkeleton, TableRowSkeleton } from '@/components/SkeletonLoader';
import { CopyButton } from '@/components/CopyButton';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await api.get<any>('/dashboard/metrics');
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const summary = data?.summary || {
    sales_today: 0,
    sales_month: 0,
    sales_total: 0,
    expenses_month: 0,
    expenses_total: 0,
    net_profit_month: 0,
    total_receivables: 0,
    total_products: 0,
    low_stock_count: 0,
  };

  const maxRevenue = data?.top_products?.reduce(
    (acc: number, item: any) => Math.max(acc, Number(item.total_revenue || 0)),
    0
  ) || 1;

  return (
    <AppShell title="Business Overview" subtitle="Real-time performance indicators and inventory alerts">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#191817] dark:text-[#f3f3f5] tracking-tight">
            Financial & Stock Overview
          </h2>
          <p className="text-xs text-[#6e6b65] dark:text-[#9698a3] mt-0.5">
            Shift performance, active customer receivables, and supply status
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-[#ffffff] dark:bg-[#17191e] hover:bg-[#f2f0eb] dark:hover:bg-[#1f2229] text-[#191817] dark:text-[#f3f3f5] text-xs font-medium border border-[#e3e1da] dark:border-[#252830] transition-colors btn-tactile disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh data'}
          </button>
          <Link
            href="/pos"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-colors btn-tactile shadow-xs"
          >
            <IconPos className="w-3.5 h-3.5" />
            <span>Open Register</span>
          </Link>
        </div>
      </div>

      {/* Integrated Financial Ledger Strip */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl overflow-hidden mb-6 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e3e1da] dark:divide-[#252830]">
            {/* Today Sales */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#6e6b65] dark:text-[#9698a3]">
                  Today sales
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5] tracking-tight mt-1">
                  ৳ {Number(summary.sales_today).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-[#6e6b65] dark:text-[#9698a3] mt-3 font-mono tabular-nums">
                Month: ৳ {Number(summary.sales_month).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Month Overhead */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#6e6b65] dark:text-[#9698a3]">
                  Recorded expenses (Month)
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5] tracking-tight mt-1">
                  ৳ {Number(summary.expenses_month).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-[#6e6b65] dark:text-[#9698a3] mt-3 font-mono tabular-nums">
                Overall: ৳ {Number(summary.expenses_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Net Operating Profit */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#6e6b65] dark:text-[#9698a3]">
                  Net operating margin
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight mt-1 ${
                    summary.net_profit_month >= 0
                      ? 'text-[#b45309] dark:text-[#fbbf24]'
                      : 'text-[#c2410c] dark:text-[#f87171]'
                  }`}
                >
                  ৳ {Number(summary.net_profit_month).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-[#6e6b65] dark:text-[#9698a3] mt-3">
                Sales revenue less operating costs
              </div>
            </div>

            {/* Baki Khata Receivables */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#6e6b65] dark:text-[#9698a3]">
                  Baki Khata receivables
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#c2410c] dark:text-[#f87171] tracking-tight mt-1">
                  ৳ {Number(summary.total_receivables).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-[#6e6b65] dark:text-[#9698a3] mt-3 flex justify-between items-center">
                <span>Customer credit due</span>
                <Link
                  href="/customers"
                  className="text-[#6b21a8] dark:text-[#c084fc] font-semibold hover:underline"
                >
                  Manage ledger
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Low Stock Alert & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Low Stock Watchlist (1 Column) */}
        <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e3e1da] dark:border-[#252830]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c2410c] dark:bg-[#f87171]" />
                <h3 className="font-semibold text-xs sm:text-sm text-[#191817] dark:text-[#f3f3f5]">
                  Low Stock Watchlist
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#f2f0eb] dark:bg-[#1f2229] text-[#c2410c] dark:text-[#f87171] border border-[#e3e1da] dark:border-[#252830]">
                {data?.low_stock_products?.length || 0} items
              </span>
            </div>

            <div className="space-y-2">
              {data?.low_stock_products?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]"
                >
                  <div className="truncate mr-2 min-w-0">
                    <div className="font-medium text-xs text-[#191817] dark:text-[#f3f3f5] truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] font-mono mt-0.5">
                      SKU: {item.sku}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#f2f0eb] dark:bg-[#1f2229] text-[#c2410c] dark:text-[#f87171] font-bold text-xs font-mono tabular-nums">
                      {item.stock_quantity} {item.unit}
                    </span>
                    <div className="text-[10px] font-mono tabular-nums text-[#6e6b65] dark:text-[#9698a3] mt-0.5">
                      ৳ {Number(item.selling_price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              {(!data?.low_stock_products || data.low_stock_products.length === 0) && !loading && (
                <div className="py-8 text-center text-xs text-[#6e6b65] dark:text-[#9698a3]">
                  All catalog items meet healthy safety thresholds.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e3e1da] dark:border-[#252830]">
            <Link
              href="/inventory"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f8f7f4] hover:bg-[#f0eee9] dark:bg-[#111215] dark:hover:bg-[#1f2229] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] text-xs font-medium transition-colors btn-tactile"
            >
              <IconInventory className="w-3.5 h-3.5" />
              <span>Open inventory catalog</span>
            </Link>
          </div>
        </div>

        {/* Recent Invoices Table (2 Columns) */}
        <div className="lg:col-span-2 bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e3e1da] dark:border-[#252830]">
              <h3 className="font-semibold text-xs sm:text-sm text-[#191817] dark:text-[#f3f3f5]">
                Recent Completed Transactions
              </h3>
              <Link
                href="/reports"
                className="text-xs text-[#6b21a8] dark:text-[#c084fc] font-medium hover:underline"
              >
                View full ledger
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e3e1da] dark:border-[#252830] text-[#6e6b65] dark:text-[#9698a3] font-medium text-[11px]">
                    <th className="py-2 px-2.5">Invoice</th>
                    <th className="py-2 px-2.5">Customer</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5 text-right">Amount</th>
                    <th className="py-2 px-2.5">Payment</th>
                    <th className="py-2 px-2.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e1da]/60 dark:divide-[#252830]/60">
                  {loading ? (
                    <TableRowSkeleton columns={6} rows={5} />
                  ) : (
                    data?.recent_orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#f8f7f4] dark:hover:bg-[#1f2229]/50 transition-colors">
                        <td className="py-2.5 px-2.5 font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">
                          <div className="flex items-center gap-1">
                            <span>{order.invoice_no}</span>
                            <CopyButton text={order.invoice_no} label="Invoice" />
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-[#191817] dark:text-[#f3f3f5]">
                          {order.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                              order.sale_type === 'Paid'
                                ? 'bg-[#faf5ff] dark:bg-[#581c87]/30 text-[#6b21a8] dark:text-[#d8b4fe] border-[#e9d5ff] dark:border-[#7e22ce]/40'
                                : order.sale_type === 'Partial'
                                ? 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#d97706] dark:text-[#fbbf24] border-[#e3e1da] dark:border-[#252830]'
                                : 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#c2410c] dark:text-[#f87171] border-[#e3e1da] dark:border-[#252830]'
                            }`}
                          >
                            {order.sale_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-semibold text-[#191817] dark:text-[#f3f3f5]">
                          ৳ {Number(order.total_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-[#6e6b65] dark:text-[#9698a3] capitalize font-mono text-[11px]">
                          {order.payment_method === 'mobile_banking' ? 'MFS' : order.payment_method}
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-[#6e6b65] dark:text-[#9698a3] font-mono tabular-nums text-[11px]">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}

                  {!loading && (!data?.recent_orders || data.recent_orders.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#6e6b65] dark:text-[#9698a3] text-xs">
                        No transactions recorded yet in this register session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Row */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e3e1da] dark:border-[#252830]">
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-[#191817] dark:text-[#f3f3f5]">
              Top Moving Inventory
            </h3>
            <p className="text-[11px] text-[#6e6b65] dark:text-[#9698a3] mt-0.5">
              Ranked by revenue generation and units transacted
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-xs text-[#6b21a8] dark:text-[#c084fc] font-medium hover:underline"
          >
            Catalog management
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data?.top_products?.map((item: any, idx: number) => {
            const percentage = Math.min(100, Math.round((Number(item.total_revenue || 0) / maxRevenue) * 100));
            return (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[#6e6b65] dark:text-[#9698a3] font-medium">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-[#191817] dark:text-[#f3f3f5]">
                      {item.total_qty} units
                    </span>
                  </div>
                  <div className="font-medium text-xs text-[#191817] dark:text-[#f3f3f5] line-clamp-2">
                    {item.product?.name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#e3e1da] dark:border-[#252830]">
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="text-[10px] text-[#6e6b65] dark:text-[#9698a3]">Revenue</span>
                    <span className="font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">
                      ৳ {Number(item.total_revenue).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#e3e1da] dark:bg-[#252830] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6b21a8] dark:bg-[#a855f7] rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {(!data?.top_products || data.top_products.length === 0) && !loading && (
            <div className="col-span-full py-6 text-center text-xs text-[#6e6b65] dark:text-[#9698a3]">
              Top transacted items will automatically appear as POS checkouts complete.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import { IconPrinter } from '@/components/Icons';
import { CopyButton } from '@/components/CopyButton';
import { CardSkeleton } from '@/components/SkeletonLoader';
import { useAuth } from '@/context/AuthContext';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'financial'>('sales');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [salesData, setSalesData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    if (activeTab === 'sales') {
      const res = await api.get<any>('/reports/sales', { start_date: startDate, end_date: endDate });
      if (res.success && res.data) {
        setSalesData(res.data);
      }
    } else {
      const res = await api.get<any>('/reports/financial', { start_date: startDate, end_date: endDate });
      if (res.success && res.data) {
        setFinancialData(res.data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, startDate, endDate]);

  return (
    <AppShell title="Financial and Sales Analytics" subtitle="Audited performance reports, gross margins, and statement ledger">
      {/* Top Filter Bar (Hidden when printing) */}
      <div className="no-print bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Tab Selector */}
        <div className="flex rounded-lg bg-[#f8f7f4] dark:bg-[#111215] p-1 border border-[#e3e1da] dark:border-[#252830]">
          <button
            onClick={() => setActiveTab('sales')}
            className={`btn-tactile px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-[#6b21a8] dark:bg-[#7e22ce] text-white'
                : 'text-[#73726c] dark:text-[#a0a2aa] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
            }`}
          >
            Sales Ledger
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`btn-tactile px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'financial'
                ? 'bg-[#6b21a8] dark:bg-[#7e22ce] text-white'
                : 'text-[#73726c] dark:text-[#a0a2aa] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
            }`}
          >
            Profit and Loss Statement
          </button>
        </div>

        {/* Date Filters & Print */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#73726c] dark:text-[#a0a2aa] bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] rounded-lg px-2.5 py-1.5 font-mono">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[#191817] dark:text-[#f3f3f5] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#73726c] dark:text-[#a0a2aa] bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] rounded-lg px-2.5 py-1.5 font-mono">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[#191817] dark:text-[#f3f3f5] focus:outline-none"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <IconPrinter className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-5 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ON-SCREEN INTERACTIVE VIEWS (Hidden during print)                         */}
      {/* ========================================================================= */}
      <div className="print:hidden">
        {/* Sales Tab Screen Content */}
        {!loading && activeTab === 'sales' && salesData && (
          <div className="space-y-5">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5">
                <span className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">Gross Sales</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5] mt-1">
                  ৳ {Number(salesData.summary.total_sales).toFixed(2)}
                </div>
                <div className="text-[11px] text-[#73726c] dark:text-[#a0a2aa] mt-1 font-mono tabular-nums">{salesData.summary.order_count} Total Invoices</div>
              </div>

              <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5">
                <span className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">Collected Cash</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#b45309] dark:text-[#fbbf24] mt-1">
                  ৳ {Number(salesData.summary.total_paid).toFixed(2)}
                </div>
                <div className="text-[11px] text-[#73726c] dark:text-[#a0a2aa] mt-1">Cash, card, and MFS payments</div>
              </div>

              <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5">
                <span className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">Credit (Baki Khata)</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#c2410c] dark:text-[#f87171] mt-1">
                  ৳ {Number(salesData.summary.total_due).toFixed(2)}
                </div>
                <div className="text-[11px] text-[#73726c] dark:text-[#a0a2aa] mt-1">Recorded to customer due balances</div>
              </div>

              <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-4 sm:p-5">
                <span className="text-xs font-medium text-[#73726c] dark:text-[#a0a2aa]">Total Discounts</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#d97706] dark:text-[#fbbf24] mt-1">
                  ৳ {Number(salesData.summary.total_discount).toFixed(2)}
                </div>
                <div className="text-[11px] text-[#73726c] dark:text-[#a0a2aa] mt-1">Promotional discounts granted</div>
              </div>
            </div>

            {/* Detailed Invoices Table */}
            <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-5">
              <h3 className="font-medium text-sm text-[#191817] dark:text-[#f3f3f5] mb-4">Invoices in Selected Range</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#73726c] dark:text-[#a0a2aa] font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Sale Type</th>
                      <th className="py-2.5 px-3 text-right">Net Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Due (Baki)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e1da] dark:divide-[#252830]">
                    {salesData.orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#f8f7f4] dark:hover:bg-[#14161b] transition-colors">
                        <td className="py-3 px-3 font-mono text-[#191817] dark:text-[#f3f3f5]">
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums">{order.invoice_no}</span>
                            <CopyButton text={order.invoice_no} label="Invoice" />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#73726c] dark:text-[#a0a2aa] font-mono tabular-nums">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-[#191817] dark:text-[#f3f3f5] font-medium">
                          {order.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#f2f0eb] dark:bg-[#1f2229] text-[#55534e] dark:text-[#c4c7d0] text-[10px] font-medium uppercase border border-[#e3e1da] dark:border-[#2a2d36]">
                            {order.sale_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#191817] dark:text-[#f3f3f5]">
                          ৳ {Number(order.total_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#6b21a8] dark:text-[#c084fc]">
                          ৳ {Number(order.paid_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#c2410c] dark:text-[#f87171]">
                          ৳ {Number(order.due_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Financial Statement Screen Content */}
        {!loading && activeTab === 'financial' && financialData && (
          <div className="space-y-5 max-w-3xl mx-auto">
            <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-6">
              <div className="border-b border-[#e3e1da] dark:border-[#252830] pb-4 mb-4">
                <h3 className="font-semibold text-base text-[#191817] dark:text-[#f3f3f5]">Profit and Loss Statement</h3>
                <p className="text-xs text-[#73726c] dark:text-[#a0a2aa]">
                  Period: {financialData.start_date} to {financialData.end_date}
                </p>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Revenue */}
                <div className="flex justify-between items-center text-sm py-2 border-b border-[#e3e1da] dark:border-[#252830]">
                  <span className="font-medium text-[#191817] dark:text-[#f3f3f5] font-sans">Operating Revenue (Total Sales):</span>
                  <span className="font-semibold text-[#191817] dark:text-[#f3f3f5] tabular-nums">৳ {Number(financialData.revenue).toFixed(2)}</span>
                </div>

                {/* COGS */}
                <div className="flex justify-between items-center text-sm py-2 border-b border-[#e3e1da] dark:border-[#252830] text-[#73726c] dark:text-[#a0a2aa]">
                  <span className="font-sans">Less: Cost of Goods Sold (COGS):</span>
                  <span className="tabular-nums">- ৳ {Number(financialData.cogs).toFixed(2)}</span>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between items-center text-sm py-2.5 px-3 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] font-semibold border border-[#e3e1da] dark:border-[#252830]">
                  <span className="font-sans text-[#191817] dark:text-[#f3f3f5]">Gross Profit:</span>
                  <span className="text-[#b45309] dark:text-[#fbbf24] tabular-nums">৳ {Number(financialData.gross_profit).toFixed(2)}</span>
                </div>

                {/* Operating Expenses */}
                <div className="pt-2">
                  <div className="font-sans font-medium text-[#191817] dark:text-[#f3f3f5] text-xs mb-2">Operating Expenses:</div>
                  <div className="space-y-2 pl-4 border-l border-[#e3e1da] dark:border-[#252830]">
                    {financialData.expenses_by_category?.map((cat: any) => (
                      <div key={cat.category} className="flex justify-between text-[#73726c] dark:text-[#a0a2aa] text-xs">
                        <span className="font-sans">{cat.category} Overhead:</span>
                        <span className="tabular-nums">৳ {Number(cat.total).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[#191817] dark:text-[#f3f3f5] font-medium pt-1 border-t border-[#e3e1da] dark:border-[#252830]">
                      <span className="font-sans">Total Operating Expenses:</span>
                      <span className="text-[#d97706] dark:text-[#fbbf24] tabular-nums">- ৳ {Number(financialData.expenses).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div
                  className={`flex justify-between items-center text-base py-3 px-4 rounded-lg border font-semibold ${
                    financialData.net_profit >= 0
                      ? 'bg-[#fefce8] dark:bg-[#78350f]/20 border-[#fde68a] dark:border-[#b45309]/40 text-[#b45309] dark:text-[#fbbf24]'
                      : 'bg-[#fee2e2] dark:bg-[#7f1d1d]/20 border-[#fecaca] dark:border-[#991b1b]/40 text-[#991b1b] dark:text-[#f87171]'
                  }`}
                >
                  <span className="font-sans">Net Operating Profit:</span>
                  <span className="tabular-nums">৳ {Number(financialData.net_profit).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED FORMAL AUDIT PRINT TEMPLATE (Activated automatically on Print)  */}
      {/* ========================================================================= */}
      <div className="hidden print:block text-black bg-white font-sans max-w-full">
        {/* Executive Letterhead */}
        <div className="border-b-2 border-black pb-3 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black tracking-tight text-black">STOCKFLOW PRO</h1>
              <p className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">Enterprise POS and ERP Solutions</p>
              <p className="text-[11px] text-neutral-600 mt-0.5">Central Commercial Outlet | Hotline: +880 1700-000000 | Dhaka, Bangladesh</p>
            </div>
            <div className="text-right text-[11px] text-neutral-700">
              <div className="font-bold text-black uppercase">Official Audit Document</div>
              <div>Generated: {new Date().toLocaleString()}</div>
              <div>Operator: {user?.name || 'Administrator'} ({user?.role || 'Admin'})</div>
            </div>
          </div>
        </div>

        {/* Statement Title & Meta Box */}
        <div className="bg-neutral-100 border border-neutral-300 p-3 mb-5 rounded-none">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                {activeTab === 'financial' ? 'Statement of Profit and Loss' : 'Detailed Sales and Invoice Ledger'}
              </h2>
              <p className="text-xs text-neutral-700 mt-0.5">
                Reporting Period: <span className="font-semibold text-black">{startDate}</span> to{' '}
                <span className="font-semibold text-black">{endDate}</span>
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="inline-block px-2 py-0.5 border border-neutral-400 font-bold text-[10px] uppercase bg-white">
                Reconciled Record
              </span>
            </div>
          </div>
        </div>

        {/* PRINT CONTENT: PROFIT AND LOSS */}
        {activeTab === 'financial' && financialData && (
          <div className="space-y-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-neutral-100 font-bold">
                  <th className="py-2 px-3 text-left">Accounting Category and Item</th>
                  <th className="py-2 px-3 text-right">Debit (৳)</th>
                  <th className="py-2 px-3 text-right">Credit (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {/* Operating Revenue */}
                <tr className="font-semibold">
                  <td className="py-2 px-3">Gross Operating Revenue (Total Product Sales)</td>
                  <td className="py-2 px-3 text-right"></td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{Number(financialData.revenue).toFixed(2)}</td>
                </tr>

                {/* COGS */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-neutral-800">Less: Cost of Goods Sold (COGS)</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{Number(financialData.cogs).toFixed(2)}</td>
                  <td className="py-2 px-3 text-right"></td>
                </tr>

                {/* Gross Profit Subtotal */}
                <tr className="border-t border-b border-black font-bold bg-neutral-50">
                  <td className="py-2 px-3">Gross Operating Profit Margin</td>
                  <td className="py-2 px-3 text-right"></td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-bold">
                    ৳ {Number(financialData.gross_profit).toFixed(2)}
                  </td>
                </tr>

                {/* Operating Overhead Header */}
                <tr className="font-semibold bg-neutral-100">
                  <td colSpan={3} className="py-1.5 px-3 text-[11px] uppercase tracking-wide">
                    Operating Overhead and Fixed Expenditures
                  </td>
                </tr>

                {/* Overhead Line Items */}
                {financialData.expenses_by_category?.map((cat: any) => (
                  <tr key={cat.category}>
                    <td className="py-1.5 px-3 pl-6 text-neutral-700">{cat.category} Overhead Expenses</td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums">{Number(cat.total).toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right"></td>
                  </tr>
                ))}

                {/* Total Overhead Subtotal */}
                <tr className="border-t border-neutral-300 font-semibold text-neutral-800">
                  <td className="py-2 px-3 pl-6">Total Operating Overhead Expenses</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{Number(financialData.expenses).toFixed(2)}</td>
                  <td className="py-2 px-3 text-right"></td>
                </tr>

                {/* Net Operating Profit / Loss with Double Underline */}
                <tr className="border-t-2 border-b-4 border-double border-black font-black text-sm bg-neutral-100">
                  <td className="py-2.5 px-3">
                    {Number(financialData.net_profit) >= 0 ? 'NET OPERATING PROFIT' : 'NET OPERATING LOSS'}
                  </td>
                  <td className="py-2.5 px-3 text-right"></td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black">
                    ৳ {Number(financialData.net_profit).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* PRINT CONTENT: SALES LEDGER */}
        {activeTab === 'sales' && salesData && (
          <div className="space-y-4">
            {/* KPI Summary strip for Print */}
            <div className="grid grid-cols-4 gap-2 border border-neutral-300 p-2.5 bg-neutral-50 text-xs mb-4">
              <div>
                <span className="text-[10px] text-neutral-600 block uppercase">Gross Sales</span>
                <span className="font-bold font-mono text-sm">৳ {Number(salesData.summary.total_sales).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-600 block uppercase">Cash Collected</span>
                <span className="font-bold font-mono text-sm">৳ {Number(salesData.summary.total_paid).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-600 block uppercase">Baki Due Balance</span>
                <span className="font-bold font-mono text-sm">৳ {Number(salesData.summary.total_due).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-600 block uppercase">Invoices Audited</span>
                <span className="font-bold font-mono text-sm">{salesData.summary.order_count}</span>
              </div>
            </div>

            {/* Invoices List Table for Print */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-neutral-100 font-bold text-[11px]">
                  <th className="py-2 px-2 text-left">Invoice No</th>
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Customer</th>
                  <th className="py-2 px-2 text-left">Type</th>
                  <th className="py-2 px-2 text-right">Net Amount</th>
                  <th className="py-2 px-2 text-right">Paid</th>
                  <th className="py-2 px-2 text-right">Due (Baki)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {salesData.orders?.map((order: any) => (
                  <tr key={order.id} className="text-[11px]">
                    <td className="py-1.5 px-2 font-mono font-medium">{order.invoice_no}</td>
                    <td className="py-1.5 px-2 font-mono">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-1.5 px-2">{order.customer?.name || 'Walk-in Customer'}</td>
                    <td className="py-1.5 px-2 uppercase font-medium">{order.sale_type}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-semibold">{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{Number(order.paid_amount).toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{Number(order.due_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold bg-neutral-100 text-[11px]">
                  <td colSpan={4} className="py-2 px-2 text-left uppercase">Grand Total Summary</td>
                  <td className="py-2 px-2 text-right font-mono">৳ {Number(salesData.summary.total_sales).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-mono">৳ {Number(salesData.summary.total_paid).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-mono">৳ {Number(salesData.summary.total_due).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Formal Accounting Sign-off Block */}
        <div className="mt-12 pt-6 border-t border-neutral-300 text-xs">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="w-52 border-b border-black mb-1.5"></div>
              <p className="font-bold text-black uppercase text-[11px]">Prepared By</p>
              <p className="text-neutral-600 text-[10px]">Operations & Cash Register Officer</p>
              <p className="text-neutral-500 text-[10px] mt-0.5">Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <div className="w-52 border-b border-black mb-1.5 ml-auto"></div>
              <p className="font-bold text-black uppercase text-[11px]">Authorized Signatory</p>
              <p className="text-neutral-600 text-[10px]">General Manager & Store Auditor</p>
              <p className="text-neutral-500 text-[10px] mt-0.5">Official Stamp & Signature</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 pt-3">
            StockFlow Pro POS and ERP Systems. Automated Financial Reconciliation. Confidential Internal Audit Record.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

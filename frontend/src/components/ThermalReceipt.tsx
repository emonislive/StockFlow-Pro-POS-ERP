'use client';

import React from 'react';
import { IconPrinter, IconClose } from './Icons';

interface ThermalReceiptProps {
  order: any;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleString();
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Modal Container */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl max-w-sm w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-dialog">
        {/* Modal Controls */}
        <div className="no-print p-4 border-b border-[#e3e1da] dark:border-[#252830] flex items-center justify-between bg-[#f8f7f4] dark:bg-[#111215]">
          <div className="flex items-center gap-2">
            <IconPrinter className="w-4 h-4 text-[#6b21a8] dark:text-[#c084fc]" />
            <h3 className="font-semibold text-xs text-[#191817] dark:text-[#f3f3f5]">Thermal Receipt Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="btn-tactile p-1 rounded-md text-[#73726c] hover:text-[#191817] dark:text-[#a0a2aa] dark:hover:text-[#f3f3f5] transition-colors cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="overflow-y-auto p-4 bg-[#f2f0eb] dark:bg-[#111215] flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full bg-white text-black p-4 text-xs font-mono shadow-sm border border-[#e3e1da]"
            style={{ minHeight: '380px' }}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-neutral-400">
              <div className="text-base font-black tracking-tight">STOCKFLOW PRO</div>
              <div className="text-[10px] text-neutral-600">Smart Retail POS and ERP Solutions</div>
              <div className="text-[10px] text-neutral-600">Hotline: +880 1700-000000</div>
              <div className="text-[10px] text-neutral-600">Dhaka, Bangladesh</div>
            </div>

            {/* Meta */}
            <div className="py-2 border-b border-dashed border-neutral-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-bold">{order.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{order.customer?.name || 'Walk-in Customer'}</span>
              </div>
              {order.customer?.phone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{order.customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sale Type:</span>
                <span className="font-bold uppercase">{order.sale_type}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left my-2 border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-neutral-400">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-neutral-200">
                    <td className="py-1 pr-1 truncate max-w-[110px] font-sans text-[10px]">
                      {item.product?.name || `Product #${item.product_id}`}
                    </td>
                    <td className="py-1 text-center font-mono">{item.quantity}</td>
                    <td className="py-1 text-right font-mono">{Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-1 text-right font-mono font-semibold">{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="pt-1 border-t border-dashed border-neutral-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">৳ {Number(order.subtotal || order.total_amount).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>Discount:</span>
                  <span className="font-mono">- ৳ {Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-b border-neutral-800 py-1">
                <span>Net Total:</span>
                <span className="font-mono">৳ {Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid ({order.payment_method}):</span>
                <span className="font-mono">৳ {Number(order.paid_amount).toFixed(2)}</span>
              </div>
              {Number(order.due_amount) > 0 && (
                <div className="flex justify-between font-bold text-red-600">
                  <span>Due (Baki Khata):</span>
                  <span className="font-mono">৳ {Number(order.due_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(order.change) > 0 && (
                <div className="flex justify-between text-neutral-800">
                  <span>Change Given:</span>
                  <span className="font-mono">৳ {Number(order.change).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-dashed border-neutral-400 mt-3 text-[10px] text-neutral-600">
              <div className="font-semibold text-neutral-900">Thank you for your business</div>
              <div>Goods sold are returnable within 7 days with this invoice</div>
              <div className="mt-2 text-[9px] font-mono tracking-widest text-neutral-500">
                *{order.invoice_no}*
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print p-4 border-t border-[#e3e1da] dark:border-[#252830] bg-[#ffffff] dark:bg-[#17191e] flex gap-2">
          <button
            onClick={handlePrint}
            className="btn-tactile flex-1 flex items-center justify-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer"
          >
            <IconPrinter className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="btn-tactile px-4 py-2 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f8f7f4] dark:hover:bg-[#111215] text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

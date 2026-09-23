import Link from 'next/link';
import { IconDashboard, IconPos } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#111215] flex flex-col justify-center items-center px-4 text-center">
      <div className="w-full max-w-md bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-2xl p-8 shadow-sm">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-[#faf5ff] dark:bg-[#581c87]/30 border border-[#e9d5ff] dark:border-[#7e22ce]/40 text-[#6b21a8] dark:text-[#c084fc] items-center justify-center font-mono font-bold text-2xl mb-4">
          404
        </div>
        <h1 className="text-xl font-bold text-[#191817] dark:text-[#f3f3f5] mb-2">Page or Record Not Found</h1>
        <p className="text-xs text-[#6e6b65] dark:text-[#9698a3] mb-6 leading-relaxed">
          The requested route, resource, or ledger invoice could not be located in the StockFlow catalog.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-semibold btn-tactile shadow-xs transition-colors"
          >
            <IconDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/pos"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ffffff] dark:bg-[#1f2229] hover:bg-[#f4f2ee] dark:hover:bg-[#252830] text-[#191817] dark:text-[#f3f3f5] text-xs font-semibold border border-[#e3e1da] dark:border-[#252830] btn-tactile transition-colors"
          >
            <IconPos className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

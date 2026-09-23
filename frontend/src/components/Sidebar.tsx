'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  IconDashboard,
  IconPos,
  IconInventory,
  IconCustomers,
  IconExpenses,
  IconAudit,
  IconReports,
  IconCode,
  IconLogout,
  IconUser,
} from './Icons';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: IconDashboard },
    { label: 'Register Terminal', href: '/pos', icon: IconPos, badge: 'POS' },
    { label: 'Inventory Stock', href: '/inventory', icon: IconInventory },
    { label: 'Baki Khata Ledger', href: '/customers', icon: IconCustomers },
    { label: 'Store Expenses', href: '/expenses', icon: IconExpenses },
    { label: 'Audit Trail', href: '/audit-logs', icon: IconAudit },
    { label: 'Reports & P&L', href: '/reports', icon: IconReports },
    ...(user?.role === 'admin'
      ? [{ label: 'API Explorer', href: '/admin/endpoints', icon: IconCode, badge: 'REST' }]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print w-60 bg-[#ffffff] dark:bg-[#17191e] border-r border-[#e3e1da] dark:border-[#252830] flex flex-col justify-between h-screen fixed md:sticky top-0 z-50 md:z-30 select-none transition-transform duration-200 ease-in-out shadow-lg md:shadow-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-14 px-4 border-b border-[#e3e1da] dark:border-[#252830] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6b21a8] dark:bg-[#7e22ce] flex items-center justify-center font-bold text-[#fbbf24] text-sm shrink-0 tracking-tight shadow-xs">
                SF
              </div>
              <div className="leading-tight">
                <span className="font-bold text-[#191817] dark:text-[#f3f3f5] text-sm tracking-tight block">
                  StockFlow Pro
                </span>
                <span className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] block font-medium">
                  Retail ERP Terminal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="p-2.5 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors btn-tactile ${
                    isActive
                      ? 'bg-[#6b21a8] text-white dark:bg-[#7e22ce] dark:text-white font-semibold shadow-xs'
                      : 'text-[#6e6b65] dark:text-[#9698a3] hover:bg-[#f2f0eb] dark:hover:bg-[#1f2229] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : 'text-[#6e6b65] dark:text-[#9698a3] group-hover:text-[#191817] dark:group-hover:text-[#f3f3f5]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#fefce8] dark:bg-[#78350f]/30 text-[#b45309] dark:text-[#fbbf24] border border-[#fde68a] dark:border-[#b45309]/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#e3e1da] dark:bg-[#252830] flex items-center justify-center text-[#191817] dark:text-[#f3f3f5] shrink-0 font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <IconUser className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate leading-tight">
                <div className="text-xs font-semibold text-[#191817] dark:text-[#f3f3f5] truncate">
                  {user?.name || 'Cashier'}
                </div>
                <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] capitalize truncate font-mono">
                  {user?.role || 'Staff'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-[#6e6b65] dark:text-[#9698a3] hover:text-[#c2410c] dark:hover:text-[#f87171] hover:bg-[#e3e1da]/50 dark:hover:bg-[#252830] transition-colors btn-tactile shrink-0"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

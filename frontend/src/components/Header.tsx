'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconPos, IconMenu, IconSun, IconMoon } from './Icons';
import { ApiHealthIndicator } from './ApiHealthIndicator';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onToggleMobileNav }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (title) return title;
    switch (pathname) {
      case '/dashboard':
        return 'Business Overview';
      case '/pos':
        return 'Register Terminal';
      case '/inventory':
        return 'Warehouse Inventory';
      case '/customers':
        return 'Baki Khata Ledger';
      case '/expenses':
        return 'Operational Expenses';
      case '/audit-logs':
        return 'System Audit Trail';
      case '/reports':
        return 'Accounting & Statements';
      case '/admin/endpoints':
        return 'API Endpoints & Documentation';
      default:
        return 'StockFlow Pro';
    }
  };

  return (
    <header className="no-print h-14 border-b border-[#e3e1da] dark:border-[#252830] bg-[#ffffff] dark:bg-[#17191e] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-150">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 rounded-lg bg-[#f2f0eb] dark:bg-[#1f2229] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] btn-tactile"
          >
            <IconMenu className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-[#191817] dark:text-[#f3f3f5] tracking-tight truncate">
              {getPageTitle()}
            </h1>
          </div>
          {subtitle && (
            <p className="text-[11px] text-[#6e6b65] dark:text-[#9698a3] truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live API Health Indicator */}
        <ApiHealthIndicator />

        {/* Live Clock / Register Time */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[11px] font-mono tabular-nums text-[#6e6b65] dark:text-[#9698a3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] dark:bg-[#fbbf24]" />
          <span>{time}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-1.5 rounded-lg bg-[#f8f7f4] hover:bg-[#f0eee9] dark:bg-[#111215] dark:hover:bg-[#1f2229] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] btn-tactile"
        >
          {theme === 'dark' ? (
            <IconSun className="w-4 h-4 text-amber-400" />
          ) : (
            <IconMoon className="w-4 h-4 text-[#191817]" />
          )}
        </button>

        {/* Quick Launch POS if not on /pos */}
        {pathname !== '/pos' && (
          <Link
            href="/pos"
            className="flex items-center gap-1.5 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-xs btn-tactile"
          >
            <IconPos className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Register</span>
            <span className="sm:hidden">POS</span>
          </Link>
        )}
      </div>
    </header>
  );
};

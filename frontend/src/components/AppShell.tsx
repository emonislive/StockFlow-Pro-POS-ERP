'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, title, subtitle }) => {
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#111215] flex items-center justify-center text-[#6e6b65] dark:text-[#9698a3] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg border-2 border-[#7e22ce] dark:border-[#a855f7] border-t-transparent animate-spin" />
          <div className="text-xs font-medium tracking-tight text-[#6e6b65] dark:text-[#9698a3]">
            Connecting to register...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#111215] text-[#191817] dark:text-[#f3f3f5] flex relative transition-colors duration-200 print:block print:bg-white print:text-black">
      <div className="no-print">
        <Sidebar isOpenMobile={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:block">
        <div className="no-print">
          <Header
            title={title}
            subtitle={subtitle}
            onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
          />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
};

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#111215] flex items-center justify-center transition-colors">
      <div className="w-6 h-6 border-2 border-[#7e22ce] dark:border-[#a855f7] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

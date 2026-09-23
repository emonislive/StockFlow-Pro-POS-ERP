'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { IconEye, IconEyeOff, IconSun, IconMoon } from '@/components/Icons';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password, passwordConfirmation);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#111215] text-[#191817] dark:text-[#f3f3f5] flex flex-col justify-center items-center px-4 py-12 relative transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="btn-tactile p-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-[#73726c] dark:text-[#a0a2aa] hover:text-[#191817] dark:hover:text-[#f3f3f5] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <IconSun className="w-4 h-4 text-[#fbbf24]" /> : <IconMoon className="w-4 h-4 text-[#191817]" />}
        </button>
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex w-10 h-10 rounded-lg bg-[#6b21a8] dark:bg-[#7e22ce] items-center justify-center font-bold text-[#fbbf24] text-sm mb-2.5 shadow-xs">
            SF
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#191817] dark:text-[#f3f3f5]">StockFlow Pro</h2>
          <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mt-0.5">Store Registration</p>
        </div>

        <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-[#191817] dark:text-[#f3f3f5] mb-0.5">Create an account</h3>
          <p className="text-xs text-[#73726c] dark:text-[#a0a2aa] mb-5">Setup your credentials to access the POS terminal and inventory.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#fee2e2] dark:bg-[#7f1d1d]/20 border border-[#fecaca] dark:border-[#991b1b]/40 text-[#991b1b] dark:text-[#f87171] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Manager Name"
                className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] text-xs focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@store.com"
                className="w-full px-3 py-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] text-xs focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] text-xs focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-tactile absolute right-2.5 top-1/2 -translate-y-1/2 text-[#73726c] hover:text-[#191817] dark:text-[#a0a2aa] dark:hover:text-[#f3f3f5] p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#73726c] dark:text-[#a0a2aa] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] text-xs focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile w-full mt-1 bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-xs py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        </div>

        <div className="text-center mt-5 text-xs text-[#73726c] dark:text-[#a0a2aa]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#6b21a8] dark:text-[#c084fc] font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  IconServer,
  IconClose,
  IconCheck,
  IconAlertTriangle,
  IconActivity,
  IconExternalLink,
} from './Icons';

interface HealthData {
  service: string;
  version: string;
  environment: string;
  server_time: string;
  php_version: string;
  laravel_version: string;
  database: {
    driver: string;
    status: string;
    latency_ms: number;
  };
  memory_usage_mb: number;
  latency_ms: number;
}

export const ApiHealthIndicator: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const checkHealth = useCallback(async () => {
    setRefreshing(true);
    const start = performance.now();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/health', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const end = performance.now();
      const rtt = Math.round(end - start);
      setLatency(rtt);

      if (res.ok) {
        const json = await res.json();
        setHealthData(json.data);
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
      setLatency(null);
    } finally {
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Pill Beacon Button in Header */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title={status === 'online' ? `API Online (${latency ?? 0}ms)` : 'API Offline. Click for diagnostics.'}
        aria-label="Inspect API Backend Health"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono tabular-nums transition-colors btn-tactile cursor-pointer ${
          status === 'online'
            ? 'bg-[#fefce8] dark:bg-[#78350f]/20 border-[#fde68a] dark:border-[#b45309]/30 text-[#b45309] dark:text-[#fbbf24]'
            : status === 'checking'
            ? 'bg-[#f8f7f4] dark:bg-[#111215] border-[#e3e1da] dark:border-[#252830] text-[#73726c] dark:text-[#a0a2aa]'
            : 'bg-[#fee2e2] dark:bg-[#7f1d1d]/20 border-[#fecaca] dark:border-[#991b1b]/40 text-[#991b1b] dark:text-[#f87171]'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {status === 'online' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97706] opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === 'online'
                ? 'bg-[#d97706] dark:bg-[#fbbf24]'
                : status === 'checking'
                ? 'bg-[#a09e99]'
                : 'bg-[#c2410c] dark:bg-[#f87171]'
            }`}
          />
        </span>
        <span className="font-semibold hidden sm:inline">
          {status === 'online' ? `API ${latency !== null ? `${latency}ms` : 'Online'}` : status === 'checking' ? 'API...' : 'API Offline'}
        </span>
        <span className="font-semibold sm:hidden">
          {status === 'online' ? 'API' : 'Err'}
        </span>
      </button>

      {/* Interactive Diagnostics Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-5 shadow-xl relative animate-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e3e1da] dark:border-[#252830]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    status === 'online'
                      ? 'bg-[#fefce8] dark:bg-[#78350f]/30 text-[#b45309] dark:text-[#fbbf24]'
                      : 'bg-[#fee2e2] dark:bg-[#7f1d1d]/30 text-[#991b1b] dark:text-[#f87171]'
                  }`}
                >
                  <IconServer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-[#191817] dark:text-[#f3f3f5]">
                    API Backend Diagnostics
                  </h3>
                  <p className="text-[10px] text-[#73726c] dark:text-[#a0a2aa]">
                    Centralized telemetry and connectivity state
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-tactile p-1 text-[#73726c] hover:text-[#191817] dark:text-[#a0a2aa] dark:hover:text-[#f3f3f5] rounded-md transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Status Summary Banner */}
            <div
              className={`p-3 rounded-lg border mb-3 flex items-center justify-between ${
                status === 'online'
                  ? 'bg-[#faf5ff] dark:bg-[#581c87]/20 border-[#e9d5ff] dark:border-[#7e22ce]/40 text-[#6b21a8] dark:text-[#d8b4fe]'
                  : 'bg-[#fee2e2] dark:bg-[#7f1d1d]/20 border-[#fecaca] dark:border-[#991b1b]/40 text-[#991b1b] dark:text-[#f87171]'
              }`}
            >
              <div className="flex items-center gap-2">
                {status === 'online' ? (
                  <IconCheck className="w-4 h-4 text-[#6b21a8] dark:text-[#c084fc]" />
                ) : (
                  <IconAlertTriangle className="w-4 h-4 text-[#c2410c] dark:text-[#f87171]" />
                )}
                <span className="text-xs font-semibold">
                  {status === 'online' ? 'Backend Service Online & Responsive' : 'Backend Connection Failure'}
                </span>
              </div>
              <span className="text-[11px] font-mono tabular-nums font-bold">
                {latency !== null ? `${latency} ms` : 'N/A'}
              </span>
            </div>

            {/* Diagnostic Fields */}
            <div className="space-y-2 text-xs font-mono mb-4">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
                <span className="font-sans text-[#73726c] dark:text-[#a0a2aa]">Endpoint Target:</span>
                <span className="text-[#191817] dark:text-[#f3f3f5] text-[11px] font-medium">http://127.0.0.1:8000/api</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
                <span className="font-sans text-[#73726c] dark:text-[#a0a2aa]">Database Connectivity:</span>
                <span
                  className={`text-[11px] font-bold capitalize ${
                    healthData?.database.status === 'connected'
                      ? 'text-[#6b21a8] dark:text-[#c084fc]'
                      : 'text-[#c2410c] dark:text-[#f87171]'
                  }`}
                >
                  {healthData?.database.status || (status === 'online' ? 'Connected' : 'Offline')} ({healthData?.database.driver || 'SQLite'})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
                  <span className="font-sans text-[10px] text-[#73726c] dark:text-[#a0a2aa] block">PHP Engine</span>
                  <span className="text-[#191817] dark:text-[#f3f3f5] text-xs font-bold tabular-nums">
                    v{healthData?.php_version || '8.5.10'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
                  <span className="font-sans text-[10px] text-[#73726c] dark:text-[#a0a2aa] block">Framework</span>
                  <span className="text-[#191817] dark:text-[#f3f3f5] text-xs font-bold tabular-nums">
                    Laravel v{healthData?.laravel_version || '13'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-[#f8f7f4] dark:bg-[#111215] border border-[#e3e1da] dark:border-[#252830]">
                <span className="font-sans text-[#73726c] dark:text-[#a0a2aa]">Last Verified:</span>
                <span className="text-[#191817] dark:text-[#f3f3f5] text-[11px] tabular-nums">{lastChecked || 'Just now'}</span>
              </div>
            </div>

            {/* Admin Quick Link */}
            {isAdmin && (
              <div className="mb-4 p-3 rounded-lg bg-[#fefce8] dark:bg-[#78350f]/20 border border-[#fde68a] dark:border-[#b45309]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#b45309] dark:text-[#fbbf24] flex items-center gap-1.5">
                      <IconActivity className="w-3.5 h-3.5" />
                      <span>Admin Access: API Directory</span>
                    </div>
                    <p className="text-[10px] text-[#73726c] dark:text-[#a0a2aa] mt-0.5">
                      Inspect all 23 endpoints, schemas, parameters, and route descriptions.
                    </p>
                  </div>
                  <Link
                    href="/admin/endpoints"
                    onClick={() => setShowModal(false)}
                    className="btn-tactile flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white font-medium text-[11px] shrink-0 transition-colors shadow-xs"
                  >
                    <span>Explorer</span>
                    <IconExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={checkHealth}
                disabled={refreshing}
                className="btn-tactile flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] text-xs font-medium hover:bg-[#f8f7f4] dark:hover:bg-[#111215] transition-colors cursor-pointer"
              >
                <IconActivity className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Testing ping...' : 'Ping Server Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-tactile px-4 py-1.5 rounded-lg bg-[#f8f7f4] hover:bg-[#e3e1da] dark:bg-[#111215] dark:hover:bg-[#1f2229] border border-[#e3e1da] dark:border-[#252830] text-[#191817] dark:text-[#f3f3f5] text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

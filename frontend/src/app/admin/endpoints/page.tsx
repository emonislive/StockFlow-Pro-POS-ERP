'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
  IconCode,
  IconSearch,
  IconRefresh,
  IconCopy,
  IconCheck,
  IconPlay,
  IconLock,
  IconChevronDown,
  IconChevronUp,
  IconTerminal,
  IconServer,
  IconActivity,
  IconAlertTriangle,
  IconExternalLink,
} from '@/components/Icons';

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiEndpoint {
  module: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  name: string;
  action: string;
  auth_required: boolean;
  roles: string[];
  description: string;
  parameters: EndpointParam[] | null;
}

interface EndpointsCatalogResponse {
  api_version: string;
  base_url: string;
  total_endpoints: number;
  generated_at: string;
  endpoints: ApiEndpoint[];
}

interface TestPingResult {
  endpointPath: string;
  status: number | string;
  timeMs: number;
  success: boolean;
  data: any;
  error?: string;
}

export default function AdminEndpointsPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<EndpointsCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedAccess, setSelectedAccess] = useState<string>('ALL');

  // UI state
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [pingResults, setPingResults] = useState<Record<string, TestPingResult>>({});
  const [pingingPath, setPingingPath] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<EndpointsCatalogResponse>('/admin/endpoints');
      if (res.success && res.data) {
        setCatalog(res.data);
      } else {
        setError(res.message || 'Failed to load endpoints catalog.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while retrieving API endpoints catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCatalog();
    }
  }, [user?.role]);

  const toggleExpand = (endpointKey: string) => {
    setExpandedEndpoints((prev) => ({
      ...prev,
      [endpointKey]: !prev[endpointKey],
    }));
  };

  const handleCopy = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => {
      setCopiedPath(null);
    }, 2000);
  };

  // Live test ping for an endpoint
  const handleTestPing = async (ep: ApiEndpoint) => {
    const key = `${ep.method}:${ep.path}`;
    setPingingPath(key);
    const start = performance.now();

    try {
      // Map API path to client endpoint format
      const relativePath = ep.path.startsWith('/api') ? ep.path.slice(4) : ep.path;
      
      // Determine if it has route params like {id}
      if (relativePath.includes('{')) {
        // Parameterized endpoint preview
        const duration = Math.round(performance.now() - start);
        setPingResults((prev) => ({
          ...prev,
          [key]: {
            endpointPath: ep.path,
            status: 'SCHEMA_PREVIEW',
            timeMs: duration,
            success: true,
            data: {
              info: 'This endpoint requires dynamic URI path parameters (such as an ID). Review parameter schema below.',
              path: ep.path,
              method: ep.method,
              parameters: ep.parameters,
            },
          },
        }));
        setExpandedEndpoints((prev) => ({ ...prev, [key]: true }));
        setPingingPath(null);
        return;
      }

      if (ep.method === 'GET') {
        const res = await api.get(relativePath);
        const duration = Math.round(performance.now() - start);
        setPingResults((prev) => ({
          ...prev,
          [key]: {
            endpointPath: ep.path,
            status: res.success ? 200 : 400,
            timeMs: duration,
            success: res.success,
            data: res,
          },
        }));
      } else {
        // Mutating endpoints preview safe payload
        const duration = Math.round(performance.now() - start);
        setPingResults((prev) => ({
          ...prev,
          [key]: {
            endpointPath: ep.path,
            status: 'DRY_RUN_READY',
            timeMs: duration,
            success: true,
            data: {
              info: 'Mutating requests (POST, PUT, DELETE) are safety protected against accidental database corruption in explorer mode.',
              method: ep.method,
              path: ep.path,
              controller: ep.action,
              expectedPayload: ep.parameters?.map((p) => ({
                field: p.name,
                type: p.type,
                required: p.required,
                description: p.description,
              })),
            },
          },
        }));
      }
      setExpandedEndpoints((prev) => ({ ...prev, [key]: true }));
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setPingResults((prev) => ({
        ...prev,
        [key]: {
          endpointPath: ep.path,
          status: 'ERROR',
          timeMs: duration,
          success: false,
          data: null,
          error: err?.message || 'Ping failed',
        },
      }));
      setExpandedEndpoints((prev) => ({ ...prev, [key]: true }));
    } finally {
      setPingingPath(null);
    }
  };

  // Compute modules list
  const modulesList = useMemo(() => {
    if (!catalog?.endpoints) return [];
    const set = new Set<string>();
    catalog.endpoints.forEach((e) => set.add(e.module));
    return Array.from(set);
  }, [catalog]);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    if (!catalog?.endpoints) return [];
    return catalog.endpoints.filter((ep) => {
      // Method filter
      if (selectedMethod !== 'ALL' && ep.method !== selectedMethod) {
        return false;
      }
      // Module filter
      if (selectedModule !== 'ALL' && ep.module !== selectedModule) {
        return false;
      }
      // Access filter
      if (selectedAccess === 'PUBLIC' && ep.auth_required) {
        return false;
      }
      if (selectedAccess === 'ADMIN' && (!ep.auth_required || !ep.roles.includes('admin') || ep.roles.includes('cashier'))) {
        return false;
      }
      if (selectedAccess === 'STAFF' && (!ep.auth_required || !ep.roles.includes('cashier'))) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPath = ep.path.toLowerCase().includes(q);
        const matchesDesc = ep.description.toLowerCase().includes(q);
        const matchesAction = ep.action.toLowerCase().includes(q);
        const matchesModule = ep.module.toLowerCase().includes(q);
        const matchesParams = ep.parameters?.some((p) => p.name.toLowerCase().includes(q));
        if (!matchesPath && !matchesDesc && !matchesAction && !matchesModule && !matchesParams) {
          return false;
        }
      }
      return true;
    });
  }, [catalog, selectedMethod, selectedModule, selectedAccess, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    if (!catalog?.endpoints) return { total: 0, get: 0, post: 0, put: 0, delete: 0, publicCount: 0, adminOnly: 0 };
    let get = 0;
    let post = 0;
    let put = 0;
    let del = 0;
    let publicCount = 0;
    let adminOnly = 0;

    catalog.endpoints.forEach((e) => {
      if (e.method === 'GET') get++;
      if (e.method === 'POST') post++;
      if (e.method === 'PUT') put++;
      if (e.method === 'DELETE') del++;
      if (!e.auth_required) publicCount++;
      if (e.roles.includes('admin') && !e.roles.includes('cashier')) adminOnly++;
    });

    return {
      total: catalog.endpoints.length,
      get,
      post,
      put,
      delete: del,
      publicCount,
      adminOnly,
    };
  }, [catalog]);

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-[#faf5ff] text-[#6b21a8] border-[#e9d5ff] dark:bg-[#581c87]/30 dark:text-[#d8b4fe] dark:border-[#7e22ce]/40';
      case 'POST':
        return 'bg-[#fefce8] text-[#b45309] border-[#fde68a] dark:bg-[#78350f]/30 dark:text-[#fbbf24] dark:border-[#b45309]/40';
      case 'PUT':
        return 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe] dark:bg-[#1e3a8a]/30 dark:text-[#93c5fd] dark:border-[#1d4ed8]/40';
      case 'DELETE':
        return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca] dark:bg-[#7f1d1d]/30 dark:text-[#f87171] dark:border-[#991b1b]/50';
      default:
        return 'bg-[#f2f0eb] text-[#191817] border-[#e3e1da] dark:bg-[#1f2229] dark:text-[#f3f3f5] dark:border-[#2a2d36]';
    }
  };

  // If user is not admin
  if (user && user.role !== 'admin') {
    return (
      <AppShell title="API Explorer" subtitle="Access Restricted">
        <div className="max-w-2xl mx-auto my-12 p-8 rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
            <IconLock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#191817] dark:text-[#f3f3f5] mb-2">
            Administrator Clearance Required
          </h2>
          <p className="text-xs text-[#6e6b65] dark:text-[#9698a3] leading-relaxed max-w-md mx-auto mb-6">
            The API Catalog and REST Endpoint Diagnostic tools provide direct introspection into backend routes, controller schemas, and database actions. This interface is restricted to users with the Administrator role.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6b21a8] text-white hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-xs font-semibold shadow-xs btn-tactile"
          >
            Return to Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="API Endpoints & Architecture"
      subtitle="Complete REST route catalog, request parameters schema, and live diagnostics"
    >
      <div className="space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] shadow-xs">
            <div className="flex items-center justify-between text-[#6e6b65] dark:text-[#9698a3] mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Endpoints</span>
              <IconCode className="w-4 h-4 text-[#6b21a8] dark:text-[#a855f7]" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">
              {loading ? '...' : stats.total}
            </div>
            <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] mt-1 font-mono">
              Version {catalog?.api_version || 'v1.0.0'} REST
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] shadow-xs">
            <div className="flex items-center justify-between text-[#6e6b65] dark:text-[#9698a3] mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Admin Protected</span>
              <IconLock className="w-4 h-4 text-[#b45309] dark:text-[#fbbf24]" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#b45309] dark:text-[#fbbf24]">
              {loading ? '...' : stats.adminOnly}
            </div>
            <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] mt-1 font-mono">
              Role restricted access
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] shadow-xs">
            <div className="flex items-center justify-between text-[#6e6b65] dark:text-[#9698a3] mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Read Operations</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#faf5ff] dark:bg-[#581c87]/30 text-[#6b21a8] dark:text-[#d8b4fe] font-semibold border border-[#e9d5ff] dark:border-[#7e22ce]/40">
                GET
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#6b21a8] dark:text-[#d8b4fe]">
              {loading ? '...' : stats.get}
            </div>
            <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] mt-1 font-mono">
              Query & ledger streams
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] shadow-xs">
            <div className="flex items-center justify-between text-[#6e6b65] dark:text-[#9698a3] mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Write Operations</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#fefce8] dark:bg-[#78350f]/30 text-[#b45309] dark:text-[#fbbf24] font-semibold border border-[#fde68a] dark:border-[#b45309]/40">
                POST / PUT / DEL
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#191817] dark:text-[#f3f3f5]">
              {loading ? '...' : stats.post + stats.put + stats.delete}
            </div>
            <div className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] mt-1 font-mono">
              Transactional mutations
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <IconSearch className="w-4 h-4 text-[#6e6b65] dark:text-[#9698a3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by route /api/..., action, parameter or description..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#191817] dark:text-[#f3f3f5] placeholder-[#9698a3] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6e6b65] hover:text-[#191817] dark:text-[#9698a3] dark:hover:text-[#f3f3f5]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Reload button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={fetchCatalog}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] hover:bg-[#f0eee9] dark:hover:bg-[#1f2229] text-xs font-medium text-[#191817] dark:text-[#f3f3f5] btn-tactile"
              >
                <IconRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6b21a8]' : ''}`} />
                <span>Refresh Catalog</span>
              </button>
            </div>
          </div>

          {/* Secondary Filters: Method Tabs & Selectors */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e3e1da]/60 dark:border-[#252830]/60 text-xs">
            {/* Method Filter Tabs */}
            <div className="flex items-center rounded-lg bg-[#f8f7f4] dark:bg-[#111215] p-1 border border-[#e3e1da] dark:border-[#252830]">
              {(['ALL', 'GET', 'POST', 'PUT', 'DELETE'] as const).map((method) => {
                const isSelected = selectedMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-md transition-colors ${
                      isSelected
                        ? 'bg-[#6b21a8] text-white shadow-xs font-semibold'
                        : 'text-[#6e6b65] dark:text-[#9698a3] hover:text-[#191817] dark:hover:text-[#f3f3f5]'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>

            {/* Module Filter Dropdown */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#191817] dark:text-[#f3f3f5] text-xs focus:outline-none focus:border-[#6b21a8]"
            >
              <option value="ALL">All Modules ({catalog?.endpoints.length || 0})</option>
              {modulesList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Access Level Filter Dropdown */}
            <select
              value={selectedAccess}
              onChange={(e) => setSelectedAccess(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#191817] dark:text-[#f3f3f5] text-xs focus:outline-none focus:border-[#6b21a8]"
            >
              <option value="ALL">All Access Levels</option>
              <option value="PUBLIC">Public Endpoints</option>
              <option value="ADMIN">Admin Only</option>
              <option value="STAFF">Cashier & Staff Allowed</option>
            </select>

            {/* Filter Count Counter */}
            <div className="ml-auto text-[11px] font-mono text-[#6e6b65] dark:text-[#9698a3] tabular-nums">
              Showing {filteredEndpoints.length} of {catalog?.endpoints.length || 0}
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-800 dark:text-red-300 text-xs">
            <IconAlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Unable to fetch API catalog</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Endpoints Catalog Listing */}
        <div className="space-y-3">
          {loading && !catalog ? (
            <div className="p-12 text-center bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl">
              <IconRefresh className="w-6 h-6 animate-spin mx-auto text-[#6b21a8] mb-3" />
              <p className="text-xs text-[#6e6b65] dark:text-[#9698a3]">Inspecting Laravel registered routes...</p>
            </div>
          ) : filteredEndpoints.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl">
              <IconCode className="w-8 h-8 text-[#9698a3] mx-auto mb-2 opacity-60" />
              <div className="text-sm font-semibold text-[#191817] dark:text-[#f3f3f5] mb-1">
                No matching endpoints found
              </div>
              <p className="text-xs text-[#6e6b65] dark:text-[#9698a3] max-w-sm mx-auto mb-4">
                No routes matched the active filters for query &quot;{searchQuery}&quot;. Try resetting your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMethod('ALL');
                  setSelectedModule('ALL');
                  setSelectedAccess('ALL');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#6b21a8] text-white text-xs font-semibold shadow-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredEndpoints.map((ep) => {
              const epKey = `${ep.method}:${ep.path}`;
              const isExpanded = !!expandedEndpoints[epKey];
              const isCopied = copiedPath === ep.path;
              const isPinging = pingingPath === epKey;
              const pingResult = pingResults[epKey];

              return (
                <div
                  key={epKey}
                  className="rounded-xl bg-white dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] shadow-xs overflow-hidden transition-all duration-150 hover:border-[#cfcbd5] dark:hover:border-[#383b45]"
                >
                  {/* Endpoint Header Bar */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#faf9f7]/40 dark:bg-[#14161a]/40">
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      {/* Method Badge */}
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${getMethodBadgeClass(
                          ep.method
                        )}`}
                      >
                        {ep.method}
                      </span>

                      {/* Route Path */}
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#191817] dark:text-[#f3f3f5] tracking-tight">
                        {ep.path}
                      </span>

                      {/* Copy Path Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(ep.path, ep.path)}
                        title="Copy endpoint path"
                        aria-label="Copy endpoint path"
                        className="p-1 rounded text-[#6e6b65] dark:text-[#9698a3] hover:text-[#191817] dark:hover:text-[#f3f3f5] hover:bg-[#e3e1da]/50 dark:hover:bg-[#252830] transition-colors"
                      >
                        {isCopied ? (
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <IconCopy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Module Badge */}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f2f0eb] dark:bg-[#1f2229] text-[#6e6b65] dark:text-[#9698a3] border border-[#e3e1da] dark:border-[#252830]">
                        {ep.module}
                      </span>

                      {/* Access Badge */}
                      {!ep.auth_required ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          Public
                        </span>
                      ) : ep.roles.includes('admin') && !ep.roles.includes('cashier') ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#6b21a8] dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                          <IconLock className="w-2.5 h-2.5" />
                          Admin Only
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          Cashier & Admin
                        </span>
                      )}
                    </div>

                    {/* Actions: Test Ping & Expand Toggle */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTestPing(ep)}
                        disabled={isPinging}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8] text-white text-xs font-semibold shadow-xs transition-colors btn-tactile disabled:opacity-50"
                        title={
                          ep.method === 'GET'
                            ? 'Run live GET request to endpoint'
                            : 'Preview dry-run payload schema'
                        }
                      >
                        <IconPlay className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                        <span>{isPinging ? 'Testing...' : ep.method === 'GET' ? 'Test Ping' : 'Inspect'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(epKey)}
                        aria-label={isExpanded ? 'Collapse endpoint details' : 'Expand endpoint details'}
                        className="p-1.5 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-[#6e6b65] dark:text-[#9698a3] hover:text-[#191817] dark:hover:text-[#f3f3f5] hover:bg-[#f2f0eb] dark:hover:bg-[#1f2229] transition-colors"
                      >
                        {isExpanded ? <IconChevronUp className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Endpoint Description Body */}
                  <div className="px-4 py-3 border-t border-[#e3e1da]/60 dark:border-[#252830]/60">
                    <p className="text-xs text-[#44423e] dark:text-[#c4c7d0] leading-relaxed">
                      {ep.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6e6b65] dark:text-[#9698a3] font-mono">
                      <div>
                        <span className="font-semibold text-[#191817] dark:text-[#f3f3f5]">Handler:</span> {ep.action}
                      </div>
                      {ep.parameters && (
                        <div>
                          <span className="font-semibold text-[#191817] dark:text-[#f3f3f5]">Parameters:</span>{' '}
                          {ep.parameters.length} defined
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Section: Parameters Schema & Test Output */}
                  {isExpanded && (
                    <div className="p-4 bg-[#f8f7f4] dark:bg-[#111215] border-t border-[#e3e1da] dark:border-[#252830] space-y-4">
                      {/* Parameter Schema Table */}
                      <div>
                        <div className="text-[11px] font-bold text-[#191817] dark:text-[#f3f3f5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <IconTerminal className="w-3.5 h-3.5 text-[#6b21a8] dark:text-[#a855f7]" />
                          <span>Request Parameters & Schema</span>
                        </div>

                        {ep.parameters && ep.parameters.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-white dark:bg-[#17191e]">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[#e3e1da] dark:border-[#252830] bg-[#faf9f7] dark:bg-[#14161a] text-[10px] text-[#6e6b65] dark:text-[#9698a3] uppercase font-mono">
                                  <th className="py-2 px-3 font-semibold">Parameter</th>
                                  <th className="py-2 px-3 font-semibold">Type</th>
                                  <th className="py-2 px-3 font-semibold">Presence</th>
                                  <th className="py-2 px-3 font-semibold">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e3e1da]/60 dark:divide-[#252830]/60">
                                {ep.parameters.map((param) => (
                                  <tr key={param.name} className="hover:bg-[#faf9f7] dark:hover:bg-[#1a1d24]">
                                    <td className="py-2 px-3 font-mono font-semibold text-[#6b21a8] dark:text-[#d8b4fe]">
                                      {param.name}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px] text-[#b45309] dark:text-[#fbbf24]">
                                      {param.type}
                                    </td>
                                    <td className="py-2 px-3">
                                      {param.required ? (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                                          REQUIRED
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#f2f0eb] dark:bg-[#1f2229] text-[#6e6b65] dark:text-[#9698a3]">
                                          OPTIONAL
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-[#44423e] dark:text-[#c4c7d0] text-[11px]">
                                      {param.description}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-white dark:bg-[#17191e] text-xs text-[#6e6b65] dark:text-[#9698a3] font-mono">
                            No body or query parameters required for this endpoint.
                          </div>
                        )}
                      </div>

                      {/* Curl Command Snippet */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#191817] dark:text-[#f3f3f5] uppercase tracking-wider mb-2">
                          <span className="flex items-center gap-1.5">
                            <IconCode className="w-3.5 h-3.5 text-[#b45309] dark:text-[#fbbf24]" />
                            <span>cURL Request Example</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const curlStr = `curl -X ${ep.method} "http://localhost:8000${ep.path}" \\\n  -H "Accept: application/json"${
                                ep.auth_required ? ' \\\n  -H "Authorization: Bearer <TOKEN>"' : ''
                              }${ep.method !== 'GET' ? ' \\\n  -H "Content-Type: application/json" \\\n  -d \'{}\'' : ''}`;
                              handleCopy(curlStr, `curl:${epKey}`);
                            }}
                            className="text-[10px] text-[#6b21a8] dark:text-[#a855f7] hover:underline flex items-center gap-1 font-mono font-normal normal-case"
                          >
                            {copiedPath === `curl:${epKey}` ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Copied cURL!</span>
                            ) : (
                              <>
                                <IconCopy className="w-3 h-3" />
                                <span>Copy cURL</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 rounded-lg bg-[#111215] text-[#fbbf24] text-[11px] font-mono overflow-x-auto border border-[#252830]">
                          {`curl -X ${ep.method} "http://localhost:8000${ep.path}" \\
  -H "Accept: application/json"${ep.auth_required ? ' \\\n  -H "Authorization: Bearer <ADMIN_TOKEN>"' : ''}${
                            ep.method !== 'GET' ? ' \\\n  -H "Content-Type: application/json" \\\n  -d \'{...}\'' : ''
                          }`}
                        </pre>
                      </div>

                      {/* Live Diagnostic Ping Result Box */}
                      {pingResult && (
                        <div className="rounded-lg border border-[#e3e1da] dark:border-[#252830] bg-white dark:bg-[#17191e] overflow-hidden">
                          <div className="px-3 py-2 bg-[#f8f7f4] dark:bg-[#14161a] border-b border-[#e3e1da] dark:border-[#252830] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#191817] dark:text-[#f3f3f5] font-mono">
                                Response Status:
                              </span>
                              <span
                                className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                  pingResult.status === 200 || pingResult.status === 'DRY_RUN_READY' || pingResult.status === 'SCHEMA_PREVIEW'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                }`}
                              >
                                {pingResult.status}
                              </span>
                              <span className="font-mono text-[10px] text-[#6e6b65] dark:text-[#9698a3] tabular-nums">
                                {pingResult.timeMs}ms
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(JSON.stringify(pingResult.data, null, 2), `res:${epKey}`)
                              }
                              className="text-[10px] text-[#6e6b65] dark:text-[#9698a3] hover:text-[#191817] dark:hover:text-[#f3f3f5] flex items-center gap-1 font-mono"
                            >
                              {copiedPath === `res:${epKey}` ? (
                                <span className="text-emerald-600 dark:text-emerald-400">Copied Response!</span>
                              ) : (
                                <>
                                  <IconCopy className="w-3 h-3" />
                                  <span>Copy Response JSON</span>
                                </>
                              )}
                            </button>
                          </div>

                          <pre className="p-3 text-[11px] font-mono text-[#191817] dark:text-[#f3f3f5] overflow-x-auto max-h-60 bg-[#ffffff] dark:bg-[#111215]">
                            {JSON.stringify(pingResult.data || { error: pingResult.error }, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';
import { IconSearch } from '@/components/Icons';
import { useDebounce } from '@/hooks/useDebounce';
import { TableRowSkeleton } from '@/components/SkeletonLoader';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedAction, setSelectedAction] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const params: any = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedAction) params.action = selectedAction;

    const res = await api.get<any>('/audit-logs', params);
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [debouncedSearch, selectedAction]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'checkout':
        return 'bg-[#faf5ff] dark:bg-[#581c87]/30 text-[#6b21a8] dark:text-[#d8b4fe] border-[#e9d5ff] dark:border-[#7e22ce]/40';
      case 'due_collected':
        return 'bg-[#fefce8] dark:bg-[#78350f]/30 text-[#b45309] dark:text-[#fbbf24] border-[#fde68a] dark:border-[#b45309]/40';
      case 'stock_adjusted':
        return 'bg-[#ffedd5] dark:bg-[#7c2d12]/30 text-[#9a3412] dark:text-[#fb923c] border-[#fed7aa] dark:border-[#9a3412]/50';
      case 'created':
        return 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#191817] dark:text-[#f3f3f5] border-[#e3e1da] dark:border-[#2a2d36]';
      case 'updated':
        return 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#55534e] dark:text-[#c4c7d0] border-[#e3e1da] dark:border-[#2a2d36]';
      case 'deleted':
        return 'bg-[#fee2e2] dark:bg-[#7f1d1d]/30 text-[#991b1b] dark:text-[#f87171] border-[#fecaca] dark:border-[#991b1b]/50';
      default:
        return 'bg-[#f2f0eb] dark:bg-[#1f2229] text-[#73726c] dark:text-[#a0a2aa] border-[#e3e1da] dark:border-[#2a2d36]';
    }
  };

  return (
    <AppShell title="System Audit Trail" subtitle="Activity streams and state diff history">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <IconSearch className="w-4 h-4 text-[#73726c] dark:text-[#a0a2aa] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail by description or IP..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] placeholder-[#a09e99] dark:placeholder-[#65676e] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] transition-colors"
            />
          </div>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] text-xs text-[#191817] dark:text-[#f3f3f5] focus:outline-none focus:border-[#6b21a8] dark:focus:border-[#a855f7] font-medium transition-colors cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="checkout">POS Checkout</option>
            <option value="due_collected">Due Collected</option>
            <option value="stock_adjusted">Stock Adjusted</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-tactile px-3 py-1.5 rounded-lg bg-[#f8f7f4] hover:bg-[#e3e1da] dark:bg-[#111215] dark:hover:bg-[#1f2229] text-[#191817] dark:text-[#f3f3f5] text-xs font-medium border border-[#e3e1da] dark:border-[#252830] transition-colors cursor-pointer"
        >
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* Audit Trail List */}
      <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e3e1da] dark:border-[#252830] bg-[#f8f7f4] dark:bg-[#111215] text-[#73726c] dark:text-[#a0a2aa] font-semibold text-[11px]">
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4 font-mono">Entity Target</th>
                <th className="py-2.5 px-4 font-mono">IP Address</th>
                <th className="py-2.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e1da] dark:divide-[#252830]">
              {loading ? (
                <TableRowSkeleton columns={6} rows={6} />
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const hasDiff = log.old_values || log.new_values;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => hasDiff && setExpandedLogId(isExpanded ? null : log.id)}
                        className={`hover:bg-[#f8f7f4] dark:hover:bg-[#14161b] transition-colors ${
                          hasDiff ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#191817] dark:text-[#f3f3f5]">
                          <div>{log.description}</div>
                          {hasDiff && (
                            <div className="text-[10px] text-[#6b21a8] dark:text-[#c084fc] mt-0.5 font-medium">
                              {isExpanded ? 'Hide attribute diff' : 'Click to inspect attribute diff'}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#191817] dark:text-[#f3f3f5]">{log.user?.name || 'System Service'}</td>
                        <td className="py-3 px-4 font-mono text-[#73726c] dark:text-[#a0a2aa]">
                          {log.model_type ? `${log.model_type.split('\\').pop()} #${log.model_id}` : 'General'}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-[#73726c] dark:text-[#a0a2aa]">{log.ip_address || '127.0.0.1'}</td>
                        <td className="py-3 px-4 text-right text-[#73726c] dark:text-[#a0a2aa] font-mono tabular-nums">
                          {new Date(log.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>

                      {/* Expandable JSON Diff Row */}
                      {isExpanded && (
                        <tr className="bg-[#f8f7f4] dark:bg-[#111215]">
                          <td colSpan={6} className="p-4 border-b border-[#e3e1da] dark:border-[#252830]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              {log.old_values && (
                                <div className="p-3 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830]">
                                  <div className="text-[11px] font-semibold text-[#c2410c] dark:text-[#f87171] mb-2 uppercase">Previous Values</div>
                                  <pre className="text-[#191817] dark:text-[#f3f3f5] text-[11px] overflow-x-auto">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div className="p-3 rounded-lg bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830]">
                                  <div className="text-[11px] font-semibold text-[#6b21a8] dark:text-[#c084fc] mb-2 uppercase">New Values</div>
                                  <pre className="text-[#191817] dark:text-[#f3f3f5] text-[11px] overflow-x-auto">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}

              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#73726c] dark:text-[#a0a2aa] text-xs">
                    No audit records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

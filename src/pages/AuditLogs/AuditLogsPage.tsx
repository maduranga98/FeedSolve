import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAuditLogs } from '../../lib/firestore';
import type { AuditLog } from '../../types';
import { LoadingSpinner } from '../../components/Shared';
import {
  ClipboardList,
  Download,
  RefreshCw,
  Filter,
  User,
  Layers,
  Clock,
  Search,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const RESOURCE_TYPE_LABELS: Record<AuditLog['resourceType'], string> = {
  submission: 'Submission',
  board: 'Board',
  team: 'Team',
  webhook: 'Webhook',
  billing: 'Billing',
};

const RESOURCE_TYPE_COLORS: Record<AuditLog['resourceType'], string> = {
  submission: 'bg-[#EBF5FB] text-[#1E6A9A]',
  board: 'bg-[#EAF9F2] text-[#1D8A57]',
  team: 'bg-[#FFF8E6] text-[#B06F00]',
  webhook: 'bg-purple-100 text-purple-700',
  billing: 'bg-pink-100 text-pink-700',
};

function formatDate(ts: Timestamp | Date | undefined): string {
  if (!ts) return '—';
  const d = ts instanceof Timestamp ? ts.toDate() : ts;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function exportCSV(logs: AuditLog[]) {
  const header = [
    'Timestamp',
    'User',
    'Email',
    'Action',
    'Resource Type',
    'Resource',
    'Details',
  ];
  const rows = logs.map((log) => [
    formatDate(log.createdAt),
    log.userName,
    log.userEmail,
    log.action,
    RESOURCE_TYPE_LABELS[log.resourceType] ?? log.resourceType,
    log.resourceName ?? log.resourceId ?? '',
    JSON.stringify(log.details ?? {}),
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(logs: AuditLog[]) {
  const json = JSON.stringify(
    logs.map((l) => ({
      ...l,
      createdAt: formatDate(l.createdAt),
    })),
    null,
    2
  );
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AuditLog['resourceType'] | 'all'>('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAuditLogs(user.companyId);
      setLogs(data as AuditLog[]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter((log) => {
    const matchesType = filterType === 'all' || log.resourceType === filterType;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.userEmail.toLowerCase().includes(q) ||
      (log.resourceName ?? '').toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center">
                <ClipboardList size={20} className="text-[#2E86AB]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E3A5F]">Audit Logs</h1>
                <p className="text-sm text-[#6B7B8D] mt-0.5">
                  Full history of actions taken in your workspace.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadLogs}
                className="p-2 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2E86AB] hover:bg-[#1E6A9A] rounded-lg transition-colors"
                >
                  <Download size={15} />
                  Export
                </button>
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E8ECF0] rounded-xl shadow-lg z-10 overflow-hidden">
                    <button
                      onClick={() => {
                        exportCSV(filtered);
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-[#444441] hover:bg-[#F4F7FA] text-left"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        exportJSON(filtered);
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-[#444441] hover:bg-[#F4F7FA] text-left border-t border-[#F0F4F8]"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Filters */}
        <div className="bg-white border border-[#E8ECF0] rounded-xl p-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AABBF]" />
            <input
              type="text"
              placeholder="Search by user, action, or resource…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#E8ECF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-[#FAFAFA]"
            />
          </div>

          {/* Resource type filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#9AABBF]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AuditLog['resourceType'] | 'all')}
              className="text-sm border border-[#E8ECF0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-[#FAFAFA] text-[#444441]"
            >
              <option value="all">All Types</option>
              {(Object.keys(RESOURCE_TYPE_LABELS) as AuditLog['resourceType'][]).map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-[#9AABBF] ml-auto">
            {filtered.length} of {logs.length} entries
          </span>
        </div>

        {/* Log table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E8ECF0] rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-[#F4F7FA] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-[#9AABBF]" />
            </div>
            <h3 className="text-base font-semibold text-[#1E3A5F] mb-1">
              {logs.length === 0 ? 'No audit logs yet' : 'No matching logs'}
            </h3>
            <p className="text-sm text-[#9AABBF]">
              {logs.length === 0
                ? 'Actions taken in your workspace will appear here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E8ECF0] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-[#F8FAFB] border-b border-[#E8ECF0]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9AABBF] uppercase tracking-wide">
                <Clock size={12} />
                Timestamp
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9AABBF] uppercase tracking-wide">
                <User size={12} />
                User
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9AABBF] uppercase tracking-wide">
                Action / Resource
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9AABBF] uppercase tracking-wide">
                <Layers size={12} />
                Type
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#F0F4F8]">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-6 py-4 hover:bg-[#FAFBFC] transition-colors"
                >
                  {/* Timestamp */}
                  <div className="text-xs text-[#9AABBF] flex items-center gap-1">
                    <Clock size={11} className="flex-shrink-0 sm:hidden" />
                    {formatDate(log.createdAt)}
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#EBF5FB] flex items-center justify-center text-xs font-bold text-[#2E86AB] flex-shrink-0">
                      {log.userName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1E3A5F] truncate">
                        {log.userName}
                      </p>
                      <p className="text-xs text-[#9AABBF] truncate">{log.userEmail}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    <p className="text-sm text-[#444441] font-medium">{log.action}</p>
                    {log.resourceName && (
                      <p className="text-xs text-[#9AABBF] truncate mt-0.5">
                        {log.resourceName}
                      </p>
                    )}
                  </div>

                  {/* Resource type badge */}
                  <div className="flex items-start sm:justify-end">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        RESOURCE_TYPE_COLORS[log.resourceType] ?? 'bg-[#F0F4F8] text-[#6B7B8D]'
                      }`}
                    >
                      {RESOURCE_TYPE_LABELS[log.resourceType] ?? log.resourceType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

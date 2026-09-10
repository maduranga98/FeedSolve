import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useHasFeature } from '../../hooks/useHasFeature';
import { getAuditLogs } from '../../lib/firestore';
import { downloadAuditLogsPDF, formatAuditDetails } from '../../lib/export-report';
import { downloadTextFile } from '../../lib/download';
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
  Lock,
  Zap,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const RESOURCE_TYPE_KEYS: Record<AuditLog['resourceType'], string> = {
  submission: 'type_submission',
  board: 'type_board',
  team: 'type_team',
  webhook: 'type_webhook',
  billing: 'type_billing',
  settings: 'type_settings',
  escalation: 'type_escalation',
  template: 'type_template',
};

const RESOURCE_TYPE_COLORS: Record<AuditLog['resourceType'], string> = {
  submission: 'bg-[var(--c-sebf5fb)] text-[var(--c-t1e6a9a)]',
  board: 'bg-[var(--c-seaf9f2)] text-[var(--c-t1d8a57)]',
  team: 'bg-[var(--c-sfff8e6)] text-[var(--c-tb06f00)]',
  webhook: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  billing: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  settings: 'bg-slate-100 text-slate-700',
  escalation: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  template: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
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

function exportCSV(logs: AuditLog[], getResourceLabel: (type: AuditLog['resourceType']) => string) {
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
    getResourceLabel(log.resourceType),
    log.resourceName ?? log.resourceId ?? '',
    formatAuditDetails(log.details),
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadTextFile(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
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
  downloadTextFile(json, `audit-logs-${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8;');
}

export function AuditLogsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getCurrentTier } = useHasFeature();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AuditLog['resourceType'] | 'all'>('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const getResourceLabel = (type: AuditLog['resourceType']) =>
    t(`audit.${RESOURCE_TYPE_KEYS[type]}`) ?? type;

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
    document.title = `${t('audit.title')} | FeedSolve`;
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => loadLogs());
  }, [loadLogs]);

  if (getCurrentTier() !== 'business') {
    return (
      <div className="min-h-screen bg-[var(--c-se1e8ef)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[var(--c-sffffff)] rounded-2xl border border-[var(--c-be8ecf0)] shadow-sm p-10 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 bg-[var(--c-sebf5fb)] rounded-full flex items-center justify-center">
            <Lock size={28} className="text-[var(--c-t2e86ab)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--c-t1e3a5f)] mb-2">{t('audit.title')}</h2>
            <p className="text-[var(--c-t6b7b8d)] text-sm leading-relaxed">
              {t('audit.tier_gate')}
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--c-s2e86ab)] text-white rounded-lg font-medium hover:bg-[var(--c-s1e6a8a)] transition-colors"
          >
            <Zap size={16} />
            {t('audit.upgrade_pro')}
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      {/* Header */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be8ecf0)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center">
                <ClipboardList size={20} className="text-[var(--c-t2e86ab)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">{t('audit.title')}</h1>
                <p className="text-sm text-[var(--c-t6b7b8d)] mt-0.5">
                  {t('audit.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadLogs}
                className="p-2 text-[var(--c-t9aabbf)] hover:text-[var(--c-t2e86ab)] hover:bg-[var(--c-sebf5fb)] rounded-lg transition-colors"
                title={t('refresh')}
              >
                <RefreshCw size={18} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--c-s2e86ab)] hover:bg-[var(--c-s1e6a9a)] rounded-lg transition-colors"
                >
                  <Download size={15} />
                  {t('export')}
                </button>
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[var(--c-sffffff)] border border-[var(--c-be8ecf0)] rounded-xl shadow-lg z-10 overflow-hidden">
                    <button
                      onClick={() => {
                        exportCSV(filtered, getResourceLabel);
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-[var(--c-t444441)] hover:bg-[var(--c-se1e8ef)] text-left"
                    >
                      {t('audit.export_csv')}
                    </button>
                    <button
                      onClick={() => {
                        downloadAuditLogsPDF(filtered, user?.name || 'FeedSolve Workspace');
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-[var(--c-t444441)] hover:bg-[var(--c-se1e8ef)] text-left border-t border-[var(--c-bf0f4f8)]"
                    >
                      {t('audit.export_pdf')}
                    </button>
                    <button
                      onClick={() => {
                        exportJSON(filtered);
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-[var(--c-t444441)] hover:bg-[var(--c-se1e8ef)] text-left border-t border-[var(--c-bf0f4f8)]"
                    >
                      {t('audit.export_json')}
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
        <div className="bg-[var(--c-sffffff)] border border-[var(--c-be8ecf0)] rounded-xl p-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-t9aabbf)]" />
            <input
              type="text"
              placeholder={t('audit.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--c-be8ecf0)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] bg-[var(--c-sfafafa)]"
            />
          </div>

          {/* Resource type filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[var(--c-t9aabbf)]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AuditLog['resourceType'] | 'all')}
              className="text-sm border border-[var(--c-be8ecf0)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] bg-[var(--c-sfafafa)] text-[var(--c-t444441)]"
            >
              <option value="all">{t('all_types')}</option>
              {(Object.keys(RESOURCE_TYPE_KEYS) as AuditLog['resourceType'][]).map((rt) => (
                <option key={rt} value={rt}>
                  {getResourceLabel(rt)}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-[var(--c-t9aabbf)] ml-auto">
            {t('entries_count', { filtered: filtered.length, total: logs.length })}
          </span>
        </div>

        {/* Log table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[var(--c-sffffff)] border border-[var(--c-be8ecf0)] rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-[var(--c-se1e8ef)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-[var(--c-t9aabbf)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--c-t1e3a5f)] mb-1">
              {logs.length === 0 ? t('audit.no_logs') : t('audit.no_matching')}
            </h3>
            <p className="text-sm text-[var(--c-t9aabbf)]">
              {logs.length === 0
                ? t('audit.no_logs_desc')
                : t('audit.no_matching_desc')}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--c-sffffff)] border border-[var(--c-be8ecf0)] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-[var(--c-sf1f5f8)] border-b border-[var(--c-be8ecf0)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--c-t9aabbf)] uppercase tracking-wide">
                <Clock size={12} />
                {t('timestamp')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--c-t9aabbf)] uppercase tracking-wide">
                <User size={12} />
                {t('user')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--c-t9aabbf)] uppercase tracking-wide">
                {t('audit.action_resource')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--c-t9aabbf)] uppercase tracking-wide">
                <Layers size={12} />
                {t('type')}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--c-bf0f4f8)]">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-6 py-4 hover:bg-[var(--c-sfafbfc)] transition-colors"
                >
                  {/* Timestamp */}
                  <div className="text-xs text-[var(--c-t9aabbf)] flex items-center gap-1">
                    <Clock size={11} className="flex-shrink-0 sm:hidden" />
                    {formatDate(log.createdAt)}
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--c-sebf5fb)] flex items-center justify-center text-xs font-bold text-[var(--c-t2e86ab)] flex-shrink-0">
                      {log.userName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--c-t1e3a5f)] truncate">
                        {log.userName}
                      </p>
                      <p className="text-xs text-[var(--c-t9aabbf)] truncate">{log.userEmail}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    <p className="text-sm text-[var(--c-t444441)] font-medium">{log.action}</p>
                    {log.resourceName && (
                      <p className="text-xs text-[var(--c-t9aabbf)] truncate mt-0.5">
                        {log.resourceName}
                      </p>
                    )}
                  </div>

                  {/* Resource type badge */}
                  <div className="flex items-start sm:justify-end">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        RESOURCE_TYPE_COLORS[log.resourceType] ?? 'bg-[var(--c-sf0f4f8)] text-[var(--c-t6b7b8d)]'
                      }`}
                    >
                      {getResourceLabel(log.resourceType)}
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

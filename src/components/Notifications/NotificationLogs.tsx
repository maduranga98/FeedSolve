import { Fragment, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Clock, RefreshCw } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import type { NotificationLog } from '@/types';
import { NOTIFICATION_EVENTS } from '@/lib/notifications';

interface NotificationLogsProps {
  logs: NotificationLog[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

type StatusFilter = 'all' | NotificationLog['status'];

const FILTERS: StatusFilter[] = ['all', 'success', 'queued', 'failed'];

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  success: 'Sent',
  queued: 'Queued',
  failed: 'Failed',
};

const eventLabel = (id: string) =>
  NOTIFICATION_EVENTS.find(event => event.id === id)?.label ?? id;

function statusStyle(status: NotificationLog['status']) {
  if (status === 'success') return { icon: CheckCircle2, className: 'text-[var(--c-t2e7d5b)]' };
  if (status === 'failed') return { icon: AlertCircle, className: 'text-[var(--c-tc0392b)]' };
  return { icon: Clock, className: 'text-[var(--c-tb7791f)]' };
}

function formatDate(value?: Timestamp) {
  if (!value?.toDate) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value.toDate());
}

/** Delivery history for submission notification emails. */
export function NotificationLogs({ logs, loading = false, onRefresh }: NotificationLogsProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredLogs =
    statusFilter === 'all' ? logs : logs.filter(log => log.status === statusFilter);

  return (
    <section className="rounded-2xl border border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--c-t1c1917)]">Delivery history</h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--c-bd6cabf)] px-3 py-1.5 text-sm font-semibold text-[var(--c-t3c3632)] transition-colors hover:bg-[var(--c-sf5f0ec)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(filter => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              statusFilter === filter
                ? 'bg-[var(--c-sc0694a)] text-white'
                : 'bg-[var(--c-sf5f0ec)] text-[var(--c-t3c3632)] hover:bg-[var(--c-sf2ece6)]'
            }`}
          >
            {FILTER_LABELS[filter]} (
            {filter === 'all' ? logs.length : logs.filter(log => log.status === filter).length})
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--c-t78716c)]">No notifications sent yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-[var(--c-be0d6cf)] text-left text-xs uppercase tracking-wide text-[var(--c-t8f8680)]">
                <th className="px-3 py-2 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Event</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const { icon: StatusIcon, className } = statusStyle(log.status);
                const expanded = expandedLog === log.id;
                const hasDetails = Boolean(log.errorMessage || log.details);

                return (
                  <Fragment key={log.id}>
                    <tr className="border-b border-[var(--c-bf2ece6)]">
                      <td className="px-3 py-3 text-[var(--c-t3c3632)]">{formatDate(log.createdAt)}</td>
                      <td className="px-3 py-3 text-[var(--c-t3c3632)]">{eventLabel(log.event)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
                          <StatusIcon size={15} />
                          {FILTER_LABELS[log.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {hasDetails && (
                          <button
                            type="button"
                            aria-label={expanded ? 'Hide details' : 'Show details'}
                            onClick={() => setExpandedLog(expanded ? null : log.id)}
                            className="rounded-lg p-1 text-[var(--c-t8f8680)] transition-colors hover:bg-[var(--c-sf5f0ec)]"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="border-b border-[var(--c-bf2ece6)] bg-[var(--c-sf5f0ec)]">
                        <td colSpan={4} className="px-3 py-3">
                          <div className="space-y-3 text-xs">
                            {log.errorMessage && (
                              <div>
                                <p className="font-semibold text-[var(--c-t8f8680)]">Error</p>
                                <p className="mt-1 break-all rounded-lg bg-[var(--c-sffffff)] p-2 font-mono text-[var(--c-tc0392b)]">
                                  {log.errorMessage}
                                </p>
                              </div>
                            )}
                            {log.details && (
                              <div>
                                <p className="font-semibold text-[var(--c-t8f8680)]">Details</p>
                                <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--c-sffffff)] p-2 text-[var(--c-t3c3632)]">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

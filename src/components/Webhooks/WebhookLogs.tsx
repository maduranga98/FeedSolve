import { Fragment, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Clock, RefreshCw } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import type { WebhookLog } from '@/types';

interface WebhookLogsProps {
  logs: WebhookLog[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

type StatusFilter = 'all' | WebhookLog['status'];

const FILTERS: StatusFilter[] = ['all', 'success', 'queued', 'failed'];

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  success: 'Sent',
  queued: 'Queued',
  failed: 'Failed',
  retrying: 'Retrying',
};

const TYPE_LABELS: Record<WebhookLog['webhookType'], string> = {
  slack: 'Slack',
  email: 'Email',
  custom: 'Custom',
};

function statusStyle(status: WebhookLog['status']) {
  if (status === 'success') return { icon: CheckCircle2, className: 'text-[#2E7D5B]' };
  if (status === 'failed' || status === 'retrying') {
    return { icon: AlertCircle, className: 'text-[#C0392B]' };
  }
  return { icon: Clock, className: 'text-[#B7791F]' };
}

function formatDate(value?: Timestamp) {
  if (!value) return '—';
  const date = value.toDate?.() ?? new Date(value as unknown as string);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function prettyJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/** Delivery history for every notification channel. */
export function WebhookLogs({ logs, loading = false, onRefresh }: WebhookLogsProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredLogs =
    statusFilter === 'all' ? logs : logs.filter(log => log.status === statusFilter);

  return (
    <section className="rounded-2xl border border-[#e0d6cf] bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#1c1917]">Delivery history</h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6cabf] px-3 py-1.5 text-sm font-semibold text-[#3c3632] transition-colors hover:bg-[#f5f0ec] disabled:opacity-50"
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
                ? 'bg-[#c0694a] text-white'
                : 'bg-[#f5f0ec] text-[#3c3632] hover:bg-[#f2ece6]'
            }`}
          >
            {FILTER_LABELS[filter]} (
            {filter === 'all' ? logs.length : logs.filter(log => log.status === filter).length})
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#78716c]">No notifications sent yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[#e0d6cf] text-left text-xs uppercase tracking-wide text-[#8f8680]">
                <th className="px-3 py-2 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Channel</th>
                <th className="px-3 py-2 font-semibold">Event</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const { icon: StatusIcon, className } = statusStyle(log.status);
                const expanded = expandedLog === log.id;

                return (
                  <Fragment key={log.id}>
                    <tr className="border-b border-[#f2ece6]">
                      <td className="px-3 py-3 text-[#3c3632]">{formatDate(log.createdAt)}</td>
                      <td className="px-3 py-3 text-[#3c3632]">
                        {TYPE_LABELS[log.webhookType] ?? log.webhookType}
                      </td>
                      <td className="px-3 py-3 text-[#3c3632]">{log.event}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
                          <StatusIcon size={15} />
                          {log.statusCode ? `${log.status} (${log.statusCode})` : log.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          aria-label={expanded ? 'Hide details' : 'Show details'}
                          onClick={() => setExpandedLog(expanded ? null : log.id)}
                          className="rounded-lg p-1 text-[#8f8680] transition-colors hover:bg-[#f5f0ec]"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="border-b border-[#f2ece6] bg-[#f5f0ec]">
                        <td colSpan={5} className="px-3 py-3">
                          <div className="space-y-3 text-xs">
                            {log.errorMessage && (
                              <div>
                                <p className="font-semibold text-[#8f8680]">Error</p>
                                <p className="mt-1 break-all rounded-lg bg-white p-2 font-mono text-[#C0392B]">
                                  {log.errorMessage}
                                </p>
                              </div>
                            )}
                            {log.requestBody && (
                              <div>
                                <p className="font-semibold text-[#8f8680]">Request</p>
                                <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-2 text-[#3c3632]">
                                  {prettyJson(log.requestBody)}
                                </pre>
                              </div>
                            )}
                            {log.response && (
                              <div>
                                <p className="font-semibold text-[#8f8680]">Response</p>
                                <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-2 text-[#3c3632]">
                                  {log.response}
                                </pre>
                              </div>
                            )}
                            {log.retryCount > 0 && (
                              <p className="font-semibold text-[#8f8680]">
                                Retries: {log.retryCount} of {log.maxRetries}
                              </p>
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

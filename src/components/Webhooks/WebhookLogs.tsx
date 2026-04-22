import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import type { WebhookLog } from '@/types';

interface WebhookLogsProps {
  logs: WebhookLog[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function WebhookLogs({ logs, loading = false, onRefresh }: WebhookLogsProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  const filteredLogs = statusFilter === 'all' ? logs : logs.filter(log => log.status === statusFilter);

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <CheckCircle2 size={16} className="text-green-600" />;
    } else if (status === 'failed' || status === 'retrying') {
      return <AlertCircle size={16} className="text-red-600" />;
    }
    return <Clock size={16} className="text-yellow-600" />;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate?.() || new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getWebhookTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      slack: 'Slack',
      email: 'Email',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Webhook Logs</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'success', 'failed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status === 'success' ? 'Success' : 'Failed'}
            {' '}
            ({logs.filter(l => l.status === (status === 'all' ? l.status : status)).length})
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No webhook logs yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Time</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Type</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Event</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Status</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <div key={log.id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-700">{formatDate(log.createdAt)}</td>
                    <td className="px-3 py-3 text-gray-700">{getWebhookTypeLabel(log.webhookType)}</td>
                    <td className="px-3 py-3 text-gray-700">{log.event}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span
                          className={`text-sm font-medium ${
                            log.status === 'success'
                              ? 'text-green-600'
                              : log.status === 'failed'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                          }`}
                        >
                          {log.statusCode ? `${log.status} (${log.statusCode})` : log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() =>
                          setExpandedLog(expandedLog === log.id ? null : log.id)
                        }
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ChevronDown
                          size={16}
                          className={`transform transition-transform ${
                            expandedLog === log.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>

                  {expandedLog === log.id && (
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <td colSpan={5} className="px-3 py-3">
                        <div className="space-y-2 text-xs">
                          {log.errorMessage && (
                            <div>
                              <label className="font-medium text-gray-600">Error:</label>
                              <p className="text-gray-700 font-mono bg-white p-2 rounded mt-1 break-all">
                                {log.errorMessage}
                              </p>
                            </div>
                          )}

                          {log.requestBody && (
                            <div>
                              <label className="font-medium text-gray-600">Request:</label>
                              <pre className="text-gray-700 bg-white p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.requestBody), null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.response && (
                            <div>
                              <label className="font-medium text-gray-600">Response:</label>
                              <pre className="text-gray-700 bg-white p-2 rounded mt-1 overflow-x-auto">
                                {log.response}
                              </pre>
                            </div>
                          )}

                          {log.retryCount > 0 && (
                            <div>
                              <label className="font-medium text-gray-600">
                                Retries: {log.retryCount} of {log.maxRetries}
                              </label>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

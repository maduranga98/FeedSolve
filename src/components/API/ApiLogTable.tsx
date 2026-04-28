import React, { useState } from 'react';

interface ApiLog {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  createdAt: string;
}

interface ApiLogTableProps {
  logs: ApiLog[];
  isLoading?: boolean;
}

const ApiLogTable: React.FC<ApiLogTableProps> = ({ logs, isLoading = false }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusColor = (code: number) => {
    if (code < 300) return 'text-green-600 bg-green-50';
    if (code < 400) return 'text-blue-600 bg-blue-50';
    if (code < 500) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'text-blue-600',
      POST: 'text-green-600',
      PATCH: 'text-yellow-600',
      DELETE: 'text-red-600',
    };
    return colors[method] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Loading logs...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">No API logs yet</div>
        <p className="text-sm text-gray-400 mt-1">Your API requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Method</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer transition"
                  onClick={() =>
                    setExpandedId(expandedId === log.id ? null : log.id)
                  }
                >
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-mono font-semibold ${getMethodColor(
                        log.method
                      )}`}
                    >
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {log.endpoint}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        log.statusCode
                      )}`}
                    >
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{log.responseTime}ms</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-mono">{log.ipAddress}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">
                            Full Details
                          </h4>
                          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-48 space-y-1">
                            <div>
                              <span className="text-blue-400">method:</span>{' '}
                              <span className="text-green-400">{log.method}</span>
                            </div>
                            <div>
                              <span className="text-blue-400">endpoint:</span>{' '}
                              <span className="text-green-400">{log.endpoint}</span>
                            </div>
                            <div>
                              <span className="text-blue-400">statusCode:</span>{' '}
                              <span className="text-yellow-400">{log.statusCode}</span>
                            </div>
                            <div>
                              <span className="text-blue-400">responseTime:</span>{' '}
                              <span className="text-yellow-400">{log.responseTime}ms</span>
                            </div>
                            <div>
                              <span className="text-blue-400">ipAddress:</span>{' '}
                              <span className="text-green-400">{log.ipAddress}</span>
                            </div>
                            <div>
                              <span className="text-blue-400">timestamp:</span>{' '}
                              <span className="text-green-400">
                                {new Date(log.createdAt).toISOString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApiLogTable;

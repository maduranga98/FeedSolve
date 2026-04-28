import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ApiUsageChartProps {
  requestsThisMonth: number;
  requestsLimit: number;
  remainingRequests: number;
}

const ApiUsageChart: React.FC<ApiUsageChartProps> = ({
  requestsThisMonth,
  requestsLimit,
  remainingRequests,
}) => {
  const usagePercentage = (requestsThisMonth / requestsLimit) * 100;
  const getProgressColor = () => {
    if (usagePercentage < 50) return 'bg-blue-500';
    if (usagePercentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (usagePercentage < 50) return 'Normal';
    if (usagePercentage < 80) return 'Moderate';
    if (usagePercentage < 100) return 'High';
    return 'Exceeded';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Usage</h3>
          <p className="text-sm text-gray-500">Current month requests</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
          <TrendingUp size={16} className="text-blue-600" />
          <span className={`text-sm font-semibold ${
            usagePercentage < 50 ? 'text-blue-600' :
            usagePercentage < 80 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{requestsThisMonth}</div>
          <div className="text-xs text-gray-600 mt-1">Used</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{remainingRequests}</div>
          <div className="text-xs text-gray-600 mt-1">Remaining</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{requestsLimit}</div>
          <div className="text-xs text-gray-600 mt-1">Monthly Limit</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Usage</span>
          <span className="text-sm text-gray-600">{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Reset Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
        <p>Requests reset monthly on the 1st. <span className="font-semibold">Next reset: ~10 days</span></p>
      </div>

      {/* Warning if high usage */}
      {usagePercentage > 80 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900">
            <span className="font-semibold">Usage Alert:</span> You're approaching your monthly limit.
            Contact support to increase your limit.
          </p>
        </div>
      )}

      {usagePercentage > 100 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900">
            <span className="font-semibold">Limit Exceeded:</span> API requests are being rate limited.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiUsageChart;

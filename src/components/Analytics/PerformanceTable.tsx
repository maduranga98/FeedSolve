import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TeamPerformanceMetric } from '../../lib/analytics';

interface PerformanceTableProps {
  data: TeamPerformanceMetric[];
  loading?: boolean;
}

export function PerformanceTable({ data, loading = false }: PerformanceTableProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">{t('performance.title')}</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          {t('performance.loading')}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">{t('performance.title')}</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          {t('performance.no_data')}
        </div>
      </div>
    );
  }

  const chartData = data.map((member) => ({
    name: member.userName || member.userEmail,
    assigned: member.assignedCount,
    resolved: member.resolvedCount,
  }));

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">{t('performance.title')}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="assigned" fill="#3b82f6" name={t('performance.assigned')} />
            <Bar dataKey="resolved" fill="#10b981" name={t('performance.resolved')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-color-border">
              <th className="text-left py-3 px-4 font-semibold text-color-body-text">
                {t('performance.team_member')}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-color-body-text">
                {t('performance.assigned')}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-color-body-text">
                {t('performance.resolved')}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-color-body-text">
                {t('performance.resolution_rate')}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-color-body-text">
                {t('performance.avg_time_days')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-color-body-text">
                {t('performance.avg_priority')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((member) => (
              <tr key={member.userId} className="border-b border-color-border hover:bg-color-bg">
                <td className="py-3 px-4 text-color-body-text">
                  {member.userName || member.userEmail}
                </td>
                <td className="py-3 px-4 text-right text-color-body-text">
                  {member.assignedCount}
                </td>
                <td className="py-3 px-4 text-right text-color-body-text">
                  {member.resolvedCount}
                </td>
                <td className="py-3 px-4 text-right font-medium text-color-primary">
                  {member.resolutionRate.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right text-color-body-text">
                  {member.averageResolutionTime.toFixed(1)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${
                      member.averagePriority === 'critical'
                        ? 'bg-red-600'
                        : member.averagePriority === 'high'
                          ? 'bg-orange-600'
                          : member.averagePriority === 'medium'
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                    }`}
                  >
                    {member.averagePriority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

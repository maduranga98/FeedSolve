import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { SLAMetric } from '../../lib/analytics';

interface SLAChartProps {
  data: SLAMetric[];
}

export function SLAChart({ data }: SLAChartProps) {
  const { t } = useTranslation();

  const priorityLabels: Record<string, string> = {
    critical: t('sla.critical_label'),
    high: t('sla.high_label'),
    medium: t('sla.medium_label'),
    low: t('sla.low_label'),
  };

  const chartData = data.map((m) => ({
    name: priorityLabels[m.priority] || m.priority,
    [t('sla.met')]: m.met,
    [t('sla.breached')]: m.breached,
    compliance: m.complianceRate,
    targetDays: m.targetDays,
    avgDays: m.avgResolutionDays,
  }));

  const overallCompliance =
    data.reduce((sum, m) => sum + (m.totalResolved > 0 ? m.complianceRate : 0), 0) /
    data.filter((m) => m.totalResolved > 0).length || 100;

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-color-primary">{t('sla.title')}</h2>
        <div className="flex items-center gap-2">
          {overallCompliance >= 80 ? (
            <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
          ) : (
            <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400" />
          )}
          <span
            className={`text-sm font-semibold ${
              overallCompliance >= 80 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {isNaN(overallCompliance) ? '—' : t('sla.overall', { value: overallCompliance.toFixed(1) })}
          </span>
        </div>
      </div>
      <p className="text-xs text-color-muted-text mb-6">
        {t('sla.description')}
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} tick={{ fill: '#6b7280' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            formatter={(value: any, name: any) => [value, name]}
          />
          <Legend />
          <Bar dataKey={t('sla.met')} fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey={t('sla.breached')} fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Per-priority compliance table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-color-border">
              <th className="text-left py-2 px-3 font-semibold text-color-body-text">{t('sla.priority')}</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">{t('sla.target')}</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">{t('sla.resolved')}</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">{t('sla.avg_days')}</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">{t('sla.compliance')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.priority} className="border-b border-color-border hover:bg-color-bg">
                <td className="py-2 px-3 capitalize text-color-body-text">{m.priority}</td>
                <td className="py-2 px-3 text-right text-color-muted-text">{m.targetDays}d</td>
                <td className="py-2 px-3 text-right text-color-body-text">{m.totalResolved}</td>
                <td className="py-2 px-3 text-right text-color-body-text">
                  {m.totalResolved > 0 ? `${m.avgResolutionDays}d` : '—'}
                </td>
                <td className="py-2 px-3 text-right">
                  <span
                    className={`font-semibold ${
                      m.totalResolved === 0
                        ? 'text-color-muted-text'
                        : m.complianceRate >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : m.complianceRate >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {m.totalResolved === 0 ? '—' : `${m.complianceRate.toFixed(1)}%`}
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

import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { getStatusColor } from '../../lib/analytics';

interface StatusChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

export function StatusChart({ data, loading = false }: StatusChartProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">{t('status_chart.title')}</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          {t('status_chart.loading')}
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      value: count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">{t('status_chart.title')}</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          {t('status_chart.no_data')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-4">{t('status_chart.title')}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#3b82f6"
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={getStatusColor(entry.name.replace(/ /g, '_'))} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

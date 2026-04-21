import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getPriorityColor } from '../../lib/analytics';

interface PriorityChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export function PriorityChart({ data, loading = false }: PriorityChartProps) {
  if (loading) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Priority</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          Loading chart...
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (priorityOrder[a as keyof typeof priorityOrder] || 999) - (priorityOrder[b as keyof typeof priorityOrder] || 999))
    .map(([priority, count]) => ({
      name: priority,
      count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Priority</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Priority</h2>
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
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={getPriorityColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

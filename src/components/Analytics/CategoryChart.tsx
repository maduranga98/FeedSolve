import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CategoryChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

export function CategoryChart({ data, loading = false }: CategoryChartProps) {
  if (loading) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Category</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          Loading chart...
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => ({
      name: category,
      count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Category</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 150, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

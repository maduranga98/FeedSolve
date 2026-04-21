import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SourceChartProps {
  data: Record<string, number>;
  boardNames: Record<string, string>;
  loading?: boolean;
}

export function SourceChart({ data, boardNames, loading = false }: SourceChartProps) {
  if (loading) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Source</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          Loading chart...
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([boardId, count]) => ({
      name: boardNames[boardId] || boardId,
      count,
      boardId,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Source</h2>
        <div className="flex items-center justify-center h-80 text-color-muted-text">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-4">Submissions by Source (Board/QR)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-color-border">
              <th className="text-left py-3 px-4 font-semibold text-color-body-text">Board/Source</th>
              <th className="text-right py-3 px-4 font-semibold text-color-body-text">Submissions</th>
              <th className="text-right py-3 px-4 font-semibold text-color-body-text">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => {
              const total = chartData.reduce((sum, d) => sum + d.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              return (
                <tr key={item.boardId} className="border-b border-color-border hover:bg-color-bg">
                  <td className="py-3 px-4 text-color-body-text">{item.name}</td>
                  <td className="py-3 px-4 text-right text-color-body-text">{item.count}</td>
                  <td className="py-3 px-4 text-right font-medium text-color-primary">{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

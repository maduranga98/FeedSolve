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
import type { BoardComparisonData } from '../../lib/analytics';

interface BoardComparisonChartProps {
  data: BoardComparisonData[];
}

export function BoardComparisonChart({ data }: BoardComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Cross-Board Comparison</h2>
        <div className="h-40 flex items-center justify-center text-color-muted-text">
          No board data available
        </div>
      </div>
    );
  }

  const chartData = data.map((b) => ({
    name: b.boardName.length > 14 ? b.boardName.slice(0, 14) + '…' : b.boardName,
    Total: b.totalSubmissions,
    Open: b.openCount,
    Resolved: b.resolvedSubmissions,
  }));

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-2">Cross-Board Comparison</h2>
      <p className="text-xs text-color-muted-text mb-6">
        Side-by-side performance across all feedback boards.
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} tick={{ fill: '#6b7280' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Legend />
          <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Detail table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-color-border">
              <th className="text-left py-2 px-3 font-semibold text-color-body-text">Board</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">Total</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">Open</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">Resolved</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">Rate</th>
              <th className="text-right py-2 px-3 font-semibold text-color-body-text">Avg Days</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.boardId} className="border-b border-color-border hover:bg-color-bg">
                <td className="py-2 px-3 text-color-body-text font-medium">{b.boardName}</td>
                <td className="py-2 px-3 text-right text-color-body-text">{b.totalSubmissions}</td>
                <td className="py-2 px-3 text-right text-amber-600 font-medium">{b.openCount}</td>
                <td className="py-2 px-3 text-right text-green-600 font-medium">{b.resolvedSubmissions}</td>
                <td className="py-2 px-3 text-right">
                  <span
                    className={`font-semibold ${
                      b.resolutionRate >= 70
                        ? 'text-green-600'
                        : b.resolutionRate >= 40
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {b.resolutionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-color-body-text">
                  {b.resolvedSubmissions > 0 ? `${b.avgResolutionDays}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

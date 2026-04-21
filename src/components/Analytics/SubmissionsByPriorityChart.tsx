import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SubmissionsByPriorityChartProps {
  data: Record<string, number>;
}

const priorityColors: Record<string, string> = {
  low: '#0B5563',
  medium: '#854F0B',
  high: '#A32D2D',
  critical: '#8B0000',
};

export default function SubmissionsByPriorityChart({
  data,
}: SubmissionsByPriorityChartProps) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-[#F8FAFB] rounded-lg border border-[#D3D1C7]">
        <p className="text-[#6B7B8D]">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => {
            const priority = entry.name.toLowerCase();
            return (
              <Cell key={`cell-${index}`} fill={priorityColors[priority] || '#6B7B8D'} />
            );
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #D3D1C7',
            borderRadius: '4px',
          }}
          labelStyle={{ color: '#1E3A5F' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
          formatter={(value) => <span style={{ color: '#6B7B8D' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

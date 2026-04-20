import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SubmissionsByBoardChartProps {
  data: Record<string, { name: string; count: number }>;
}

export default function SubmissionsByBoardChart({
  data,
}: SubmissionsByBoardChartProps) {
  const chartData = Object.values(data).map((item) => ({
    name: item.name || 'Unknown',
    count: item.count,
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
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D3D1C7" />
        <XAxis dataKey="name" stroke="#6B7B8D" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6B7B8D" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #D3D1C7',
            borderRadius: '4px',
          }}
          labelStyle={{ color: '#1E3A5F' }}
        />
        <Bar dataKey="count" fill="#2E86AB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

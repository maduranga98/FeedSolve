import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
  icon?: React.ReactNode;
}

const colorMap = {
  primary: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'text-blue-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    accent: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    accent: 'text-yellow-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    accent: 'text-red-600',
  },
  accent: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-900',
    accent: 'text-cyan-600',
  },
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  color = 'primary',
  icon,
}: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <p className={`text-sm font-medium ${colors.text} opacity-75`}>{label}</p>
        {icon && <div className={colors.accent}>{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
        {unit && <p className={`text-sm ${colors.text} opacity-60`}>{unit}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : trend.direction === 'down' ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : null}
          <span
            className={`text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-green-600'
                : trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
            }`}
          >
            {trend.direction !== 'neutral' && (trend.percentage > 0 ? '+' : '')}
            {trend.percentage.toFixed(1)}% vs previous period
          </span>
        </div>
      )}
    </div>
  );
}

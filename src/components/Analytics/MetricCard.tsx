import { useTranslation } from 'react-i18next';
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
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-200',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-200',
    accent: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-200',
    accent: 'text-yellow-600 dark:text-yellow-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-200',
    accent: 'text-red-600 dark:text-red-400',
  },
  accent: {
    bg: 'bg-cyan-50 dark:bg-cyan-950',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-900 dark:text-cyan-200',
    accent: 'text-cyan-600 dark:text-cyan-400',
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
  const { t } = useTranslation();
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
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : trend.direction === 'down' ? (
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          ) : null}
          <span
            className={`text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-green-600 dark:text-green-400'
                : trend.direction === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600'
            }`}
          >
            {t('analytics.vs_previous', { value: `${trend.direction !== 'neutral' && trend.percentage > 0 ? '+' : ''}${trend.percentage.toFixed(1)}` })}
          </span>
        </div>
      )}
    </div>
  );
}

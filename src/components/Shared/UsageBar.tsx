interface UsageBarProps {
  current: number;
  limit: number;
  label: string;
  showPercentage?: boolean;
}

export function UsageBar({ current, limit, label, showPercentage = true }: UsageBarProps) {
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  let barColor = 'bg-green-500';
  if (isAtLimit) {
    barColor = 'bg-red-500';
  } else if (isNearLimit) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="text-sm text-gray-600">
          {current} / {limit}
          {showPercentage && ` (${Math.round(percentage)}%)`}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      {isAtLimit && <p className="text-xs text-red-600 mt-1">Limit reached</p>}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-yellow-600 mt-1">Approaching limit</p>
      )}
    </div>
  );
}

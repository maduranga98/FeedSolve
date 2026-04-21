interface UsageBarProps {
  current: number;
  limit: number;
  label: string;
  showPercentage?: boolean;
}

export function UsageBar({ current, limit, label, showPercentage = true }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  const barColor = isAtLimit ? 'bg-[#E74C3C]' : isNearLimit ? 'bg-[#F39C12]' : 'bg-[#2E86AB]';
  const trackColor = isAtLimit ? 'bg-[#FADBD8]' : isNearLimit ? 'bg-[#FEF5E7]' : 'bg-[#EBF5FB]';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-[#1E3A5F]">{label}</span>
        <span className="text-xs text-[#9AABBF]">
          <span className={isAtLimit ? 'text-[#E74C3C] font-semibold' : isNearLimit ? 'text-[#D4A017] font-semibold' : 'text-[#2E86AB] font-medium'}>
            {current}
          </span>
          {' / '}
          {limit === Infinity ? '∞' : limit}
          {showPercentage && limit !== Infinity && (
            <span className="text-[#B0BEC9] ml-1">({Math.round(percentage)}%)</span>
          )}
        </span>
      </div>
      <div className={`h-1.5 ${trackColor} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xs text-[#E74C3C] mt-1 font-medium">Limit reached</p>
      )}
    </div>
  );
}

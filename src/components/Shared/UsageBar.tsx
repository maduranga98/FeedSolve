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

  const barColor = isAtLimit ? 'bg-[#c0392b]' : isNearLimit ? 'bg-[#F39C12]' : 'bg-[#c0694a]';
  const trackColor = isAtLimit ? 'bg-[#FADBD8]' : isNearLimit ? 'bg-[#FEF5E7]' : 'bg-[#f5e6df]';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-[#1c1917]">{label}</span>
        <span className="text-xs text-[#8f8680]">
          <span className={isAtLimit ? 'text-[#c0392b] font-semibold' : isNearLimit ? 'text-[#D4A017] font-semibold' : 'text-[#c0694a] font-medium'}>
            {current}
          </span>
          {' / '}
          {limit === Infinity ? '∞' : limit}
          {showPercentage && limit !== Infinity && (
            <span className="text-[#b3a89f] ml-1">({Math.round(percentage)}%)</span>
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
        <p className="text-xs text-[#c0392b] mt-1 font-medium">Limit reached</p>
      )}
    </div>
  );
}

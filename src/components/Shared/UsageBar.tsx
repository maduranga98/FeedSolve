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

  const barColor = isAtLimit ? 'bg-[var(--c-sc0392b)]' : isNearLimit ? 'bg-[var(--c-sf39c12)]' : 'bg-[var(--c-sc0694a)]';
  const trackColor = isAtLimit ? 'bg-[var(--c-sfadbd8)]' : isNearLimit ? 'bg-[var(--c-sfef5e7)]' : 'bg-[var(--c-sf5e6df)]';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-[var(--c-t1c1917)]">{label}</span>
        <span className="text-xs text-[var(--c-t8f8680)]">
          <span className={isAtLimit ? 'text-[var(--c-tc0392b)] font-semibold' : isNearLimit ? 'text-[var(--c-td4a017)] font-semibold' : 'text-[var(--c-tc0694a)] font-medium'}>
            {current}
          </span>
          {' / '}
          {limit === Infinity ? '∞' : limit}
          {showPercentage && limit !== Infinity && (
            <span className="text-[var(--c-tb3a89f)] ml-1">({Math.round(percentage)}%)</span>
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
        <p className="text-xs text-[var(--c-tc0392b)] mt-1 font-medium">Limit reached</p>
      )}
    </div>
  );
}

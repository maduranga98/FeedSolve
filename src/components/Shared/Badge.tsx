import { getStatusColor, getStatusLabel } from '../../lib/utils';

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const { bg, text } = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  );
}

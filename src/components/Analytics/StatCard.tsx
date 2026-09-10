import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  color?: 'blue' | 'teal' | 'green' | 'yellow' | 'red' | 'gray';
}

const colorStyles: Record<string, { bg: string; text: string; icon: string }> = {
  blue: {
    bg: 'bg-[var(--c-sebf5fb)]',
    text: 'text-[var(--c-t185fa5)]',
    icon: 'text-[var(--c-t185fa5)]',
  },
  teal: {
    bg: 'bg-[var(--c-sd6eef5)]',
    text: 'text-[var(--c-t2e86ab)]',
    icon: 'text-[var(--c-t2e86ab)]',
  },
  green: {
    bg: 'bg-[var(--c-sebf9f1)]',
    text: 'text-[var(--c-t0f6e56)]',
    icon: 'text-[var(--c-t0f6e56)]',
  },
  yellow: {
    bg: 'bg-[var(--c-sfef5e7)]',
    text: 'text-[var(--c-t854f0b)]',
    icon: 'text-[var(--c-t854f0b)]',
  },
  red: {
    bg: 'bg-[var(--c-sfde8e8)]',
    text: 'text-[var(--c-ta32d2d)]',
    icon: 'text-[var(--c-ta32d2d)]',
  },
  gray: {
    bg: 'bg-[var(--c-seff3f6)]',
    text: 'text-[var(--c-t6b7b8d)]',
    icon: 'text-[var(--c-t6b7b8d)]',
  },
};

export default function StatCard({
  label,
  value,
  subtext,
  icon,
  color = 'blue',
}: StatCardProps) {
  const style = colorStyles[color];

  return (
    <div className={`${style.bg} rounded-lg p-6 border border-[var(--c-bd3d1c7)]`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-sm font-medium ${style.text}`}>{label}</span>
        {icon && <div className={`${style.icon}`}>{icon}</div>}
      </div>
      <div>
        <p className={`text-3xl font-bold ${style.text}`}>{value}</p>
        {subtext && <p className={`text-xs ${style.text} opacity-75 mt-1`}>{subtext}</p>}
      </div>
    </div>
  );
}

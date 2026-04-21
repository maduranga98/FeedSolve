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
    bg: 'bg-[#EBF5FB]',
    text: 'text-[#185FA5]',
    icon: 'text-[#185FA5]',
  },
  teal: {
    bg: 'bg-[#D6EEF5]',
    text: 'text-[#2E86AB]',
    icon: 'text-[#2E86AB]',
  },
  green: {
    bg: 'bg-[#EBF9F1]',
    text: 'text-[#0F6E56]',
    icon: 'text-[#0F6E56]',
  },
  yellow: {
    bg: 'bg-[#FEF5E7]',
    text: 'text-[#854F0B]',
    icon: 'text-[#854F0B]',
  },
  red: {
    bg: 'bg-[#FDE8E8]',
    text: 'text-[#A32D2D]',
    icon: 'text-[#A32D2D]',
  },
  gray: {
    bg: 'bg-[#EFF3F6]',
    text: 'text-[#6B7B8D]',
    icon: 'text-[#6B7B8D]',
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
    <div className={`${style.bg} rounded-lg p-6 border border-[#D3D1C7]`}>
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

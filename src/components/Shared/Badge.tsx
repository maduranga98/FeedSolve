import { getStatusColor, getStatusLabel } from '../../lib/utils';

interface BadgeProps {
  status?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  children?: string;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-[#D6EEF5] text-[#1E5A7A] ring-1 ring-[#2E86AB]/20',
  success: 'bg-[#D1F2EB] text-[#0F6E56] ring-1 ring-[#27AE60]/20',
  warning: 'bg-[#FEF5E7] text-[#854F0B] ring-1 ring-[#F39C12]/20',
  error:   'bg-[#FADBD8] text-[#922B21] ring-1 ring-[#E74C3C]/20',
  neutral: 'bg-[#F0F4F8] text-[#4A6274] ring-1 ring-[#D3D1C7]',
};

export function Badge({ status, variant, children, className = '' }: BadgeProps) {
  if (variant) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
        {children}
      </span>
    );
  }

  if (status) {
    const colors = getStatusColor(status);
    const label = getStatusLabel(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ring-1 ring-inset ring-black/5 ${className}`}>
        {label}
      </span>
    );
  }

  return null;
}

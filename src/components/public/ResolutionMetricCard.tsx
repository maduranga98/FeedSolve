type ResolutionMetricCardProps = {
  label: string;
  value: string | number;
  helperText?: string;
  tone?: 'primary' | 'success' | 'amber' | 'danger' | 'neutral';
  isHero?: boolean;
};

const toneClasses = {
  primary: 'text-[#1c1917] bg-[#f5e6df] border-[#BFE2F0]',
  success: 'text-[#27AE60] bg-[#EBF9F1] border-[#BFECCF]',
  amber: 'text-[#B7791F] bg-[#FFF8E6] border-[#F5D48A]',
  danger: 'text-[#C0392B] bg-[#FDECEC] border-[#F2B7B0]',
  neutral: 'text-[#1c1917] bg-white border-[#d6cabf]',
};

export function ResolutionMetricCard({
  label,
  value,
  helperText,
  tone = 'neutral',
  isHero = false,
}: ResolutionMetricCardProps) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${toneClasses[tone]} ${isHero ? 'md:col-span-2' : ''}`}>
      <p className="text-sm font-medium text-[#78716c]">{label}</p>
      <p className={`${isHero ? 'text-6xl' : 'text-3xl'} mt-3 font-extrabold tracking-tight`}>
        {value}
      </p>
      {helperText && <p className="mt-3 text-sm text-[#78716c]">{helperText}</p>}
    </div>
  );
}

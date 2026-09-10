type ResolutionMetricCardProps = {
  label: string;
  value: string | number;
  helperText?: string;
  tone?: 'primary' | 'success' | 'amber' | 'danger' | 'neutral';
  isHero?: boolean;
};

const toneClasses = {
  primary: 'text-[var(--c-t1c1917)] bg-[var(--c-sf5e6df)] border-[var(--c-bbfe2f0)]',
  success: 'text-[var(--c-t27ae60)] bg-[var(--c-sebf9f1)] border-[var(--c-bbfeccf)]',
  amber: 'text-[var(--c-tb7791f)] bg-[var(--c-sfff8e6)] border-[var(--c-bf5d48a)]',
  danger: 'text-[var(--c-tc0392b)] bg-[var(--c-sfdecec)] border-[var(--c-bf2b7b0)]',
  neutral: 'text-[var(--c-t1c1917)] bg-[var(--c-sffffff)] border-[var(--c-bd6cabf)]',
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
      <p className="text-sm font-medium text-[var(--c-t78716c)]">{label}</p>
      <p className={`${isHero ? 'text-6xl' : 'text-3xl'} mt-3 font-extrabold tracking-tight`}>
        {value}
      </p>
      {helperText && <p className="mt-3 text-sm text-[var(--c-t78716c)]">{helperText}</p>}
    </div>
  );
}

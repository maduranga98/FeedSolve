import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import type { BoardCycle } from '../../types';

export type CycleSelection = 'current' | 'all' | string;

interface CycleSwitcherProps {
  cycles: BoardCycle[];
  selectedCycle: CycleSelection;
  onChange: (value: CycleSelection) => void;
}

export function CycleSwitcher({ cycles, selectedCycle, onChange }: CycleSwitcherProps) {
  const { t } = useTranslation();
  if (cycles.length === 0) return null;

  const currentCycles = cycles.filter((cycle) => cycle.isCurrent);
  const pastCycles = cycles.filter((cycle) => !cycle.isCurrent);
  const currentLabel = currentCycles.length === 1 ? `${t('cycle_switcher.current_cycle')} (${currentCycles[0].label})` : t('cycle_switcher.current_cycle');

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selectedCycle}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-xl border border-[#d6cabf] bg-white py-2 pl-3 pr-9 text-sm font-semibold text-[#1c1917] shadow-sm outline-none transition focus:border-[#c0694a] focus:ring-2 focus:ring-[#c0694a]/20"
        aria-label={t('cycle_switcher.aria_label')}
      >
        <option value="current">{currentLabel}</option>
        <option value="all">{t('cycle_switcher.all_time')}</option>
        {pastCycles.map((cycle) => (
          <option key={cycle.id} value={cycle.id}>
            {cycle.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 text-[#78716c]" size={14} />
    </div>
  );
}

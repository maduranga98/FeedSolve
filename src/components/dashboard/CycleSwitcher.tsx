import { ChevronDown } from 'lucide-react';
import type { BoardCycle } from '../../types';

export type CycleSelection = 'current' | 'all' | string;

interface CycleSwitcherProps {
  cycles: BoardCycle[];
  selectedCycle: CycleSelection;
  onChange: (value: CycleSelection) => void;
}

export function CycleSwitcher({ cycles, selectedCycle, onChange }: CycleSwitcherProps) {
  if (cycles.length === 0) return null;

  const currentCycles = cycles.filter((cycle) => cycle.isCurrent);
  const pastCycles = cycles.filter((cycle) => !cycle.isCurrent);
  const currentLabel = currentCycles.length === 1 ? `Current Cycle (${currentCycles[0].label})` : 'Current Cycle';

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selectedCycle}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-xl border border-[#D3D1C7] bg-white py-2 pl-3 pr-9 text-sm font-semibold text-[#1E3A5F] shadow-sm outline-none transition focus:border-[#2E86AB] focus:ring-2 focus:ring-[#2E86AB]/20"
        aria-label="Choose board cycle"
      >
        <option value="current">{currentLabel}</option>
        <option value="all">All Time</option>
        {pastCycles.map((cycle) => (
          <option key={cycle.id} value={cycle.id}>
            {cycle.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 text-[#6B7B8D]" size={14} />
    </div>
  );
}

import { Archive } from 'lucide-react';
import type { BoardCycle } from '../../types';

interface CycleStatsBannerProps {
  cycle: BoardCycle | null;
}

export function CycleStatsBanner({ cycle }: CycleStatsBannerProps) {
  if (!cycle || cycle.isCurrent) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sf1efe8)] px-4 py-3 text-sm text-[var(--c-t5f5e5a)]">
      <Archive size={15} className="text-[var(--c-t78716c)]" />
      <span className="font-bold">{cycle.label}</span>
      <span>— {cycle.stats.totalSubmissions} submissions</span>
      <span>— {Math.round(cycle.stats.resolutionRate)}% resolution rate</span>
      <span>— avg {Math.round(cycle.stats.avgResolutionHours)} hours</span>
    </div>
  );
}

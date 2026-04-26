import { Clock, AlertCircle, CheckCircle, User, Zap } from 'lucide-react';
import type { SearchFilters } from '../../types';

interface QuickFiltersProps {
  onApply: (filters: SearchFilters) => void;
  userId?: string;
}

const quickFilterOptions = [
  {
    id: 'recent',
    label: 'Last 7 days',
    icon: Clock,
    filters: (_userId?: string): SearchFilters => ({
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    }),
  },
  {
    id: 'high-priority',
    label: 'High Priority',
    icon: AlertCircle,
    filters: (): SearchFilters => ({
      priority: ['high', 'critical'],
    }),
  },
  {
    id: 'unresolved',
    label: 'Unresolved',
    icon: AlertCircle,
    filters: (): SearchFilters => ({
      status: ['received', 'in_review', 'in_progress'],
    }),
  },
  {
    id: 'assigned-to-me',
    label: 'Mine',
    icon: User,
    filters: (userId?: string): SearchFilters => ({
      assignedTo: userId,
    }),
  },
  {
    id: 'resolved',
    label: 'Resolved',
    icon: CheckCircle,
    filters: (): SearchFilters => ({
      status: ['resolved', 'closed'],
    }),
  },
];

export function QuickFilters({ onApply, userId }: QuickFiltersProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Zap size={12} className="text-[#2E86AB]" />
        <p className="text-xs font-semibold text-[#6B7B8D] uppercase tracking-wide">Quick Filters</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickFilterOptions
          .filter((option) => option.id !== 'assigned-to-me' || userId)
          .map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onApply(option.filters(userId))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[#E8ECF0] bg-white text-[#6B7B8D] hover:bg-[#EBF5FB] hover:border-[#2E86AB] hover:text-[#2E86AB] transition-all"
              >
                <Icon size={11} />
                {option.label}
              </button>
            );
          })}
      </div>
    </div>
  );
}

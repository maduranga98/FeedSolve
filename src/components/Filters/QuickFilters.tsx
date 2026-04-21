import { Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import type { SearchFilters } from '../../types';

interface QuickFiltersProps {
  onApply: (filters: SearchFilters) => void;
  userId?: string;
}

const quickFilterOptions = [
  {
    id: 'recent',
    label: 'Recent',
    icon: Clock,
    description: 'Last 7 days',
    filters: (userId?: string) => ({
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
    description: 'High & Critical',
    filters: () => ({
      priority: ['high', 'critical'],
    }),
  },
  {
    id: 'unresolved',
    label: 'Unresolved',
    icon: AlertCircle,
    description: 'Not resolved',
    filters: () => ({
      status: ['received', 'in_review', 'in_progress'],
    }),
  },
  {
    id: 'assigned-to-me',
    label: 'Assigned to Me',
    icon: User,
    description: 'Your submissions',
    filters: (userId?: string) => ({
      assignedTo: userId,
    }),
  },
  {
    id: 'resolved',
    label: 'Resolved',
    icon: CheckCircle,
    description: 'Completed',
    filters: () => ({
      status: ['resolved', 'closed'],
    }),
  },
];

export function QuickFilters({ onApply, userId }: QuickFiltersProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#444441] mb-3">Quick Filters</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {quickFilterOptions
          .filter((option) => option.id !== 'assigned-to-me' || userId)
          .map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onApply(option.filters(userId))}
                className="p-3 text-left border border-[#D3D1C7] rounded-lg hover:bg-[#F8FAFB] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <Icon className="text-[#2E86AB] mt-0.5 group-hover:scale-110 transition-transform" size={18} />
                  <div className="flex-1">
                    <p className="font-medium text-[#444441] text-sm group-hover:text-[#2E86AB]">
                      {option.label}
                    </p>
                    <p className="text-xs text-[#6B7B8D]">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

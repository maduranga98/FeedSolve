import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from '../../components/Shared';
import type { Board } from '../../types';

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBoard: string;
  onBoardChange: (boardId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  boards: Board[];
  onReset: () => void;
  submissionCount: number;
}

export function DashboardFilters({
  searchQuery,
  onSearchChange,
  selectedBoard,
  onBoardChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  boards,
  onReset,
  submissionCount,
}: DashboardFiltersProps) {
  const { t } = useTranslation();

  const boardOptions = [
    { value: 'all', label: t('filters.all_boards') },
    ...boards.map((board) => ({ value: board.id, label: board.name })),
  ];

  const statusOptions = [
    { value: '', label: t('filters.all_statuses') },
    { value: 'received', label: t('filters.received') },
    { value: 'in_review', label: t('filters.in_review') },
    { value: 'in_progress', label: t('filters.in_progress') },
    { value: 'resolved', label: t('filters.resolved') },
    { value: 'closed', label: t('filters.closed') },
  ];

  const priorityOptions = [
    { value: '', label: t('filters.all_priorities') },
    { value: 'low', label: t('filters.low') },
    { value: 'medium', label: t('filters.medium') },
    { value: 'high', label: t('filters.high') },
    { value: 'critical', label: t('filters.critical') },
  ];

  const isFiltered =
    searchQuery || selectedBoard !== 'all' || selectedStatus || selectedPriority;

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6 mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-color-primary">{t('filters.title')}</h2>
        {isFiltered && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            {t('filters.reset')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          label={t('filters.search')}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('filters.search_placeholder')}
        />

        <Select
          label={t('filters.board')}
          value={selectedBoard}
          onChange={(e) => onBoardChange(e.target.value)}
          options={boardOptions}
        />

        <Select
          label={t('filters.status')}
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
        />

        <Select
          label={t('filters.priority')}
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          options={priorityOptions}
        />

        <div className="flex items-end">
          <div className="text-sm">
            <p className="font-medium text-color-body-text">{t('filters.results')}</p>
            <p className="text-lg font-bold text-color-accent">{submissionCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

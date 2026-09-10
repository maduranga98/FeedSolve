import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react';
import { BulkActionModal } from './BulkActionModal';
import type { Submission, User } from '../../types';

const STATUS_OPTIONS_KEYS: { value: Submission['status']; labelKey: string }[] = [
  { value: 'received', labelKey: 'bulk.status_received' },
  { value: 'in_review', labelKey: 'bulk.status_in_review' },
  { value: 'in_progress', labelKey: 'bulk.status_in_progress' },
  { value: 'resolved', labelKey: 'bulk.status_resolved' },
  { value: 'closed', labelKey: 'bulk.status_closed' },
];

interface BulkActionBarProps {
  selectedCount: number;
  users: User[];
  onBulkStatusChange: (status: Submission['status']) => Promise<void>;
  onBulkAssign: (userId: string, userName: string) => Promise<void>;
  onBulkClose: () => Promise<void>;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  users,
  onBulkStatusChange,
  onBulkAssign,
  onBulkClose,
  onClear,
}: BulkActionBarProps) {
  const { t } = useTranslation('common');
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Submission['status'] | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) {
        setAssignOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleStatusSelect = (status: Submission['status']) => {
    setPendingStatus(status);
    setStatusOpen(false);
  };

  const handleStatusConfirm = async () => {
    if (!pendingStatus) return;
    setIsLoading(true);
    try {
      await onBulkStatusChange(pendingStatus);
    } finally {
      setIsLoading(false);
      setPendingStatus(null);
    }
  };

  const handleAssignSelect = async (userId: string, userName: string) => {
    setAssignOpen(false);
    setIsLoading(true);
    try {
      await onBulkAssign(userId, userName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseConfirm = async () => {
    setIsLoading(true);
    try {
      await onBulkClose();
    } finally {
      setIsLoading(false);
      setShowCloseConfirm(false);
    }
  };

  const statusOptions = STATUS_OPTIONS_KEYS.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey),
  }));

  const pendingStatusLabel = statusOptions.find((s) => s.value === pendingStatus)?.label ?? '';

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full px-4 flex justify-center">
        <div className="pointer-events-auto bg-[var(--c-s1c1917)] rounded-xl shadow-xl px-4 sm:px-6 py-3 flex items-center gap-3 max-w-full overflow-x-auto">
          {/* Count */}
          <span className="text-white text-sm font-semibold whitespace-nowrap flex-shrink-0">
            {t('bulk.selected', { count: selectedCount })}
          </span>

          <div className="w-px h-5 bg-white/30 flex-shrink-0" />

          {/* Change Status dropdown */}
          <div className="relative flex-shrink-0" ref={statusRef}>
            <button
              onClick={() => {
                setStatusOpen((o) => !o);
                setAssignOpen(false);
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-white text-sm font-medium hover:text-white/80 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {t('bulk.change_status')}
              <ChevronDown size={14} />
            </button>
            {statusOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-[var(--c-sffffff)] rounded-xl shadow-xl border border-[var(--c-be9e0d9)] py-1 min-w-[160px] z-50">
                {statusOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleStatusSelect(value)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--c-t1c1917)] hover:bg-[var(--c-sece5de)] transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assign To dropdown */}
          <div className="relative flex-shrink-0" ref={assignRef}>
            <button
              onClick={() => {
                setAssignOpen((o) => !o);
                setStatusOpen(false);
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-white text-sm font-medium hover:text-white/80 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {t('bulk.assign_to')}
              <ChevronDown size={14} />
            </button>
            {assignOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-[var(--c-sffffff)] rounded-xl shadow-xl border border-[var(--c-be9e0d9)] py-1 min-w-[180px] z-50">
                {users.length === 0 ? (
                  <p className="px-4 py-2.5 text-sm text-[var(--c-t8f8680)]">{t('bulk.no_team_members')}</p>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAssignSelect(u.id, u.name)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--c-t1c1917)] hover:bg-[var(--c-sece5de)] transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--c-sf5e6df)] flex items-center justify-center text-xs font-bold text-[var(--c-tc0694a)] flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{u.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Close All */}
          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={isLoading}
            className="text-white text-sm font-medium hover:text-white/80 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            {t('bulk.close_all')}
          </button>

          <div className="w-px h-5 bg-white/30 flex-shrink-0" />

          {/* Clear */}
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex items-center gap-1 text-white/70 text-sm hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            <X size={14} />
            {t('clear')}
          </button>
        </div>
      </div>

      {/* Status change confirmation */}
      {pendingStatus && (
        <BulkActionModal
          isOpen
          title={t('bulk.status_confirm_title', { status: pendingStatusLabel })}
          message={t('bulk.status_confirm_msg', { count: selectedCount, status: pendingStatusLabel })}
          selectedCount={selectedCount}
          actionLabel={t('bulk.status_confirm_action', { status: pendingStatusLabel })}
          isLoading={isLoading}
          onConfirm={handleStatusConfirm}
          onCancel={() => setPendingStatus(null)}
        />
      )}

      {/* Close All confirmation */}
      <BulkActionModal
        isOpen={showCloseConfirm}
        title={t('bulk.close_confirm_title', { count: selectedCount })}
        message={t('bulk.close_confirm_msg')}
        selectedCount={selectedCount}
        actionLabel={t('bulk.close_all')}
        isLoading={isLoading}
        onConfirm={handleCloseConfirm}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  );
}

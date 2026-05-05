import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { BulkActionModal } from './BulkActionModal';
import type { Submission, User } from '../../types';

const STATUS_OPTIONS: { value: Submission['status']; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
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

  const pendingStatusLabel = STATUS_OPTIONS.find((s) => s.value === pendingStatus)?.label ?? '';

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="pointer-events-auto bg-[#1E3A5F] rounded-xl shadow-xl px-6 py-3 flex items-center gap-3 overflow-x-auto max-w-[calc(100vw-2rem)]">
          {/* Count */}
          <span className="text-white text-sm font-semibold whitespace-nowrap flex-shrink-0">
            {selectedCount} selected
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
              Change Status
              <ChevronDown size={14} />
            </button>
            {statusOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-[#E8ECF0] py-1 min-w-[160px] z-50">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleStatusSelect(value)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1E3A5F] hover:bg-[#F4F7FA] transition-colors"
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
              Assign To
              <ChevronDown size={14} />
            </button>
            {assignOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-[#E8ECF0] py-1 min-w-[180px] z-50">
                {users.length === 0 ? (
                  <p className="px-4 py-2.5 text-sm text-[#9AABBF]">No team members</p>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAssignSelect(u.id, u.name)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#1E3A5F] hover:bg-[#F4F7FA] transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#EBF5FB] flex items-center justify-center text-xs font-bold text-[#2E86AB] flex-shrink-0">
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
            Close All
          </button>

          <div className="w-px h-5 bg-white/30 flex-shrink-0" />

          {/* Clear */}
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex items-center gap-1 text-white/70 text-sm hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Status change confirmation */}
      {pendingStatus && (
        <BulkActionModal
          isOpen
          title={`Change status to ${pendingStatusLabel}?`}
          message={`Change ${selectedCount} submission${selectedCount !== 1 ? 's' : ''} to "${pendingStatusLabel}"?`}
          selectedCount={selectedCount}
          actionLabel={`Change to ${pendingStatusLabel}`}
          isLoading={isLoading}
          onConfirm={handleStatusConfirm}
          onCancel={() => setPendingStatus(null)}
        />
      )}

      {/* Close All confirmation */}
      <BulkActionModal
        isOpen={showCloseConfirm}
        title={`Close ${selectedCount} submission${selectedCount !== 1 ? 's' : ''}?`}
        message="This marks them as resolved and closed."
        selectedCount={selectedCount}
        actionLabel="Close All"
        isLoading={isLoading}
        onConfirm={handleCloseConfirm}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  );
}

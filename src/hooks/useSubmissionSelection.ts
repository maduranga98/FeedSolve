import { useState, useCallback } from 'react';
import { doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { batchedFirestoreUpdate } from '../utils/firestoreBatch';
import { useAuth } from './useAuth';
import { addAuditLog } from '../lib/firestore';
import { toast } from 'sonner';
import type { Submission } from '../types';

export function useSubmissionSelection() {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkUpdateStatus = useCallback(
    async (status: Submission['status']) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      const now = Timestamp.now();
      const isTerminal = status === 'resolved' || status === 'closed';
      const updates = ids.map((id) => ({
        ref: doc(db, 'submissions', id),
        data: {
          status,
          updatedAt: now,
          ...(isTerminal ? { resolvedAt: now } : {}),
        },
      }));
      await batchedFirestoreUpdate(updates);
      const n = ids.length;
      if (user) {
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: `Bulk changed status to ${status}`,
          resourceType: 'submission',
          details: { submissionIds: ids, count: n, status },
        });
      }
      toast.success(`${n} submission${n !== 1 ? 's' : ''} updated`);
      setSelectedIds(new Set());
    },
    [selectedIds, user]
  );

  const bulkAssign = useCallback(
    async (userId: string, userName: string) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      const updates = ids.map((id) => ({
        ref: doc(db, 'submissions', id),
        data: { assignedTo: userId, updatedAt: Timestamp.now() },
      }));
      await batchedFirestoreUpdate(updates);
      const n = ids.length;
      if (user) {
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: `Bulk assigned submissions to ${userName}`,
          resourceType: 'submission',
          details: { submissionIds: ids, count: n, assignedToId: userId, assignedToName: userName },
        });
      }
      toast.success(`${n} submission${n !== 1 ? 's' : ''} assigned to ${userName}`);
      setSelectedIds(new Set());
    },
    [selectedIds, user]
  );

  const bulkClose = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const now = Timestamp.now();
    const updates = ids.map((id) => ({
      ref: doc(db, 'submissions', id),
      data: { status: 'closed' as const, resolvedAt: now, updatedAt: now },
    }));
    await batchedFirestoreUpdate(updates);
    const n = ids.length;
    if (user) {
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'Bulk closed submissions',
        resourceType: 'submission',
        details: { submissionIds: ids, count: n, status: 'closed' },
      });
    }
    toast.success(`${n} submission${n !== 1 ? 's' : ''} closed`);
    setSelectedIds(new Set());
  }, [selectedIds, user]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelectionMode: selectedIds.size > 0,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkUpdateStatus,
    bulkAssign,
    bulkClose,
  };
}

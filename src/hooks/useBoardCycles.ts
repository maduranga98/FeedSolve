import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateBoard } from '../lib/firestore';
import type { Board, BoardCycle, RecurringFrequency } from '../types';

export interface RecurringCycleInput {
  enabled: boolean;
  frequency: RecurringFrequency | null;
  customDays: number | null;
  startDate: Date | null;
}

const emptyStats = {
  totalSubmissions: 0,
  resolvedSubmissions: 0,
  resolutionRate: 0,
  avgResolutionHours: 0,
};

export function calculateNextCycleDate(
  startDate: Date,
  frequency: RecurringFrequency,
  customDays: number | null
) {
  const next = new Date(startDate);
  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'quarterly') {
    next.setMonth(next.getMonth() + 3);
  } else {
    next.setDate(next.getDate() + Math.max(1, customDays ?? 30));
  }
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getCycleLabel(date: Date, frequency: RecurringFrequency | null) {
  if (frequency === 'quarterly') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function cycleFromSnapshot(snapshot: { id: string; data: () => unknown }) {
  return { ...(snapshot.data() as BoardCycle), id: snapshot.id } as BoardCycle;
}

async function rolloverDueCycles(companyId: string) {
  const boardsSnap = await getDocs(
    query(
      collection(db, 'boards'),
      where('companyId', '==', companyId),
      where('recurringEnabled', '==', true)
    )
  );

  const now = new Date();
  for (const boardDoc of boardsSnap.docs) {
    const board = { ...(boardDoc.data() as Board), id: boardDoc.id };
    const next = board.nextCycleDate?.toDate?.();
    if (!next || next > now) continue;
    if (!board.recurringFrequency) continue;

    const cyclesSnap = await getDocs(
      query(
        collection(db, 'boardCycles'),
        where('companyId', '==', companyId),
        where('boardId', '==', board.id),
        orderBy('cycleNumber', 'desc')
      )
    );
    const lastCycle = cyclesSnap.docs[0]
      ? ({ ...(cyclesSnap.docs[0].data() as BoardCycle), id: cyclesSnap.docs[0].id } as BoardCycle)
      : null;

    // Close the existing current cycle.
    if (board.currentCycleId) {
      const currentRef = doc(db, 'boardCycles', board.currentCycleId);
      const currentSnap = await getDoc(currentRef);
      if (currentSnap.exists()) {
        await updateDoc(currentRef, {
          isCurrent: false,
          endDate: Timestamp.fromDate(next),
        });
      }
    }

    const newCycleRef = doc(collection(db, 'boardCycles'));
    const nextStart = next;
    const newCycle: BoardCycle = {
      id: newCycleRef.id,
      boardId: board.id,
      companyId,
      cycleNumber: (lastCycle?.cycleNumber ?? 0) + 1,
      label: getCycleLabel(nextStart, board.recurringFrequency),
      startDate: Timestamp.fromDate(nextStart),
      endDate: null,
      isCurrent: true,
      stats: emptyStats,
    };
    await setDoc(newCycleRef, newCycle);

    const followingNextDate = calculateNextCycleDate(
      nextStart,
      board.recurringFrequency,
      board.recurringCustomDays ?? null
    );

    await updateBoard(board.id, {
      currentCycleId: newCycleRef.id,
      nextCycleDate: Timestamp.fromDate(followingNextDate),
    });
  }
}

async function assignExistingSubmissionsToCycle(companyId: string, boardId: string, cycleId: string) {
  const submissionsSnapshot = await getDocs(
    query(
      collection(db, 'submissions'),
      where('companyId', '==', companyId),
      where('boardId', '==', boardId)
    )
  );
  const unassigned = submissionsSnapshot.docs.filter((submissionDoc) => !submissionDoc.data().cycleId);

  for (let index = 0; index < unassigned.length; index += 450) {
    const batch = writeBatch(db);
    unassigned.slice(index, index + 450).forEach((submissionDoc) => {
      batch.update(submissionDoc.ref, { cycleId });
    });
    await batch.commit();
  }
}

export function useBoardCycles(companyId?: string, boardId?: string | null) {
  const [cycles, setCycles] = useState<BoardCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCycles = useCallback(async () => {
    if (!companyId) {
      setCycles([]);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      try {
        await rolloverDueCycles(companyId);
      } catch (rolloverErr) {
        console.error('Failed to roll over due cycles:', rolloverErr);
      }
      const constraints = boardId
        ? [where('companyId', '==', companyId), where('boardId', '==', boardId), orderBy('cycleNumber', 'desc')]
        : [where('companyId', '==', companyId), orderBy('startDate', 'desc')];
      const snapshot = await getDocs(query(collection(db, 'boardCycles'), ...constraints));
      const loaded = snapshot.docs.map(cycleFromSnapshot);
      setCycles(loaded);
      return loaded;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load board cycles.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [boardId, companyId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadCycles());
  }, [loadCycles]);

  const currentCyclesByBoard = useMemo(() => {
    const map = new Map<string, BoardCycle>();
    cycles.forEach((cycle) => {
      if (cycle.isCurrent) map.set(cycle.boardId, cycle);
    });
    return map;
  }, [cycles]);

  const saveRecurringSettings = useCallback(
    async (board: Board, input: RecurringCycleInput) => {
      if (!companyId) throw new Error('Company is required.');
      setSaving(true);
      setError(null);
      try {
        if (!input.enabled) {
          await updateBoard(board.id, {
            recurringEnabled: false,
            recurringFrequency: null,
            recurringCustomDays: null,
            recurringStartDate: null,
            nextCycleDate: null,
          });
          await loadCycles();
          return;
        }

        if (!input.frequency || !input.startDate) {
          throw new Error('Choose a frequency and start date.');
        }

        const existingCurrent = cycles.find((cycle) => cycle.boardId === board.id && cycle.isCurrent);
        const start = new Date(input.startDate);
        start.setHours(0, 0, 0, 0);
        const nextDate = calculateNextCycleDate(start, input.frequency, input.customDays);
        let currentCycleId = board.currentCycleId ?? existingCurrent?.id ?? null;

        if (!currentCycleId) {
          const cycleRef = doc(collection(db, 'boardCycles'));
          currentCycleId = cycleRef.id;
          const cycle: BoardCycle = {
            id: cycleRef.id,
            boardId: board.id,
            companyId,
            cycleNumber: 1,
            label: getCycleLabel(start, input.frequency),
            startDate: Timestamp.fromDate(start),
            endDate: null,
            isCurrent: true,
            stats: emptyStats,
          };
          await setDoc(cycleRef, cycle);
        }

        await assignExistingSubmissionsToCycle(companyId, board.id, currentCycleId);

        await updateBoard(board.id, {
          recurringEnabled: true,
          recurringFrequency: input.frequency,
          recurringCustomDays: input.frequency === 'custom' ? input.customDays : null,
          recurringStartDate: Timestamp.fromDate(start),
          currentCycleId,
          nextCycleDate: Timestamp.fromDate(nextDate),
        });
        await loadCycles();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save recurring cycle settings.';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [companyId, cycles, loadCycles]
  );

  const refreshCycleStats = useCallback(
    async (cycle: BoardCycle, stats: BoardCycle['stats']) => {
      await updateDoc(doc(db, 'boardCycles', cycle.id), { stats });
      await loadCycles();
    },
    [loadCycles]
  );

  return {
    cycles,
    currentCyclesByBoard,
    loading,
    saving,
    error,
    loadCycles,
    saveRecurringSettings,
    refreshCycleStats,
  };
}

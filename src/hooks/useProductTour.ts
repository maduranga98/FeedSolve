import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { markTourCompleted } from '../lib/firestore';

const NEW_USER_WINDOW_MS = 24 * 60 * 60 * 1000;
const START_EVENT = 'feedsolve:start-tour';

const storageKey = (uid: string) => `feedsolve_tour_done_${uid}`;

function readDone(uid: string): boolean {
  try {
    return localStorage.getItem(storageKey(uid)) === '1';
  } catch {
    return false;
  }
}

function writeDone(uid: string) {
  try {
    localStorage.setItem(storageKey(uid), '1');
  } catch {
    // Storage unavailable — the Firestore flag is the source of truth.
  }
}

/** Opens the tour on demand (e.g. from the Help page), regardless of account age. */
export function startProductTour() {
  window.dispatchEvent(new Event(START_EVENT));
}

/**
 * Auto-starts only for accounts created within the last 24h that have not
 * finished or skipped the tour. Existing production users never see it unless
 * they replay it manually.
 */
export function useProductTour() {
  const { user } = useAuth();
  const [manual, setManual] = useState(false);
  const [finished, setFinished] = useState(false);
  const [now] = useState(() => Date.now());

  const uid = user?.id;
  const createdMs = user?.createdAt?.toMillis?.();
  const eligible =
    !!uid &&
    createdMs !== undefined &&
    !user?.tourCompletedAt &&
    now - createdMs < NEW_USER_WINDOW_MS &&
    !readDone(uid);

  useEffect(() => {
    const onStart = () => {
      setFinished(false);
      setManual(true);
    };
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, []);

  const finish = useCallback(() => {
    setFinished(true);
    setManual(false);
    if (!uid) return;
    writeDone(uid);
    markTourCompleted(uid).catch(() => {});
  }, [uid]);

  return { open: manual || (eligible && !finished), finish };
}

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SavedFilter, SearchFilters } from '../types';

export function useSavedFilters(companyId: string) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSavedFilters = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);
    try {
      const filtersRef = collection(db, 'companies', companyId, 'filters');
      const q = query(filtersRef);
      const snapshot = await getDocs(q);

      const filters: SavedFilter[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as SavedFilter));

      setSavedFilters(filters.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }));
    } catch (err) {
      setError('Failed to load saved filters');
      console.error('Load saved filters error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  const saveFilter = useCallback(
    async (name: string, filters: SearchFilters, userId: string, description?: string) => {
      if (!companyId) return;

      try {
        const filtersRef = collection(db, 'companies', companyId, 'filters');
        const docRef = await addDoc(filtersRef, {
          name,
          description,
          filters,
          createdAt: Timestamp.now(),
          createdBy: userId,
          updatedAt: Timestamp.now(),
          isPinned: false,
        });

        const newFilter: SavedFilter = {
          id: docRef.id,
          companyId,
          name,
          description,
          filters,
          createdAt: Timestamp.now(),
          createdBy: userId,
          updatedAt: Timestamp.now(),
          isPinned: false,
        };

        setSavedFilters((prev) => [...prev, newFilter]);
        return newFilter;
      } catch (err) {
        setError('Failed to save filter');
        console.error('Save filter error:', err);
        throw err;
      }
    },
    [companyId]
  );

  const updateFilter = useCallback(
    async (filterId: string, name: string, filters: SearchFilters, description?: string) => {
      if (!companyId) return;

      try {
        const filterRef = doc(db, 'companies', companyId, 'filters', filterId);
        await updateDoc(filterRef, {
          name,
          description,
          filters,
          updatedAt: Timestamp.now(),
        });

        setSavedFilters((prev) =>
          prev.map((f) =>
            f.id === filterId
              ? { ...f, name, description, filters, updatedAt: Timestamp.now() }
              : f
          )
        );
      } catch (err) {
        setError('Failed to update filter');
        console.error('Update filter error:', err);
        throw err;
      }
    },
    [companyId]
  );

  const deleteFilter = useCallback(
    async (filterId: string) => {
      if (!companyId) return;

      try {
        const filterRef = doc(db, 'companies', companyId, 'filters', filterId);
        await deleteDoc(filterRef);

        setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
      } catch (err) {
        setError('Failed to delete filter');
        console.error('Delete filter error:', err);
        throw err;
      }
    },
    [companyId]
  );

  const togglePin = useCallback(
    async (filterId: string) => {
      if (!companyId) return;

      try {
        const currentFilter = savedFilters.find((f) => f.id === filterId);
        if (!currentFilter) return;

        const filterRef = doc(db, 'companies', companyId, 'filters', filterId);
        const newPinnedState = !currentFilter.isPinned;

        await updateDoc(filterRef, {
          isPinned: newPinnedState,
        });

        setSavedFilters((prev) =>
          prev
            .map((f) => (f.id === filterId ? { ...f, isPinned: newPinnedState } : f))
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return 0;
            })
        );
      } catch (err) {
        setError('Failed to update pin status');
        console.error('Toggle pin error:', err);
        throw err;
      }
    },
    [companyId, savedFilters]
  );

  return {
    savedFilters,
    loading,
    error,
    saveFilter,
    updateFilter,
    deleteFilter,
    togglePin,
    loadSavedFilters,
  };
}

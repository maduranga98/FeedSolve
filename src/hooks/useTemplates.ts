import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  increment,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import type { ReplyTemplate } from '../types';

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'companies', user.companyId, 'replyTemplates'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setTemplates(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReplyTemplate)));
    } catch (err) {
      console.error('Failed to load reply templates:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTemplate = useCallback(
    async (data: Pick<ReplyTemplate, 'title' | 'body' | 'category'>) => {
      if (!user?.companyId) return;
      await addDoc(collection(db, 'companies', user.companyId, 'replyTemplates'), {
        ...data,
        usageCount: 0,
        createdBy: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      await load();
    },
    [user?.companyId, user?.id, load]
  );

  const updateTemplate = useCallback(
    async (id: string, data: Pick<ReplyTemplate, 'title' | 'body' | 'category'>) => {
      if (!user?.companyId) return;
      await updateDoc(doc(db, 'companies', user.companyId, 'replyTemplates', id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
      await load();
    },
    [user?.companyId, load]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!user?.companyId) return;
      await deleteDoc(doc(db, 'companies', user.companyId, 'replyTemplates', id));
      await load();
    },
    [user?.companyId, load]
  );

  const incrementUsage = useCallback(
    (id: string) => {
      if (!user?.companyId) return;
      updateDoc(doc(db, 'companies', user.companyId, 'replyTemplates', id), {
        usageCount: increment(1),
      }).catch(() => {});
    },
    [user?.companyId]
  );

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    reload: load,
  };
}

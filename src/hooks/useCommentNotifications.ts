import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CommentNotification } from '../types';

interface UseCommentNotificationsReturn {
  notifications: (CommentNotification & { id: string })[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
}

export const useCommentNotifications = (
  companyId: string,
  userId: string
): UseCommentNotificationsReturn => {
  const [notifications, setNotifications] = useState<(CommentNotification & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const notificationsRef = collection(
      db,
      'companies',
      companyId,
      'notifications'
    );

    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as CommentNotification & { id: string }));

        setNotifications(updatedNotifications);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading notifications:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId, userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
  };
};

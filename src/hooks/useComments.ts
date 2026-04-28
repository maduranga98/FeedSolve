import { useState, useEffect } from 'react';
import { onSnapshot, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Comment } from '../types';

interface UseCommentsReturn {
  comments: (Comment & { id: string })[];
  isLoading: boolean;
  error: Error | null;
  commentCount: number;
}

export const useComments = (submissionId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<(Comment & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const commentsRef = collection(db, 'submissions', submissionId, 'comments');

    const unsubscribe = onSnapshot(
      commentsRef,
      (snapshot) => {
        const updatedComments = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Comment & { id: string }))
          .sort((a, b) => {
            const aTime = (a.createdAt as Timestamp).toDate().getTime();
            const bTime = (b.createdAt as Timestamp).toDate().getTime();
            return aTime - bTime;
          });

        setComments(updatedComments);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading comments:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [submissionId]);

  return {
    comments,
    isLoading,
    error,
    commentCount: comments.length,
  };
};

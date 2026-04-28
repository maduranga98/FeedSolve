import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { seedTemplates } from '../lib/firestore';

export function useTemplateInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const initTemplates = async () => {
      try {
        await seedTemplates();
      } catch (error) {
        console.error('Failed to seed templates:', error);
      }
    };

    initTemplates();
  }, [user?.id]);
}

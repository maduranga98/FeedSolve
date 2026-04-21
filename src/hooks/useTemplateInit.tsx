import { useEffect } from 'react';
import { seedTemplates } from '../lib/firestore';

export function useTemplateInit() {
  useEffect(() => {
    const initTemplates = async () => {
      try {
        await seedTemplates();
      } catch (error) {
        console.error('Failed to seed templates:', error);
      }
    };

    initTemplates();
  }, []);
}

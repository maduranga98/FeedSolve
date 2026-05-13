import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getCompany } from '../lib/firestore';
import type { Company } from '../types';

export function useSubscription() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const companyData = await getCompany(user.companyId);
      setCompany(companyData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [user]);

  const refetch = async () => {
    await fetchCompany();
  };

  return {
    company,
    subscription: company?.subscription,
    usage: company?.usage,
    loading,
    error,
    refetch,
  };
}

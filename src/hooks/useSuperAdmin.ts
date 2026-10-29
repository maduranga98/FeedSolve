import { useCallback, useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../lib/firebase';

export type Engagement = 'active' | 'dormant' | 'inactive' | 'not_started';

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: number | null;
  lastActive: number | null;
}

export interface AdminBoard {
  id: string;
  name: string;
  slug: string;
  submissionCount: number;
  createdAt: number | null;
}

export interface AdminCompany {
  id: string;
  name: string;
  email: string;
  createdAt: number | null;
  tier: string;
  billing: string;
  subscriptionStatus: string;
  owner: { name: string; email: string; lastActive: number | null } | null;
  memberCount: number;
  boardCount: number;
  totalSubmissions: number;
  submissionsLast30Days: number;
  lastSubmissionAt: number | null;
  lastActivityAt: number | null;
  revenueCents: number;
  mrrCents: number;
  engagement: Engagement;
  members: AdminMember[];
  boards: AdminBoard[];
}

export interface AdminOverview {
  generatedAt: number;
  activeWindowDays: number;
  totals: {
    companies: number;
    users: number;
    boards: number;
    submissions: number;
    revenueCents: number;
    mrrCents: number;
    paidCompanies: number;
    engagement: Record<Engagement, number>;
  };
  companies: AdminCompany[];
  warnings?: string[];
}

/** Resolves whether the signed-in user carries the `superAdmin` custom claim. */
export function useIsSuperAdmin() {
  const [state, setState] = useState<{ loading: boolean; isSuperAdmin: boolean }>({
    loading: true,
    isSuperAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(auth.currentUser?.getIdTokenResult())
      .then((res) => {
        if (!cancelled) setState({ loading: false, isSuperAdmin: res?.claims.superAdmin === true });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, isSuperAdmin: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

async function fetchOverview() {
  const fn = httpsCallable<unknown, AdminOverview>(getFunctions(), 'superAdminOverview');
  return (await fn()).data;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Failed to load overview');

export function useSuperAdminOverview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOverview()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchOverview());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refresh };
}

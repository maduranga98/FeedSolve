import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { isTrialExpired } from '../../lib/tier-limits';
import { LoadingSpinner } from './LoadingSpinner';

// Stay reachable so an expired account can subscribe or get help.
const ALLOWED_PATHS = ['/billing', '/help'];

export function TrialExpiredGate({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { subscription, loading } = useSubscription();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isTrialExpired(subscription) || ALLOWED_PATHS.some((path) => pathname.startsWith(path))) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-color-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
          <Lock size={22} />
        </div>
        <h1 className="text-xl font-bold text-[var(--c-t1c1917)]">Your free trial has ended</h1>
        <p className="mt-2 text-sm text-[var(--c-t78716c)]">
          Choose a plan to keep using FeedSolve. Your boards and submissions are safe and will be waiting for you.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--c-sc0694a)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--c-s1e6a8a)]"
          >
            <Zap size={15} /> View plans
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--c-t78716c)] hover:bg-[var(--c-sf5f0ec)]"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

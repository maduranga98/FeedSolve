import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Shared';

export function FeedbackLockedCard() {
  const navigate = useNavigate();

  return (
    <section className="rounded-xl border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sf1efe8)] text-[var(--c-t5f5e5a)]">
        <Lock size={18} />
      </div>
      <h3 className="text-lg font-bold text-[var(--c-t1c1917)]">Post-resolution feedback is a Growth feature</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--c-t78716c)]">
        Collect ratings and custom questions after a request is resolved, let submitters share their name or email,
        and export responses to CSV. Available on Growth and Business plans, and during your free trial.
      </p>
      <Button type="button" variant="primary" size="sm" className="mt-4" onClick={() => navigate('/pricing')}>
        Upgrade plan
      </Button>
    </section>
  );
}

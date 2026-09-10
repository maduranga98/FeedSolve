import { useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarClock, Lock } from 'lucide-react';
import type { Board, Company, RecurringFrequency } from '../../types';
import { calculateNextCycleDate, useBoardCycles } from '../../hooks/useBoardCycles';
import { Button } from '../Shared';

interface RecurringCycleSettingsProps {
  board: Board;
  company: Company | null;
  onBoardChange: (board: Board) => void;
}

function toDateInputValue(date?: Date | null) {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

function timestampToDate(timestamp?: Board['recurringStartDate']) {
  return timestamp ? timestamp.toDate() : null;
}

function isGrowthOrBusiness(company: Company | null) {
  return company?.subscription?.tier === 'growth' || company?.subscription?.tier === 'business';
}

export function RecurringCycleSettings({ board, company, onBoardChange }: RecurringCycleSettingsProps) {
  const allowed = isGrowthOrBusiness(company);
  const { saveRecurringSettings, saving, error } = useBoardCycles(company?.id, board.id);
  const [enabled, setEnabled] = useState(Boolean(board.recurringEnabled));
  const [frequency, setFrequency] = useState<RecurringFrequency>(board.recurringFrequency ?? 'monthly');
  const [customDays, setCustomDays] = useState(board.recurringCustomDays ?? 30);
  const [startDate, setStartDate] = useState<Date | null>(timestampToDate(board.recurringStartDate) ?? new Date());
  const [saved, setSaved] = useState(false);

  const nextCycleDate = useMemo(() => {
    if (!enabled || !startDate) return null;
    return calculateNextCycleDate(startDate, frequency, customDays);
  }, [customDays, enabled, frequency, startDate]);

  const handleSave = async () => {
    await saveRecurringSettings(board, {
      enabled,
      frequency: enabled ? frequency : null,
      customDays: frequency === 'custom' ? customDays : null,
      startDate: enabled ? startDate : null,
    });

    onBoardChange({
      ...board,
      recurringEnabled: enabled,
      recurringFrequency: enabled ? frequency : null,
      recurringCustomDays: enabled && frequency === 'custom' ? customDays : null,
      recurringStartDate: enabled && startDate ? Timestamp.fromDate(startDate) : null,
      nextCycleDate: enabled && nextCycleDate ? Timestamp.fromDate(nextCycleDate) : null,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
          <CalendarClock size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--c-t1c1917)]">Recurring Cycle</h2>
            {!allowed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--c-sf1efe8)] px-2 py-0.5 text-xs font-semibold text-[var(--c-t5f5e5a)]">
                <Lock size={11} /> Growth+
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--c-t78716c)]">
            Automatically archive submissions and start a fresh board cycle on a schedule.
          </p>
        </div>
      </div>

      {!allowed ? (
        <div className="rounded-xl border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] p-4 text-sm text-[var(--c-t78716c)]">
          Recurring cycles are available on Growth and Pro plans.
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sf5f0ec)] p-4">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--c-sc0694a)]"
            />
            <span>
              <span className="block text-sm font-bold text-[var(--c-t1c1917)]">Enable recurring cycles</span>
              <span className="block text-sm text-[var(--c-t78716c)]">
                New cycles keep prior submissions archived and viewable.
              </span>
            </span>
          </label>

          {enabled && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--c-be9e0d9)] p-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--c-t78716c)]">Frequency</label>
                <select
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value as RecurringFrequency)}
                  className="w-full rounded-lg border border-[var(--c-bd6cabf)] px-3 py-2 text-sm focus:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/20"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {frequency === 'custom' && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--c-t78716c)]">Every</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(event) => setCustomDays(Number(event.target.value))}
                      className="w-full rounded-lg border border-[var(--c-bd6cabf)] px-3 py-2 text-sm focus:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/20"
                    />
                    <span className="text-sm text-[var(--c-t78716c)]">days</span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--c-t78716c)]">Start date</label>
                <input
                  type="date"
                  value={toDateInputValue(startDate)}
                  onChange={(event) => setStartDate(event.target.value ? new Date(`${event.target.value}T00:00:00`) : null)}
                  className="w-full rounded-lg border border-[var(--c-bd6cabf)] px-3 py-2 text-sm focus:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/20"
                />
              </div>

              <div className="md:col-span-3 rounded-lg bg-[var(--c-sf5e6df)] px-3 py-2 text-sm font-semibold text-[var(--c-t1c1917)]">
                Next cycle starts: {nextCycleDate ? nextCycleDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Choose a start date'}
              </div>

              <div className="md:col-span-3 rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] px-3 py-2 text-sm text-[var(--c-t78716c)]">
                Existing submissions will be assigned to the current cycle. New cycles don't delete submissions — they're archived and viewable.
              </div>
            </div>
          )}

          {error && <p className="text-sm font-semibold text-[var(--c-tc0392b)]">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save recurring cycle'}
            </Button>
            {saved && <span className="text-sm font-semibold text-[var(--c-t1d8a57)]">Saved</span>}
          </div>
        </div>
      )}
    </section>
  );
}

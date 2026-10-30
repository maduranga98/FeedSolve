import { useEffect, useMemo, useState } from 'react';
import { Download, MessageSquare, Star } from 'lucide-react';
import type { Board, FeedbackResponse } from '../../types';
import { Button, LoadingSpinner } from '../Shared';
import { getBoardFeedbackResponses } from '../../lib/firestore';
import { exportFeedbackResponsesToCSV } from '../../lib/exportCSV';
import { formatFeedbackValue, getFeedbackConfig } from '../../lib/feedback';
import { formatDate } from '../../lib/utils';

const EXPORT_LIMIT = 5000;

interface FeedbackResponsesTabProps {
  board: Board;
  onOpenSettings: () => void;
}

export function FeedbackResponsesTab({ board, onOpenSettings }: FeedbackResponsesTabProps) {
  const config = useMemo(() => getFeedbackConfig(board), [board]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(config.enabled);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.enabled) return;

    let cancelled = false;
    const fetchResponses = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBoardFeedbackResponses(board.id);
        if (!cancelled) setResponses(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load feedback.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResponses();
    return () => {
      cancelled = true;
    };
  }, [board.id, config.enabled]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const all = await getBoardFeedbackResponses(board.id, EXPORT_LIMIT);
      const slug = board.slug || board.id;
      exportFeedbackResponsesToCSV(all, config.fields, `${slug}-feedback.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export feedback.');
    } finally {
      setExporting(false);
    }
  };

  const ratingField = config.fields.find((field) => field.type === 'rating');
  const stats = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0];
    let sum = 0;
    let rated = 0;
    if (ratingField) {
      for (const response of responses) {
        const value = response.responses.find((answer) => answer.fieldId === ratingField.id)?.value;
        if (typeof value === 'number' && value >= 1 && value <= 5) {
          distribution[Math.round(value) - 1] += 1;
          sum += value;
          rated += 1;
        }
      }
    }
    return { distribution, rated, average: rated ? sum / rated : 0 };
  }, [responses, ratingField]);

  if (!config.enabled) {
    return (
      <section className="rounded-xl border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
          <MessageSquare size={18} />
        </div>
        <h3 className="text-lg font-bold text-[var(--c-t1c1917)]">Feedback collection is off</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--c-t78716c)]">
          Turn on post-resolution feedback to let submitters rate how their request was handled. Responses will appear here.
        </p>
        <Button type="button" variant="primary" size="sm" className="mt-4" onClick={onOpenSettings}>
          Turn on in board settings
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--c-t1c1917)]">Feedback responses</h3>
          <p className="text-sm text-[var(--c-t78716c)]">
            {loading ? 'Loading…' : `${responses.length} ${responses.length === 1 ? 'response' : 'responses'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExport}
            isLoading={exporting}
            disabled={loading || responses.length === 0}
          >
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-[var(--c-tc0392b)]">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      ) : responses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
            <MessageSquare size={18} />
          </div>
          <p className="text-sm font-semibold text-[var(--c-t1c1917)]">No feedback yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--c-t78716c)]">
            Responses appear here after a submitter reviews a {config.triggerStatus} request.
          </p>
        </div>
      ) : (
        <>
          {ratingField && (
            <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
              <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-4 sm:min-w-[9rem]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t78716c)]">Avg. rating</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[var(--c-t1c1917)]">{stats.average.toFixed(1)}</span>
                  <span className="text-sm text-[var(--c-t78716c)]">/ 5</span>
                </p>
                <Stars value={Math.round(stats.average)} />
              </div>
              <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--c-t78716c)]">Distribution</p>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = stats.distribution[n - 1];
                    const pct = stats.rated ? (count / stats.rated) * 100 : 0;
                    return (
                      <div key={n} className="flex items-center gap-2 text-xs text-[var(--c-t78716c)]">
                        <span className="w-3 text-right font-semibold">{n}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--c-sf1ebe5)]">
                          <div className="h-full rounded-full bg-[var(--c-sc0694a)]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right tabular-nums">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-3">
            {responses.map((response) => {
              const valuesByFieldId = new Map(response.responses.map((answer) => [answer.fieldId, answer.value]));
              return (
                <li
                  key={response.id}
                  className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-4 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-md bg-[var(--c-sf5e6df)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--c-tc0694a)]">
                      {response.trackingCode}
                    </span>
                    <time className="text-xs text-[var(--c-t78716c)]">
                      {response.submittedAt ? formatDate(response.submittedAt.toDate()) : '—'}
                    </time>
                  </div>
                  <p className="mb-3 break-words text-xs text-[var(--c-t78716c)]">
                    {response.contact?.name || response.contact?.email ? (
                      <>
                        <span className="font-semibold text-[var(--c-t1c1917)]">{response.contact.name}</span>
                        {response.contact.name && response.contact.email && ' · '}
                        {response.contact.email && (
                          <a href={`mailto:${response.contact.email}`} className="underline">
                            {response.contact.email}
                          </a>
                        )}
                      </>
                    ) : (
                      'Anonymous'
                    )}
                  </p>
                  <dl className="space-y-3">
                    {config.fields.map((field) => {
                      const value = valuesByFieldId.get(field.id);
                      const text = formatFeedbackValue(field, value);
                      return (
                        <div key={field.id}>
                          <dt className="text-xs font-semibold text-[var(--c-t78716c)]">{field.label}</dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--c-t1c1917)]">
                            {field.type === 'rating' && typeof value === 'number' ? (
                              <span className="inline-flex items-center gap-2">
                                <Stars value={value} />
                                <span className="text-xs font-semibold text-[var(--c-t78716c)]">{value} / 5</span>
                              </span>
                            ) : (
                              text || <span className="text-[var(--c-t78716c)]">—</span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="mt-1 inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= value ? 'fill-[var(--c-sc0694a)] text-[var(--c-tc0694a)]' : 'text-[var(--c-bd6cabf)]'}
        />
      ))}
    </span>
  );
}

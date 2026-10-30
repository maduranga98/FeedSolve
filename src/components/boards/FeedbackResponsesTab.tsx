import { useEffect, useMemo, useState } from 'react';
import { Download, Lock, MessageSquare } from 'lucide-react';
import type { Board, Company, FeedbackResponse } from '../../types';
import { Button, LoadingSpinner } from '../Shared';
import { getBoardFeedbackResponses } from '../../lib/firestore';
import { exportFeedbackResponsesToCSV } from '../../lib/exportCSV';
import { formatFeedbackValue, getFeedbackConfig } from '../../lib/feedback';
import { hasFeature } from '../../lib/tier-limits';
import { formatDate } from '../../lib/utils';

const EXPORT_LIMIT = 5000;

interface FeedbackResponsesTabProps {
  board: Board;
  company: Company | null;
  onOpenSettings: () => void;
}

export function FeedbackResponsesTab({ board, company, onOpenSettings }: FeedbackResponsesTabProps) {
  const config = useMemo(() => getFeedbackConfig(board), [board]);
  const canExport = hasFeature(company?.subscription?.tier ?? 'free', 'canUseAdvancedFeedback');
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
    <section className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--c-t1c1917)]">Feedback responses</h3>
          <p className="mt-1 text-sm text-[var(--c-t78716c)]">
            {loading ? 'Loading…' : `${responses.length} ${responses.length === 1 ? 'response' : 'responses'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!canExport && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--c-sf1efe8)] px-2 py-0.5 text-xs font-semibold text-[var(--c-t5f5e5a)]">
              <Lock size={11} /> Growth+
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExport}
            isLoading={exporting}
            disabled={!canExport || loading || responses.length === 0}
            title={canExport ? undefined : 'CSV export is available on Growth and Business plans'}
          >
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm font-semibold text-[var(--c-tc0392b)]">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      ) : responses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] p-6 text-center text-sm text-[var(--c-t78716c)]">
          No feedback yet. Responses appear here after a submitter reviews a {config.triggerStatus} request.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--c-be9e0d9)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--c-sf5f0ec)] text-xs uppercase tracking-wide text-[var(--c-t78716c)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Tracking code</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Submitted</th>
                {config.fields.map((field) => (
                  <th key={field.id} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-be9e0d9)]">
              {responses.map((response) => {
                const valuesByFieldId = new Map(response.responses.map((answer) => [answer.fieldId, answer.value]));
                return (
                  <tr key={response.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[var(--c-t1c1917)]">
                      {response.trackingCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--c-t78716c)]">
                      {response.submittedAt ? formatDate(response.submittedAt.toDate()) : '—'}
                    </td>
                    {config.fields.map((field) => {
                      const value = valuesByFieldId.get(field.id);
                      return (
                        <td key={field.id} className="max-w-xs whitespace-pre-wrap break-words px-4 py-3 text-[var(--c-t1c1917)]">
                          {field.type === 'rating' && typeof value === 'number' ? `${value} / 5` : formatFeedbackValue(field, value) || '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

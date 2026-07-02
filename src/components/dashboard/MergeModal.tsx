import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight, Search, X } from "lucide-react";
import type { Submission } from "../../types";
import type { User } from "../../types";
import { useMergeSubmission } from "../../hooks/useMergeSubmission";
import { Badge } from "../Shared";

interface MergeModalProps {
  sourceSubmission: Submission;
  currentUser: User | null;
  onClose: () => void;
  onMerged: () => void;
}

function PreviewCard({ title, submission, t }: { title: string; submission: Submission; t: (key: string) => string }) {
  return (
    <div className="rounded-xl border border-[#d6cabf] bg-white p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#78716c]">{title}</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-[#8f8680]">{t('merge_modal.tracking_code')}</p>
          <p className="font-mono text-sm font-semibold text-[#1c1917]">{submission.trackingCode}</p>
        </div>
        <div>
          <p className="text-xs text-[#8f8680]">{t('merge_modal.category')}</p>
          <p className="text-sm font-semibold text-[#3c3632]">{submission.category}</p>
        </div>
        <div>
          <p className="text-xs text-[#8f8680]">{t('merge_modal.subject')}</p>
          <p className="text-sm font-semibold text-[#1c1917]">{submission.subject}</p>
        </div>
        <div>
          <p className="text-xs text-[#8f8680]">{t('merge_modal.status')}</p>
          <Badge status={submission.status} />
        </div>
      </div>
    </div>
  );
}

export function MergeModal({ sourceSubmission, currentUser, onClose, onMerged }: MergeModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"search" | "confirm">("search");
  const [query, setQuery] = useState("");
  const [includeAllBoards, setIncludeAllBoards] = useState(false);
  const [results, setResults] = useState<Submission[]>([]);
  const [masterSubmission, setMasterSubmission] = useState<Submission | null>(null);
  const { loading, searching, error, searchMasterSubmissions, mergeSubmission } = useMergeSubmission(currentUser);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const matches = await searchMasterSubmissions(sourceSubmission, query, includeAllBoards);
      setResults(matches);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [includeAllBoards, query, searchMasterSubmissions, sourceSubmission]);

  const handleSelectMaster = (submission: Submission) => {
    setMasterSubmission(submission);
    setStep("confirm");
  };

  const handleMerge = async () => {
    if (!masterSubmission) return;
    await mergeSubmission(sourceSubmission, masterSubmission);
    onMerged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#e9e0d9] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1c1917]">{t('merge_modal.title')}</h2>
            <p className="mt-1 text-sm text-[#78716c]">
              {t('merge_modal.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8f8680] transition hover:bg-[#ece5de] hover:text-[#3c3632]"
            aria-label={t('merge_modal.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-[#FADBD8] bg-[#FDECEA] px-4 py-3 text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {step === "search" ? (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#78716c]">
                  {t('merge_modal.search_label')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8680]" size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('merge_modal.search_placeholder')}
                    className="w-full rounded-lg border border-[#d6cabf] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1c1917] outline-none transition focus:border-[#c0694a] focus:ring-2 focus:ring-[#c0694a]/20"
                    autoFocus
                  />
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#78716c]">
                  <input
                    type="checkbox"
                    checked={includeAllBoards}
                    onChange={(event) => setIncludeAllBoards(event.target.checked)}
                    className="h-4 w-4 accent-[#c0694a]"
                  />
                  {t('merge_modal.include_all_boards')}
                </label>
              </div>

              <div className="rounded-xl border border-[#e9e0d9]">
                <div className="border-b border-[#e9e0d9] bg-[#f5f0ec] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#78716c]">
                  {t('merge_modal.matching')}
                </div>
                {searching ? (
                  <div className="p-6 text-center text-sm text-[#78716c]">{t('merge_modal.searching')}</div>
                ) : query.trim().length < 2 ? (
                  <div className="p-6 text-center text-sm text-[#78716c]">{t('merge_modal.min_chars')}</div>
                ) : results.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#78716c]">{t('merge_modal.no_results')}</div>
                ) : (
                  <div className="divide-y divide-[#e9e0d9]">
                    {results.map((submission) => (
                      <button
                        key={submission.id}
                        type="button"
                        onClick={() => handleSelectMaster(submission)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#f5f0ec]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#c0694a]">{submission.trackingCode}</span>
                            <Badge status={submission.status} />
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold text-[#1c1917]">{submission.subject}</p>
                          <p className="text-xs text-[#78716c]">{submission.category}</p>
                        </div>
                        <ArrowRight className="flex-shrink-0 text-[#8f8680]" size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : masterSubmission ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                <PreviewCard title={t('merge_modal.this_submission')} submission={sourceSubmission} t={t} />
                <div className="flex items-center justify-center text-[#8f8680]">
                  <ArrowRight size={22} />
                </div>
                <PreviewCard title={t('merge_modal.master_submission')} submission={masterSubmission} t={t} />
              </div>

              <div className="rounded-xl border border-[#F5B7B1] bg-[#FDECEA] p-4 text-sm text-[#9A3A31]">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 flex-shrink-0" size={18} />
                  <p>
                    <strong>{t('merge_modal.cannot_undo')}</strong> {t('merge_modal.warning_detail', { source: sourceSubmission.trackingCode, master: masterSubmission.trackingCode })}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e9e0d9] bg-[#f5f0ec] px-6 py-4">
          {step === "confirm" ? (
            <button
              type="button"
              onClick={() => setStep("search")}
              className="rounded-lg border border-[#d6cabf] bg-white px-4 py-2 text-sm font-semibold text-[#78716c] transition hover:text-[#1c1917]"
            >
              {t('merge_modal.back')}
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d6cabf] bg-white px-4 py-2 text-sm font-semibold text-[#78716c] transition hover:text-[#1c1917]"
            >
              {t('merge_modal.cancel')}
            </button>
            {step === "confirm" && (
              <button
                type="button"
                onClick={handleMerge}
                disabled={loading}
                className="rounded-lg bg-[#c0392b] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#C0392B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t('merge_modal.merging') : t('merge_modal.merge')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

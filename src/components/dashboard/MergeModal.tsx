import { useEffect, useState } from "react";
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

function PreviewCard({ title, submission }: { title: string; submission: Submission }) {
  return (
    <div className="rounded-xl border border-[#D3D1C7] bg-white p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#6B7B8D]">{title}</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-[#9AABBF]">Tracking code</p>
          <p className="font-mono text-sm font-semibold text-[#1E3A5F]">{submission.trackingCode}</p>
        </div>
        <div>
          <p className="text-xs text-[#9AABBF]">Category</p>
          <p className="text-sm font-semibold text-[#444441]">{submission.category}</p>
        </div>
        <div>
          <p className="text-xs text-[#9AABBF]">Subject</p>
          <p className="text-sm font-semibold text-[#1E3A5F]">{submission.subject}</p>
        </div>
        <div>
          <p className="text-xs text-[#9AABBF]">Status</p>
          <Badge status={submission.status} />
        </div>
      </div>
    </div>
  );
}

export function MergeModal({ sourceSubmission, currentUser, onClose, onMerged }: MergeModalProps) {
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
        <div className="flex items-start justify-between gap-4 border-b border-[#E8ECF0] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F]">Merge this submission</h2>
            <p className="mt-1 text-sm text-[#6B7B8D]">
              Merge this into another submission. The other submission becomes the master and this one will be marked as merged.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9AABBF] transition hover:bg-[#F4F7FA] hover:text-[#444441]"
            aria-label="Close merge modal"
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
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6B7B8D]">
                  Search for master submission
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AABBF]" size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by tracking code or subject keyword"
                    className="w-full rounded-lg border border-[#D3D1C7] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#2E86AB] focus:ring-2 focus:ring-[#2E86AB]/20"
                    autoFocus
                  />
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#6B7B8D]">
                  <input
                    type="checkbox"
                    checked={includeAllBoards}
                    onChange={(event) => setIncludeAllBoards(event.target.checked)}
                    className="h-4 w-4 accent-[#2E86AB]"
                  />
                  Include submissions from all boards
                </label>
              </div>

              <div className="rounded-xl border border-[#E8ECF0]">
                <div className="border-b border-[#E8ECF0] bg-[#F8FAFB] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7B8D]">
                  Matching submissions
                </div>
                {searching ? (
                  <div className="p-6 text-center text-sm text-[#6B7B8D]">Searching…</div>
                ) : query.trim().length < 2 ? (
                  <div className="p-6 text-center text-sm text-[#6B7B8D]">Enter at least 2 characters to search.</div>
                ) : results.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#6B7B8D]">No eligible master submissions found.</div>
                ) : (
                  <div className="divide-y divide-[#E8ECF0]">
                    {results.map((submission) => (
                      <button
                        key={submission.id}
                        type="button"
                        onClick={() => handleSelectMaster(submission)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#F8FAFB]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#2E86AB]">{submission.trackingCode}</span>
                            <Badge status={submission.status} />
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold text-[#1E3A5F]">{submission.subject}</p>
                          <p className="text-xs text-[#6B7B8D]">{submission.category}</p>
                        </div>
                        <ArrowRight className="flex-shrink-0 text-[#9AABBF]" size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : masterSubmission ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                <PreviewCard title="This submission" submission={sourceSubmission} />
                <div className="flex items-center justify-center text-[#9AABBF]">
                  <ArrowRight size={22} />
                </div>
                <PreviewCard title="Master submission" submission={masterSubmission} />
              </div>

              <div className="rounded-xl border border-[#F5B7B1] bg-[#FDECEA] p-4 text-sm text-[#9A3A31]">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 flex-shrink-0" size={18} />
                  <p>
                    <strong>This action cannot be undone.</strong> {sourceSubmission.trackingCode} will be marked as merged and its tracking page will redirect to {masterSubmission.trackingCode}.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E8ECF0] bg-[#F8FAFB] px-6 py-4">
          {step === "confirm" ? (
            <button
              type="button"
              onClick={() => setStep("search")}
              className="rounded-lg border border-[#D3D1C7] bg-white px-4 py-2 text-sm font-semibold text-[#6B7B8D] transition hover:text-[#1E3A5F]"
            >
              Back
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D3D1C7] bg-white px-4 py-2 text-sm font-semibold text-[#6B7B8D] transition hover:text-[#1E3A5F]"
            >
              Cancel
            </button>
            {step === "confirm" && (
              <button
                type="button"
                onClick={handleMerge}
                disabled={loading}
                className="rounded-lg bg-[#E74C3C] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#C0392B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Merging…" : "Merge"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

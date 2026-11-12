import { loadExportContext, downloadSingleSubmissionCSV } from '../../lib/submission-export';
import { toast } from 'sonner';
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Board, FileAttachment, Submission } from "../../types";
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  FileText,
  Eye,
  ExternalLink,
  GitMerge,
  MapPin,
  MoreVertical,
  ClipboardList,
  Lock,
  MessageSquare,
  MessageSquareHeart,
} from "lucide-react";
import { AttachmentGallery } from "../Attachments";
import { useFileDownload } from "../../hooks/useFileDownload";
import { useAuth } from "../../hooks/useAuth";
import { useMergeSubmission } from "../../hooks/useMergeSubmission";
import AssignDropdown from "./AssignDropdown";
import { SubmissionCustomFields } from "./SubmissionCustomFields";
import { SubmissionFeedback } from "./SubmissionFeedback";
import { getFeedbackConfig } from "../../lib/feedback";
import PriorityDropdown from "./PriorityDropdown";
import PublicReplySection from "./PublicReplySection";
import { InternalDiscussion } from "../dashboard/InternalDiscussion";
import { MergeModal } from "../dashboard/MergeModal";
import { updateSubmissionStatus, addAuditLog, getBoard } from "../../lib/firestore";
import { formatDate } from "../../lib/utils";

type DetailTab = "details" | "team" | "reply" | "feedback";

interface SubmissionDetailProps {
  submission: Submission;
  onClose: () => void;
  onUpdated?: () => void;
}

function StatusBadge({ status, t }: { status: Submission["status"]; t: (key: string) => string }) {
  const map: Record<Submission["status"], { labelKey: string; cls: string }> = {
    received: { labelKey: "detail.received", cls: "bg-[var(--c-sf5e6df)] text-[var(--c-t9c4a2f)]" },
    in_review: { labelKey: "detail.in_review", cls: "bg-[var(--c-sfff3cd)] text-[var(--c-t856404)]" },
    in_progress: { labelKey: "detail.in_progress", cls: "bg-[var(--c-sfff8e6)] text-[var(--c-tb06f00)]" },
    escalated: { labelKey: "detail.escalated", cls: "bg-[var(--c-sfdecea)] text-[var(--c-tc0392b)]" },
    resolved: { labelKey: "detail.resolved", cls: "bg-[var(--c-seaf9f2)] text-[var(--c-t1d8a57)]" },
    closed: { labelKey: "detail.closed", cls: "bg-[var(--c-sf2ece6)] text-[var(--c-t78716c)]" },
  };
  const { labelKey, cls } = map[status] ?? { labelKey: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {t(labelKey)}
    </span>
  );
}

function formatMergedAt(submission: Submission, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (!submission.mergedAt) return t("detail.merged_recently");
  const diffMs = Date.now() - submission.mergedAt.toDate().getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return t("detail.merged_minutes_ago_other", { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("detail.merged_hours_ago_other", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t("detail.merged_days_ago_other", { count: diffDays });
}

function MergedSubmissionPreview({ submission, onClose, t }: { submission: Submission; onClose: () => void; t: (key: string) => string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-end bg-black/40 p-4">
      <div className="h-full w-full max-w-md overflow-y-auto rounded-xl bg-[var(--c-sffffff)] shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--c-t78716c)]">{t('detail.merged_submission')}</p>
            <h3 className="mt-1 text-lg font-bold text-[var(--c-t1c1917)]">{submission.subject}</h3>
            <p className="font-mono text-xs text-[var(--c-tc0694a)]">{submission.trackingCode}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--c-t8f8680)] hover:bg-[var(--c-sece5de)] hover:text-[var(--c-t3c3632)]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div className="rounded-xl bg-[var(--c-sf1efe8)] px-3 py-2 text-xs font-semibold text-[var(--c-t5f5e5a)]">{t('detail.read_only_merged')}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-[var(--c-t8f8680)]">{t('detail.category')}</p><p className="font-semibold text-[var(--c-t3c3632)]">{submission.category}</p></div>
            <div><p className="text-xs text-[var(--c-t8f8680)]">{t('status')}</p><StatusBadge status={submission.status} t={t} /></div>
            <div><p className="text-xs text-[var(--c-t8f8680)]">{t('detail.submitted')}</p><p className="font-semibold text-[var(--c-t3c3632)]">{formatDate(submission.createdAt.toDate())}</p></div>
            <div><p className="text-xs text-[var(--c-t8f8680)]">{t('detail.merged_recently')}</p><p className="font-semibold text-[var(--c-t3c3632)]">{submission.mergedAt ? formatDate(submission.mergedAt.toDate()) : ""}</p></div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">Description</p>
            <p className="whitespace-pre-wrap rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sfafafa)] p-4 leading-relaxed text-[var(--c-t3c3632)]">{submission.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionDetail({
  submission,
  onClose,
  onUpdated,
}: SubmissionDetailProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [tab, setTab] = useState<DetailTab>("details");
  const [exporting, setExporting] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergedSubmissions, setMergedSubmissions] = useState<Submission[]>([]);
  const [readOnlySubmission, setReadOnlySubmission] = useState<Submission | null>(null);
  const { loading: downloading, downloadFile, viewFile } = useFileDownload();
  const { loadMergedSubmissions } = useMergeSubmission(user);

  useEffect(() => {
    const ids = submission.mergedSubmissions ?? [];
    if (ids.length === 0) {
      Promise.resolve().then(() => setMergedSubmissions([]));
      return;
    }

    let active = true;
    loadMergedSubmissions(ids)
      .then((items) => {
        if (active) setMergedSubmissions(items);
      })
      .catch((error) => console.error("Failed to load merged submissions:", error));

    return () => {
      active = false;
    };
  }, [loadMergedSubmissions, submission.mergedSubmissions]);

  // Load the board once and share it with both custom-field sections.
  useEffect(() => {
    let active = true;
    getBoard(submission.boardId)
      .then((data) => {
        if (active) setBoard(data);
      })
      .catch((error) => console.error("Failed to load board:", error));
    return () => {
      active = false;
    };
  }, [submission.boardId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mergeModalOpen && !readOnlySubmission) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, mergeModalOpen, readOnlySubmission]);

  const handleStatusChange = async (newStatus: Submission["status"]) => {
    setLoading(true);
    try {
      await updateSubmissionStatus(submission.id, newStatus);
      if (user) {
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: `Changed status to "${newStatus}"`,
          resourceType: "submission",
          resourceId: submission.id,
          resourceName: submission.subject,
          details: { from: submission.status, to: newStatus },
        });
      }
      onUpdated?.();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(t("detail.failed_update_status"));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const ctx = await loadExportContext([submission], {
        companyId: user?.companyId,
        knownBoards: board ? [board] : [],
      });
      downloadSingleSubmissionCSV(submission, ctx);
    } catch (error) {
      console.error("Failed to export submission:", error);
      toast.error("Failed to export submission");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyTrackingLink = () => {
    const url = `${window.location.origin}/track/${submission.trackingCode.replace(/^#/, '')}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewFile = async (attachment: FileAttachment) => {
    // Try to open via viewFile (gets a signed download URL)
    try {
      const result = await viewFile(submission.id, attachment);
      // viewFile may open a tab or return a URL; handle both cases
      if (result?.url) {
        setPreviewUrl(result.url);
      }
    } catch {
      // fallback: open download
      await downloadFile(submission.id, attachment);
    }
  };

  const trackingPath = `/track/${submission.trackingCode.replace(/^#/, "")}`;
  const trackingUrl = `${window.location.origin}${trackingPath}`;
  // Submitter feedback tab exists only when the board owner has switched it on.
  const feedbackEnabled = board ? getFeedbackConfig(board).enabled : false;
  const attachmentCount = submission.attachments?.length ?? 0;

  const tabs: { id: DetailTab; label: string; icon: typeof FileText; badge?: number }[] = [
    { id: "details", label: "Details", icon: ClipboardList, badge: attachmentCount || undefined },
    { id: "team", label: "Team", icon: Lock },
    { id: "reply", label: "Reply", icon: MessageSquare },
    ...(feedbackEnabled ? [{ id: "feedback" as const, label: "Feedback", icon: MessageSquareHeart }] : []),
  ];

  const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)] mb-1";
  const iconBtn =
    "p-2 text-[var(--c-t8f8680)] hover:text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)] rounded-lg transition-colors";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[var(--c-sffffff)] sm:rounded-xl w-full max-w-4xl h-full sm:h-[90vh] flex flex-col shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-4 pb-3 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={submission.status} t={t} />
              <span className="font-mono text-xs text-[var(--c-t8f8680)] bg-[var(--c-sece5de)] px-2 py-0.5 rounded">
                {submission.trackingCode}
              </span>
              {submission.priority && (
                <span className="text-xs text-[var(--c-t8f8680)] capitalize">· {submission.priority}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[var(--c-t1c1917)] mt-1 truncate">{submission.subject}</h2>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={handleCopyTrackingLink} className={iconBtn} title={t("detail.copy_tracking_link")}>
              {copied ? <Check size={18} className="text-[var(--c-t1d8a57)]" /> : <Share2 size={18} />}
            </button>
            <button onClick={handleExport} disabled={exporting} className={`${iconBtn} disabled:opacity-50`} title={t("detail.export_as_csv")}>
              <Download size={18} className={exporting ? "animate-pulse" : ""} />
            </button>
            <a href={trackingPath} target="_blank" rel="noopener noreferrer" className={iconBtn} title={t("detail.open_tracking_page")}>
              <ExternalLink size={18} />
            </a>
            <div className="relative">
              <button
                onClick={() => setActionsOpen((open) => !open)}
                className={iconBtn}
                title={t("detail.more_actions")}
                aria-label={t("detail.more_actions")}
              >
                <MoreVertical size={18} />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-lg border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] shadow-lg">
                  <button
                    type="button"
                    disabled={submission.isMerged}
                    onClick={() => {
                      setActionsOpen(false);
                      setMergeModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[var(--c-t78716c)] transition hover:bg-[var(--c-sf5f0ec)] hover:text-[var(--c-t1c1917)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GitMerge size={15} />
                    {t("detail.merge_with_another")}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="p-2 text-[var(--c-t8f8680)] hover:text-[var(--c-t3c3632)] hover:bg-[var(--c-sece5de)] rounded-lg transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Always-visible controls */}
        <div className="px-5 sm:px-6 pb-3 grid grid-cols-2 gap-3 max-w-md flex-shrink-0 w-full">
          <div>
            <label className={labelCls}>{t("status")}</label>
            <select
              value={submission.status}
              onChange={(e) => handleStatusChange(e.target.value as Submission["status"])}
              disabled={loading}
              className="w-full px-3 py-2 border border-[var(--c-bd6cabf)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] bg-[var(--c-sffffff)]"
            >
              <option value="received">{t("detail.received")}</option>
              <option value="in_review">{t("detail.in_review")}</option>
              <option value="in_progress">{t("detail.in_progress")}</option>
              <option value="escalated">{t("detail.escalated")}</option>
              <option value="resolved">{t("detail.resolved")}</option>
              <option value="closed">{t("detail.closed")}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("detail.priority")}</label>
            <PriorityDropdown
              submissionId={submission.id}
              currentPriority={submission.priority}
              onUpdated={onUpdated}
            />
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="px-5 sm:px-6 flex gap-1 border-b border-[var(--c-be9e0d9)] flex-shrink-0">
          {tabs.map(({ id, label, icon: Icon, badge }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`-mb-px inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  active
                    ? "border-[var(--c-bc0694a)] text-[var(--c-tc0694a)]"
                    : "border-transparent text-[var(--c-t8f8680)] hover:text-[var(--c-t3c3632)]"
                }`}
              >
                <Icon size={14} />
                {label}
                {badge ? (
                  <span className="rounded-full bg-[var(--c-sece5de)] px-1.5 text-[11px] text-[var(--c-t78716c)]">{badge}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Scrollable body — only this area scrolls, so header and tabs never cover content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--c-sfaf8f5)] px-5 sm:px-6 py-5">
          {submission.isMerged && (
            <div className="mb-4 rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sf1efe8)] p-4 text-sm text-[var(--c-t5f5e5a)]">
              {t("detail.merged_notice")}
            </div>
          )}

          {/* DETAILS — everything the submitter provided */}
          <div hidden={tab !== "details"} className="space-y-4">
            {!submission.customFields && (
              <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
                <label className={labelCls}>{t("description")}</label>
                <p className="text-[var(--c-t3c3632)] whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {submission.description}
                </p>
              </div>
            )}

            <SubmissionCustomFields submission={submission} board={board} section="details" onUpdated={onUpdated} />

            <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
              <h3 className="text-sm font-bold text-[var(--c-t1c1917)] mb-4">Submission info</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className={labelCls}>{t("detail.category")}</dt>
                  <dd className="text-[var(--c-t3c3632)]">{submission.category}</dd>
                </div>
                <div>
                  <dt className={labelCls}>{t("detail.submitted")}</dt>
                  <dd className="text-[var(--c-t3c3632)]">{formatDate(submission.createdAt.toDate())}</dd>
                </div>
                {submission.location && (
                  <div>
                    <dt className={labelCls}>{t("detail.location")}</dt>
                    <dd>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c-sf1ebe5)] px-2.5 py-1 text-xs font-medium text-[var(--c-t78716c)]">
                        <MapPin size={12} />
                        {submission.location}
                      </span>
                    </dd>
                  </div>
                )}
                {submission.isAnonymous ? (
                  <div>
                    <dt className={labelCls}>{t("detail.identity")}</dt>
                    <dd>
                      <span className="inline-flex items-center text-xs bg-[var(--c-sf2ece6)] text-[var(--c-t78716c)] px-2 py-1 rounded-full">
                        {t("detail.anonymous")}
                      </span>
                    </dd>
                  </div>
                ) : (
                  <>
                    {submission.submitterName && (
                      <div>
                        <dt className={labelCls}>{t("name")}</dt>
                        <dd className="text-[var(--c-t3c3632)] break-words">{submission.submitterName}</dd>
                      </div>
                    )}
                    {submission.submitterEmail && (
                      <div>
                        <dt className={labelCls}>{t("detail.submitter_email")}</dt>
                        <dd className="text-[var(--c-t3c3632)] break-all">{submission.submitterEmail}</dd>
                      </div>
                    )}
                    {submission.submitterMobile && (
                      <div>
                        <dt className={labelCls}>{t("detail.mobile")}</dt>
                        <dd className="text-[var(--c-t3c3632)]">{submission.submitterMobile}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>

            {attachmentCount > 0 && (
              <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-[var(--c-tc0694a)]" />
                  <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">Attachments ({attachmentCount})</h3>
                </div>
                <AttachmentGallery
                  attachments={submission.attachments!}
                  onDownload={(attachment) => downloadFile(submission.id, attachment)}
                  onView={handleViewFile}
                  loading={downloading}
                />
              </div>
            )}

            {previewUrl && (
              <div className="border border-[var(--c-be9e0d9)] rounded-xl overflow-hidden bg-[var(--c-sffffff)]">
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--c-sece5de)] border-b border-[var(--c-be9e0d9)]">
                  <span className="text-xs font-medium text-[var(--c-t78716c)] flex items-center gap-1">
                    <Eye size={13} />
                    {t("detail.file_preview")}
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--c-tc0694a)] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      {t("detail.open_new_tab")}
                    </a>
                    <button onClick={() => setPreviewUrl(null)} className="text-xs text-[var(--c-t8f8680)] hover:text-[var(--c-t3c3632)]">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <iframe src={previewUrl} className="w-full h-72 border-0" title="Attachment preview" />
              </div>
            )}

            {mergedSubmissions.length > 0 && (
              <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <GitMerge size={16} className="text-[var(--c-tc0694a)]" />
                  <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">{t("detail.merged_submissions")}</h3>
                </div>
                <div className="space-y-2">
                  {mergedSubmissions.map((merged) => (
                    <button
                      key={merged.id}
                      type="button"
                      onClick={() => setReadOnlySubmission(merged)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--c-be9e0d9)] px-3 py-2 text-left transition hover:bg-[var(--c-sf5f0ec)]"
                    >
                      <span className="min-w-0 text-sm text-[var(--c-t3c3632)]">
                        <span className="font-mono font-semibold text-[var(--c-tc0694a)]">{merged.trackingCode}</span>
                        <span> — {merged.category} — {formatMergedAt(merged, t)}</span>
                      </span>
                      <span className="flex-shrink-0 text-xs font-semibold text-[var(--c-tc0694a)]">{t("detail.open")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Share link */}
            <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
              <label className={labelCls}>{t("detail.submitter_tracking_link")}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 text-xs text-[var(--c-tc0694a)] bg-[var(--c-sfaf8f5)] border border-[var(--c-be9e0d9)] px-3 py-2 rounded-lg truncate">
                  {trackingUrl}
                </code>
                <button
                  onClick={handleCopyTrackingLink}
                  className="p-2 text-[var(--c-t8f8680)] hover:text-[var(--c-tc0694a)] border border-[var(--c-be9e0d9)] rounded-lg transition-colors flex-shrink-0"
                  title={t("detail.copy_link")}
                >
                  {copied ? <Check size={16} className="text-[var(--c-t1d8a57)]" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-[var(--c-t8f8680)] mt-1.5">{t("detail.share_link_desc")}</p>
            </div>
          </div>

          {/* TEAM — internal only */}
          <div hidden={tab !== "team"} className="space-y-4">
            <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
              <label className={labelCls}>{t("detail.assigned_to")}</label>
              <p className="text-xs text-[var(--c-t78716c)] mb-3">{t("detail.assign_help")}</p>
              <AssignDropdown submissionId={submission.id} assignedToId={submission.assignedTo} onAssigned={onUpdated} />
            </div>

            <SubmissionCustomFields submission={submission} board={board} section="team" />

            <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
              <InternalDiscussion submission={submission} currentUser={user} onMigrated={onUpdated} />
            </div>
          </div>

          {/* REPLY — visible to the submitter */}
          <div hidden={tab !== "reply"}>
            <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
              <PublicReplySection
                submissionId={submission.id}
                publicReply={submission.publicReply}
                publicReplyAt={submission.publicReplyAt}
                publicReplyBy={submission.publicReplyBy}
                onReplyAdded={onUpdated}
                submission={submission}
              />
            </div>
          </div>

          {/* FEEDBACK — submitter's post-resolution answers */}
          {feedbackEnabled && (
            <div hidden={tab !== "feedback"}>
              <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
                <SubmissionFeedback submission={submission} board={board} />
              </div>
            </div>
          )}
        </div>
      </div>
      {mergeModalOpen && (
        <MergeModal
          sourceSubmission={submission}
          currentUser={user}
          onClose={() => setMergeModalOpen(false)}
          onMerged={() => onUpdated?.()}
        />
      )}
      {readOnlySubmission && (
        <MergedSubmissionPreview submission={readOnlySubmission} onClose={() => setReadOnlySubmission(null)} t={t} />
      )}
    </div>
  );
}

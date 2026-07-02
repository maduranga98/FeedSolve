import { downloadTextFile } from '../../lib/download';
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FileAttachment, Submission } from "../../types";
import { Button } from "../Shared";
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
} from "lucide-react";
import { AttachmentGallery } from "../Attachments";
import { useFileDownload } from "../../hooks/useFileDownload";
import { useAuth } from "../../hooks/useAuth";
import { useMergeSubmission } from "../../hooks/useMergeSubmission";
import AssignDropdown from "./AssignDropdown";
import PriorityDropdown from "./PriorityDropdown";
import PublicReplySection from "./PublicReplySection";
import { InternalDiscussion } from "../dashboard/InternalDiscussion";
import { MergeModal } from "../dashboard/MergeModal";
import { updateSubmissionStatus, addAuditLog } from "../../lib/firestore";
import { formatDate } from "../../lib/utils";

interface SubmissionDetailProps {
  submission: Submission;
  onClose: () => void;
  onUpdated?: () => void;
}

function StatusBadge({ status, t }: { status: Submission["status"]; t: (key: string) => string }) {
  const map: Record<Submission["status"], { labelKey: string; cls: string }> = {
    received: { labelKey: "detail.received", cls: "bg-[#f5e6df] text-[#9c4a2f]" },
    in_review: { labelKey: "detail.in_review", cls: "bg-[#FFF3CD] text-[#856404]" },
    in_progress: { labelKey: "detail.in_progress", cls: "bg-[#FFF8E6] text-[#B06F00]" },
    escalated: { labelKey: "detail.escalated", cls: "bg-[#FDECEA] text-[#C0392B]" },
    resolved: { labelKey: "detail.resolved", cls: "bg-[#EAF9F2] text-[#1D8A57]" },
    closed: { labelKey: "detail.closed", cls: "bg-[#f2ece6] text-[#78716c]" },
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
      <div className="h-full w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#e9e0d9] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#78716c]">{t('detail.merged_submission')}</p>
            <h3 className="mt-1 text-lg font-bold text-[#1c1917]">{submission.subject}</h3>
            <p className="font-mono text-xs text-[#c0694a]">{submission.trackingCode}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#8f8680] hover:bg-[#ece5de] hover:text-[#3c3632]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div className="rounded-xl bg-[#F1EFE8] px-3 py-2 text-xs font-semibold text-[#5F5E5A]">{t('detail.read_only_merged')}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-[#8f8680]">{t('detail.category')}</p><p className="font-semibold text-[#3c3632]">{submission.category}</p></div>
            <div><p className="text-xs text-[#8f8680]">{t('status')}</p><StatusBadge status={submission.status} t={t} /></div>
            <div><p className="text-xs text-[#8f8680]">{t('detail.submitted')}</p><p className="font-semibold text-[#3c3632]">{formatDate(submission.createdAt.toDate())}</p></div>
            <div><p className="text-xs text-[#8f8680]">{t('detail.merged_recently')}</p><p className="font-semibold text-[#3c3632]">{submission.mergedAt ? formatDate(submission.mergedAt.toDate()) : ""}</p></div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8f8680]">Description</p>
            <p className="whitespace-pre-wrap rounded-xl border border-[#e9e0d9] bg-[#FAFAFA] p-4 leading-relaxed text-[#3c3632]">{submission.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportSubmissionCSV(submission: Submission, t: (key: string) => string) {
  const rows = [
    [t("detail.csv_field"), t("detail.csv_value")],
    [t("detail.csv_tracking_code"), submission.trackingCode],
    [t("detail.csv_subject"), submission.subject],
    [t("detail.csv_category"), submission.category],
    [t("detail.csv_status"), submission.status],
    [t("detail.csv_priority"), submission.priority],
    [t("detail.csv_location"), submission.location ?? ""],
    [t("detail.csv_description"), `"${submission.description.replace(/"/g, '""')}"`],
    [t("detail.csv_submitter_email"), submission.submitterEmail ?? t("detail.anonymous")],
    [t("detail.csv_submitter_name"), submission.submitterName ?? ""],
    [t("detail.csv_submitter_mobile"), submission.submitterMobile ?? ""],
    [t("detail.csv_anonymous"), submission.isAnonymous ? t("yes") : t("no")],
    [t("detail.csv_submitted"), submission.createdAt.toDate().toISOString()],
    [t("detail.csv_last_updated"), submission.updatedAt.toDate().toISOString()],
    [t("detail.csv_attachments"), String(submission.attachments?.length ?? 0)],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadTextFile(csv, `submission-${submission.trackingCode}.csv`, 'text/csv;charset=utf-8;');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e9e0d9] px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={submission.status} t={t} />
              <span className="font-mono text-xs text-[#8f8680] bg-[#ece5de] px-2 py-0.5 rounded">
                {submission.trackingCode}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1c1917] mt-1 truncate">
              {submission.subject}
            </h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share */}
            <button
              onClick={handleCopyTrackingLink}
              className="p-2 text-[#8f8680] hover:text-[#c0694a] hover:bg-[#f5e6df] rounded-lg transition-colors"
              title={t("detail.copy_tracking_link")}
            >
              {copied ? <Check size={18} className="text-[#1D8A57]" /> : <Share2 size={18} />}
            </button>
            {/* Export CSV */}
            <button
              onClick={() => exportSubmissionCSV(submission, t)}
              className="p-2 text-[#8f8680] hover:text-[#c0694a] hover:bg-[#f5e6df] rounded-lg transition-colors"
              title={t("detail.export_as_csv")}
            >
              <Download size={18} />
            </button>
            {/* Track in new tab */}
            <a
              href={`/track/${submission.trackingCode.replace(/^#/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#8f8680] hover:text-[#c0694a] hover:bg-[#f5e6df] rounded-lg transition-colors"
              title={t("detail.open_tracking_page")}
            >
              <ExternalLink size={18} />
            </a>
            <div className="relative">
              <button
                onClick={() => setActionsOpen((open) => !open)}
                className="p-2 text-[#8f8680] hover:text-[#c0694a] hover:bg-[#f5e6df] rounded-lg transition-colors"
                title={t("detail.more_actions")}
                aria-label={t("detail.more_actions")}
              >
                <MoreVertical size={18} />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-lg border border-[#e9e0d9] bg-white shadow-lg">
                  <button
                    type="button"
                    disabled={submission.isMerged}
                    onClick={() => {
                      setActionsOpen(false);
                      setMergeModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#78716c] transition hover:bg-[#f5f0ec] hover:text-[#1c1917] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GitMerge size={15} />
                    {t("detail.merge_with_another")}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#8f8680] hover:text-[#3c3632] hover:bg-[#ece5de] rounded-lg transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-2">
                {t('status')}
              </label>
              <select
                value={submission.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as Submission["status"])
                }
                disabled={loading}
                className="w-full px-3 py-2 border border-[#d6cabf] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c0694a] bg-white"
              >
                <option value="received">{t('detail.received')}</option>
                <option value="in_review">{t('detail.in_review')}</option>
                <option value="in_progress">{t('detail.in_progress')}</option>
                <option value="escalated">{t('detail.escalated')}</option>
                <option value="resolved">{t('detail.resolved')}</option>
                <option value="closed">{t('detail.closed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-2">
                {t('detail.priority')}
              </label>
              <PriorityDropdown
                submissionId={submission.id}
                currentPriority={submission.priority}
                onUpdated={onUpdated}
              />
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-[#faf8f5] border border-[#ece2da] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
              {t('detail.assigned_to')}
            </label>
            <p className="text-xs text-[#78716c] mb-3">
              {t('detail.assign_help')}
            </p>
            <AssignDropdown
              submissionId={submission.id}
              assignedToId={submission.assignedTo}
              onAssigned={onUpdated}
            />
          </div>

          {submission.isMerged && (
            <div className="rounded-xl border border-[#d6cabf] bg-[#F1EFE8] p-4 text-sm text-[#5F5E5A]">
              {t('detail.merged_notice')}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-2">
              {t('description')}
            </label>
            <div className="bg-[#FAFAFA] border border-[#e9e0d9] rounded-xl p-4">
              <p className="text-[#3c3632] whitespace-pre-wrap text-sm leading-relaxed">
                {submission.description}
              </p>
            </div>
          </div>

          {/* Submitter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                {t('detail.category')}
              </label>
              <p className="text-[#3c3632]">{submission.category}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                {t('detail.submitted')}
              </label>
              <p className="text-[#3c3632]">
                {formatDate(submission.createdAt.toDate())}
              </p>
            </div>
            {submission.location && (
              <div>
                <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                  {t('detail.location')}
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1ebe5] px-2.5 py-1 text-xs font-medium text-[#78716c]">
                  <MapPin size={12} />
                  {submission.location}
                </span>
              </div>
            )}
            {submission.isAnonymous ? (
              <div>
                <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                  {t('detail.identity')}
                </label>
                <span className="inline-flex items-center gap-1 text-xs bg-[#f2ece6] text-[#78716c] px-2 py-1 rounded-full">
                  {t('detail.anonymous')}
                </span>
              </div>
            ) : (
              <>
                {submission.submitterEmail && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                      {t('detail.submitter_email')}
                    </label>
                    <p className="text-[#3c3632]">{submission.submitterEmail}</p>
                  </div>
                )}
                {submission.submitterName && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                      {t('name')}
                    </label>
                    <p className="text-[#3c3632]">{submission.submitterName}</p>
                  </div>
                )}
                {submission.submitterMobile && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-1">
                      {t('detail.mobile')}
                    </label>
                    <p className="text-[#3c3632]">{submission.submitterMobile}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attachments — visible to admins */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div className="border-t border-[#e9e0d9] pt-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-[#c0694a]" />
                <label className="text-xs font-semibold text-[#8f8680] uppercase tracking-wide">
                  Attachments ({submission.attachments.length})
                </label>
              </div>
              <AttachmentGallery
                attachments={submission.attachments}
                onDownload={(attachment) => downloadFile(submission.id, attachment)}
                onView={handleViewFile}
                loading={downloading}
              />
            </div>
          )}

          {/* Inline file preview */}
          {previewUrl && (
            <div className="border border-[#e9e0d9] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#ece5de] border-b border-[#e9e0d9]">
                <span className="text-xs font-medium text-[#78716c] flex items-center gap-1">
                  <Eye size={13} />
                  {t('detail.file_preview')}
                </span>
                <div className="flex gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#c0694a] hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    {t('detail.open_new_tab')}
                  </a>
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="text-xs text-[#8f8680] hover:text-[#3c3632]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <iframe
                src={previewUrl}
                className="w-full h-72 border-0"
                title="Attachment preview"
              />
            </div>
          )}

          {mergedSubmissions.length > 0 && (
            <div className="rounded-xl border border-[#e9e0d9] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <GitMerge size={16} className="text-[#c0694a]" />
                <h3 className="text-sm font-bold text-[#1c1917]">{t('detail.merged_submissions')}</h3>
              </div>
              <div className="space-y-2">
                {mergedSubmissions.map((merged) => (
                  <button
                    key={merged.id}
                    type="button"
                    onClick={() => setReadOnlySubmission(merged)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#e9e0d9] px-3 py-2 text-left transition hover:bg-[#f5f0ec]"
                  >
                    <span className="min-w-0 text-sm text-[#3c3632]">
                      <span className="font-mono font-semibold text-[#c0694a]">{merged.trackingCode}</span>
                      <span> — {merged.category} — {formatMergedAt(merged, t)}</span>
                    </span>
                    <span className="flex-shrink-0 text-xs font-semibold text-[#c0694a]">{t('detail.open')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Share link */}
          <div className="bg-[#faf8f5] border border-[#ece2da] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#8f8680] uppercase tracking-wide mb-2">
              {t('detail.submitter_tracking_link')}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-[#c0694a] bg-white border border-[#e9e0d9] px-3 py-2 rounded-lg truncate">
                {window.location.origin}/track/{submission.trackingCode.replace(/^#/, '')}
              </code>
              <button
                onClick={handleCopyTrackingLink}
                className="p-2 text-[#8f8680] hover:text-[#c0694a] hover:bg-white border border-[#e9e0d9] rounded-lg transition-colors flex-shrink-0"
                title={t("detail.copy_link")}
              >
                {copied ? (
                  <Check size={16} className="text-[#1D8A57]" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <p className="text-xs text-[#8f8680] mt-1.5">
              {t('detail.share_link_desc')}
            </p>
          </div>

          {/* Export options */}
          <div className="flex gap-2">
            <button
              onClick={() => exportSubmissionCSV(submission, t)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#c0694a] bg-[#f5e6df] hover:bg-[#f0dcd0] rounded-xl transition-colors"
            >
              <Download size={15} />
              {t('detail.export_csv')}
            </button>
            <a
              href={`/track/${submission.trackingCode.replace(/^#/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#78716c] bg-[#ece5de] hover:bg-[#e9e0d9] rounded-xl transition-colors"
            >
              <ExternalLink size={15} />
              {t('detail.public_tracking_page')}
            </a>
          </div>

          {/* Internal Discussion */}
          <div className="border-t border-[#e9e0d9] pt-5">
            <InternalDiscussion
              submission={submission}
              currentUser={user}
              onMigrated={onUpdated}
            />
          </div>

          {/* Public Reply */}
          <div className="border-t border-[#e9e0d9] pt-5">
            <PublicReplySection
              submissionId={submission.id}
              publicReply={submission.publicReply}
              publicReplyAt={submission.publicReplyAt}
              publicReplyBy={submission.publicReplyBy}
              onReplyAdded={onUpdated}
              submission={submission}
            />
          </div>

          {/* Close */}
          <div className="pt-2 border-t border-[#e9e0d9]">
            <Button variant="secondary" fullWidth onClick={onClose}>
              {t('close')}
            </Button>
          </div>
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
        <MergedSubmissionPreview
          submission={readOnlySubmission}
          onClose={() => setReadOnlySubmission(null)}
          t={t}
        />
      )}
    </div>
  );
}

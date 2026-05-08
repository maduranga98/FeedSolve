import { downloadTextFile } from '../../lib/download';
import { useEffect, useState } from "react";
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

function StatusBadge({ status }: { status: Submission["status"] }) {
  const map: Record<Submission["status"], { label: string; cls: string }> = {
    received: { label: "Received", cls: "bg-[#EBF5FB] text-[#1E6A9A]" },
    in_review: { label: "In Review", cls: "bg-[#FFF3CD] text-[#856404]" },
    in_progress: { label: "In Progress", cls: "bg-[#FFF8E6] text-[#B06F00]" },
    escalated: { label: "Escalated", cls: "bg-[#FDECEA] text-[#C0392B]" },
    resolved: { label: "Resolved", cls: "bg-[#EAF9F2] text-[#1D8A57]" },
    closed: { label: "Closed", cls: "bg-[#F0F4F8] text-[#6B7B8D]" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function formatMergedAt(submission: Submission) {
  if (!submission.mergedAt) return "merged recently";
  const diffMs = Date.now() - submission.mergedAt.toDate().getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `merged ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `merged ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `merged ${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) === 1 ? "" : "s"} ago`;
}

function MergedSubmissionPreview({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-end bg-black/40 p-4">
      <div className="h-full w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#E8ECF0] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7B8D]">Merged submission</p>
            <h3 className="mt-1 text-lg font-bold text-[#1E3A5F]">{submission.subject}</h3>
            <p className="font-mono text-xs text-[#2E86AB]">{submission.trackingCode}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#9AABBF] hover:bg-[#E1E8EF] hover:text-[#444441]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div className="rounded-xl bg-[#F1EFE8] px-3 py-2 text-xs font-semibold text-[#5F5E5A]">Read-only merged record</div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-[#9AABBF]">Category</p><p className="font-semibold text-[#444441]">{submission.category}</p></div>
            <div><p className="text-xs text-[#9AABBF]">Status</p><StatusBadge status={submission.status} /></div>
            <div><p className="text-xs text-[#9AABBF]">Submitted</p><p className="font-semibold text-[#444441]">{formatDate(submission.createdAt.toDate())}</p></div>
            <div><p className="text-xs text-[#9AABBF]">Merged</p><p className="font-semibold text-[#444441]">{submission.mergedAt ? formatDate(submission.mergedAt.toDate()) : "Recently"}</p></div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9AABBF]">Description</p>
            <p className="whitespace-pre-wrap rounded-xl border border-[#E8ECF0] bg-[#FAFAFA] p-4 leading-relaxed text-[#444441]">{submission.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportSubmissionCSV(submission: Submission) {
  const rows = [
    ["Field", "Value"],
    ["Tracking Code", submission.trackingCode],
    ["Subject", submission.subject],
    ["Category", submission.category],
    ["Status", submission.status],
    ["Priority", submission.priority],
    ["Location", submission.location ?? ""],
    ["Description", `"${submission.description.replace(/"/g, '""')}"`],
    ["Submitter Email", submission.submitterEmail ?? "Anonymous"],
    ["Submitter Name", submission.submitterName ?? ""],
    ["Submitter Mobile", submission.submitterMobile ?? ""],
    ["Anonymous", submission.isAnonymous ? "Yes" : "No"],
    ["Submitted", submission.createdAt.toDate().toISOString()],
    ["Last Updated", submission.updatedAt.toDate().toISOString()],
    ["Attachments", String(submission.attachments?.length ?? 0)],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadTextFile(csv, `submission-${submission.trackingCode}.csv`, 'text/csv;charset=utf-8;');
}

export default function SubmissionDetail({
  submission,
  onClose,
  onUpdated,
}: SubmissionDetailProps) {
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
      alert("Failed to update status");
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
        <div className="sticky top-0 bg-white border-b border-[#E8ECF0] px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={submission.status} />
              <span className="font-mono text-xs text-[#9AABBF] bg-[#E1E8EF] px-2 py-0.5 rounded">
                {submission.trackingCode}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1E3A5F] mt-1 truncate">
              {submission.subject}
            </h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share */}
            <button
              onClick={handleCopyTrackingLink}
              className="p-2 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] rounded-lg transition-colors"
              title="Copy tracking link"
            >
              {copied ? <Check size={18} className="text-[#1D8A57]" /> : <Share2 size={18} />}
            </button>
            {/* Export CSV */}
            <button
              onClick={() => exportSubmissionCSV(submission)}
              className="p-2 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] rounded-lg transition-colors"
              title="Export as CSV"
            >
              <Download size={18} />
            </button>
            {/* Track in new tab */}
            <a
              href={`/track/${submission.trackingCode.replace(/^#/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] rounded-lg transition-colors"
              title="Open tracking page"
            >
              <ExternalLink size={18} />
            </a>
            <div className="relative">
              <button
                onClick={() => setActionsOpen((open) => !open)}
                className="p-2 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] rounded-lg transition-colors"
                title="More actions"
                aria-label="More actions"
              >
                <MoreVertical size={18} />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-lg border border-[#E8ECF0] bg-white shadow-lg">
                  <button
                    type="button"
                    disabled={submission.isMerged}
                    onClick={() => {
                      setActionsOpen(false);
                      setMergeModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#6B7B8D] transition hover:bg-[#F1F5F8] hover:text-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GitMerge size={15} />
                    Merge with another
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#9AABBF] hover:text-[#444441] hover:bg-[#E1E8EF] rounded-lg transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                value={submission.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as Submission["status"])
                }
                disabled={loading}
                className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
              >
                <option value="received">Received</option>
                <option value="in_review">In Review</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-2">
                Priority
              </label>
              <PriorityDropdown
                submissionId={submission.id}
                currentPriority={submission.priority}
                onUpdated={onUpdated}
              />
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-[#F8FBFD] border border-[#E4ECF3] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
              Assigned To
            </label>
            <p className="text-xs text-[#6B7B8D] mb-3">
              Assign this submission to a team member so ownership is clear.
            </p>
            <AssignDropdown
              submissionId={submission.id}
              assignedToId={submission.assignedTo}
              onAssigned={onUpdated}
            />
          </div>

          {submission.isMerged && (
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8] p-4 text-sm text-[#5F5E5A]">
              This submission has been merged into another master submission and is kept here as a read-only archive reference.
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-2">
              Description
            </label>
            <div className="bg-[#FAFAFA] border border-[#E8ECF0] rounded-xl p-4">
              <p className="text-[#444441] whitespace-pre-wrap text-sm leading-relaxed">
                {submission.description}
              </p>
            </div>
          </div>

          {/* Submitter Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                Category
              </label>
              <p className="text-[#444441]">{submission.category}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                Submitted
              </label>
              <p className="text-[#444441]">
                {formatDate(submission.createdAt.toDate())}
              </p>
            </div>
            {submission.location && (
              <div>
                <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                  Location
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF3F6] px-2.5 py-1 text-xs font-medium text-[#6B7B8D]">
                  <MapPin size={12} />
                  {submission.location}
                </span>
              </div>
            )}
            {submission.isAnonymous ? (
              <div>
                <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                  Identity
                </label>
                <span className="inline-flex items-center gap-1 text-xs bg-[#F0F4F8] text-[#6B7B8D] px-2 py-1 rounded-full">
                  Anonymous
                </span>
              </div>
            ) : (
              <>
                {submission.submitterEmail && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                      Submitter Email
                    </label>
                    <p className="text-[#444441]">{submission.submitterEmail}</p>
                  </div>
                )}
                {submission.submitterName && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                      Name
                    </label>
                    <p className="text-[#444441]">{submission.submitterName}</p>
                  </div>
                )}
                {submission.submitterMobile && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-1">
                      Mobile
                    </label>
                    <p className="text-[#444441]">{submission.submitterMobile}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attachments — visible to admins */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div className="border-t border-[#E8ECF0] pt-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-[#2E86AB]" />
                <label className="text-xs font-semibold text-[#9AABBF] uppercase tracking-wide">
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
            <div className="border border-[#E8ECF0] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#E1E8EF] border-b border-[#E8ECF0]">
                <span className="text-xs font-medium text-[#6B7B8D] flex items-center gap-1">
                  <Eye size={13} />
                  File Preview
                </span>
                <div className="flex gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2E86AB] hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Open in new tab
                  </a>
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="text-xs text-[#9AABBF] hover:text-[#444441]"
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
            <div className="rounded-xl border border-[#E8ECF0] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <GitMerge size={16} className="text-[#2E86AB]" />
                <h3 className="text-sm font-bold text-[#1E3A5F]">Merged submissions</h3>
              </div>
              <div className="space-y-2">
                {mergedSubmissions.map((merged) => (
                  <button
                    key={merged.id}
                    type="button"
                    onClick={() => setReadOnlySubmission(merged)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#E8ECF0] px-3 py-2 text-left transition hover:bg-[#F1F5F8]"
                  >
                    <span className="min-w-0 text-sm text-[#444441]">
                      <span className="font-mono font-semibold text-[#2E86AB]">{merged.trackingCode}</span>
                      <span> — {merged.category} — {formatMergedAt(merged)}</span>
                    </span>
                    <span className="flex-shrink-0 text-xs font-semibold text-[#2E86AB]">Open</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Share link */}
          <div className="bg-[#F8FBFD] border border-[#E4ECF3] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#9AABBF] uppercase tracking-wide mb-2">
              Submitter Tracking Link
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-[#2E86AB] bg-white border border-[#E8ECF0] px-3 py-2 rounded-lg truncate">
                {window.location.origin}/track/{submission.trackingCode.replace(/^#/, '')}
              </code>
              <button
                onClick={handleCopyTrackingLink}
                className="p-2 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-white border border-[#E8ECF0] rounded-lg transition-colors flex-shrink-0"
                title="Copy link"
              >
                {copied ? (
                  <Check size={16} className="text-[#1D8A57]" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <p className="text-xs text-[#9AABBF] mt-1.5">
              Share this link with the submitter so they can track their submission status.
            </p>
          </div>

          {/* Export options */}
          <div className="flex gap-2">
            <button
              onClick={() => exportSubmissionCSV(submission)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#2E86AB] bg-[#EBF5FB] hover:bg-[#D6EEFA] rounded-xl transition-colors"
            >
              <Download size={15} />
              Export CSV
            </button>
            <a
              href={`/track/${submission.trackingCode.replace(/^#/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#6B7B8D] bg-[#E1E8EF] hover:bg-[#E8ECF0] rounded-xl transition-colors"
            >
              <ExternalLink size={15} />
              Public Tracking Page
            </a>
          </div>

          {/* Internal Discussion */}
          <div className="border-t border-[#E8ECF0] pt-5">
            <InternalDiscussion
              submission={submission}
              currentUser={user}
              onMigrated={onUpdated}
            />
          </div>

          {/* Public Reply */}
          <div className="border-t border-[#E8ECF0] pt-5">
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
          <div className="pt-2 border-t border-[#E8ECF0]">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Close
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
        />
      )}
    </div>
  );
}

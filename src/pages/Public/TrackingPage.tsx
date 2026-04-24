import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { getSubmissionByTrackingCode, getBoard, getCompany } from "../../lib/firestore";
import { applyBrandColors } from "../../lib/color-utils";
import { AttachmentGallery } from "../../components/Attachments";
import { useFileDownload } from "../../hooks/useFileDownload";
import type { Submission, Board, Company } from "../../types";
import { Badge, LoadingSpinner, Button, Input } from "../../components/Shared";
import { formatDate, getStatusLabel } from "../../lib/utils";
import {
  Lock,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  ArrowLeft,
  Paperclip,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";

const STATUS_STEPS = [
  { key: "received", label: "Received", description: "Your feedback was submitted" },
  { key: "in_review", label: "In Review", description: "Our team is reviewing it" },
  { key: "in_progress", label: "In Progress", description: "Actively being worked on" },
  { key: "resolved", label: "Resolved", description: "Issue addressed" },
] as const;

function getStepIndex(status: string): number {
  if (status === "received") return 0;
  if (status === "in_review") return 1;
  if (status === "in_progress") return 2;
  if (status === "resolved" || status === "closed") return 3;
  return 0;
}

const PRIORITY_COLOR: Record<string, string> = {
  low: "text-[#2E86AB] bg-[#EBF5FB]",
  medium: "text-[#B06F00] bg-[#FFF8E6]",
  high: "text-[#C0392B] bg-[#FDECEA]",
};

export function TrackingPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { loading: downloading, downloadFile, viewFile } = useFileDownload();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordAuthenticated, setPasswordAuthenticated] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!code) { setLoading(false); return; }
      try {
        const data = await getSubmissionByTrackingCode(code);
        if (data) {
          setSubmission(data);
          try {
            const boardData = await getBoard(data.boardId);
            if (boardData) {
              setBoard(boardData);
              if (boardData.accessPassword) setPasswordRequired(true);
              try {
                const companyData = await getCompany(boardData.companyId);
                if (companyData) setCompany(companyData);
              } catch { /* non-critical */ }
            }
          } catch { /* non-critical */ }
        } else {
          setError("Submission not found. Please check your tracking code.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch submission");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [code]);

  // Apply brand colors when company data is available
  useEffect(() => {
    if (company?.branding) {
      const root = document.getElementById("tracking-root");
      if (root) applyBrandColors(root, company.branding.primaryColor, company.branding.secondaryColor);
    }
  }, [company]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 bg-[#FDECEA] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-[#C0392B]" />
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F] mb-2">Tracking Not Found</h1>
          <p className="text-sm text-[#6B7B8D] mb-6">
            {error || "The tracking code you entered does not match any submission. Please double-check and try again."}
          </p>
          <Button variant="secondary" onClick={() => navigate(-1)} className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (passwordRequired && !passwordAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="w-14 h-14 bg-[#FFF3CD] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-[#F39C12]" />
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F] mb-1 text-center">Password Protected</h1>
          <p className="text-sm text-[#6B7B8D] text-center mb-6">
            Enter the password to view this submission.
          </p>
          {passwordError && (
            <div className="mb-4 p-3 bg-[#FDECEA] border border-[#FADBD8] rounded-xl">
              <p className="text-sm text-[#C0392B]">{passwordError}</p>
            </div>
          )}
          <form
            onSubmit={e => {
              e.preventDefault();
              setPasswordError(null);
              if (!board?.accessPassword || passwordInput === board.accessPassword) {
                setPasswordAuthenticated(true);
                sessionStorage.setItem(`tracking_auth_${code}`, "true");
              } else {
                setPasswordError("Incorrect password. Please try again.");
              }
            }}
            className="space-y-3"
          >
            <Input type="password" placeholder="Enter password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus />
            <Button type="submit" variant="primary" size="lg" className="w-full">Unlock</Button>
          </form>
        </div>
      </div>
    );
  }

  const branding = company?.branding;
  const companyName = branding?.companyName || company?.name || board?.name || "";
  const currentStep = getStepIndex(submission.status);
  const isClosed = submission.status === "closed";

  const timelineEvents = [
    { date: submission.createdAt, label: "Submitted", icon: "submit" },
    submission.status !== "received" && submission.status !== "new"
      ? { date: submission.updatedAt, label: "Updated", icon: "update" }
      : null,
    (submission.status === "resolved" || submission.status === "closed") && submission.resolvedAt
      ? { date: submission.resolvedAt, label: "Resolved", icon: "resolve" }
      : null,
  ].filter(Boolean) as { date: Timestamp; label: string; icon: string }[];

  return (
    <div id="tracking-root" className="min-h-screen bg-[#F4F7FA] py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Top nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-[#E8ECF0] text-[#6B7B8D] hover:text-[#1E3A5F] hover:border-[#C8D8E4] transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs text-[#9AABBF] font-medium uppercase tracking-wide">Tracking</p>
            <p className="text-sm font-bold text-[#1E3A5F] font-mono">{code}</p>
          </div>
        </div>

        {/* Company brand card */}
        {companyName && (
          <div className="bg-white rounded-2xl border border-[#E8ECF0] shadow-sm px-5 py-4 flex items-center gap-3">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={companyName} className="h-10 w-10 rounded-xl object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-[#EBF5FB] flex items-center justify-center text-base font-bold text-[#2E86AB]">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-[#1E3A5F]">{companyName}</p>
              {branding?.slogan && <p className="text-xs text-[#6B7B8D]">{branding.slogan}</p>}
            </div>
            <div className="ml-auto">
              <Badge status={submission.status} />
            </div>
          </div>
        )}

        {/* Progress stepper */}
        <div className="bg-white rounded-2xl border border-[#E8ECF0] shadow-sm px-6 py-6">
          <h2 className="text-sm font-semibold text-[#1E3A5F] mb-5">Progress</h2>
          <div className="flex items-start gap-0">
            {STATUS_STEPS.map((s, i) => {
              const done = i < currentStep || (i === currentStep && (isClosed || submission.status === 'resolved'));
              const active = i === currentStep && !isClosed && submission.status !== 'resolved';
              const upcoming = i > currentStep;

              return (
                <div key={s.key} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 ${
                        i < currentStep ? "bg-[#2E86AB]" : "bg-[#E8ECF0]"
                      }`}
                      style={{ transform: "translateX(0)" }}
                    />
                  )}

                  {/* Step dot */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
                      done
                        ? "bg-[#2E86AB] border-[#2E86AB] text-white"
                        : active
                        ? "bg-white border-[#2E86AB] text-[#2E86AB]"
                        : "bg-white border-[#D8E4EE] text-[#C8D8E4]"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={14} />
                    ) : active ? (
                      <Clock size={13} className="animate-pulse" />
                    ) : (
                      <Circle size={12} />
                    )}
                  </div>

                  {/* Labels */}
                  <p
                    className={`text-xs font-semibold text-center leading-tight ${
                      done ? "text-[#2E86AB]" : active ? "text-[#1E3A5F]" : "text-[#9AABBF]"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className={`text-xs text-center mt-0.5 hidden sm:block ${upcoming ? "text-[#C8D8E4]" : "text-[#9AABBF]"}`}>
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Status message */}
          <div
            className={`mt-5 rounded-xl px-4 py-3 text-sm leading-relaxed ${
              submission.status === "resolved" || submission.status === "closed"
                ? "bg-[#EAF9F2] text-[#1D6B45]"
                : "bg-[#EBF5FB] text-[#1E6A9A]"
            }`}
          >
            {
              {
                received: "Your feedback has been received. Our team will review it shortly.",
                in_review: "We're reviewing your feedback. Thanks for your patience.",
                in_progress: "We're actively working on your feedback. Updates coming soon.",
                resolved: "Your feedback has been resolved. Thank you for helping us improve!",
                closed: "This submission has been closed.",
              }[submission.status] ?? "Thank you for your feedback."
            }
          </div>
        </div>

        {/* Submission details */}
        <div className="bg-white rounded-2xl border border-[#E8ECF0] shadow-sm px-6 py-6">
          <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">{submission.subject}</h2>
          <p className="text-sm text-[#444441] leading-relaxed whitespace-pre-wrap mb-5">
            {submission.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#F8FAFB] px-3 py-2.5">
              <p className="text-xs text-[#9AABBF] uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
                <Tag size={10} />Category
              </p>
              <p className="text-sm font-semibold text-[#1E3A5F]">{submission.category}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFB] px-3 py-2.5">
              <p className="text-xs text-[#9AABBF] uppercase tracking-wide font-medium mb-1">Priority</p>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  PRIORITY_COLOR[submission.priority] || "text-[#6B7B8D] bg-[#F4F7FA]"
                }`}
              >
                {submission.priority}
              </span>
            </div>
            <div className="rounded-xl bg-[#F8FAFB] px-3 py-2.5">
              <p className="text-xs text-[#9AABBF] uppercase tracking-wide font-medium mb-1">Status</p>
              <p className="text-sm font-semibold text-[#1E3A5F]">{getStatusLabel(submission.status)}</p>
            </div>
          </div>
        </div>

        {/* Public reply */}
        {submission.publicReply && (
          <div className="bg-[#EAF9F2] border border-[#A8DFC4] rounded-2xl shadow-sm px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-[#1D8A57]" />
              <h2 className="text-sm font-bold text-[#1D6B45]">
                Response from {submission.publicReplyBy}
              </h2>
              {submission.publicReplyAt && (
                <span className="ml-auto text-xs text-[#2C8C5A]">
                  {formatDate(submission.publicReplyAt.toDate())}
                </span>
              )}
            </div>
            <p className="text-sm text-[#1D6B45] leading-relaxed whitespace-pre-wrap">
              {submission.publicReply}
            </p>
          </div>
        )}

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8ECF0] shadow-sm px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip size={14} className="text-[#6B7B8D]" />
              <h2 className="text-sm font-semibold text-[#1E3A5F]">Attachments</h2>
            </div>
            <AttachmentGallery
              attachments={submission.attachments}
              onDownload={attachment => downloadFile(submission.id, attachment)}
              onView={attachment => viewFile(submission.id, attachment)}
              loading={downloading}
            />
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-[#E8ECF0] shadow-sm px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-[#6B7B8D]" />
            <h2 className="text-sm font-semibold text-[#1E3A5F]">Timeline</h2>
          </div>
          <div className="space-y-4">
            {timelineEvents.map((event, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex flex-col items-center pt-0.5">
                  <div className="w-7 h-7 rounded-full bg-[#EBF5FB] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} className="text-[#2E86AB]" />
                  </div>
                  {index < timelineEvents.length - 1 && (
                    <div className="w-px h-6 bg-[#DDEAF2] mt-1" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E3A5F]">{event.label}</p>
                  <p className="text-xs text-[#9AABBF] mt-0.5">{formatDate(event.date.toDate())}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#C8D8E4] pb-2">
          Powered by FeedSolve
        </p>
      </div>
    </div>
  );
}

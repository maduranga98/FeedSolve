import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { getSubmissionByTrackingCode, getBoard } from "../../lib/firestore";
import { AttachmentGallery } from "../../components/Attachments";
import { useFileDownload } from "../../hooks/useFileDownload";
import type { Submission, Board } from "../../types";
import { Badge, LoadingSpinner, Button, Input } from "../../components/Shared";
import { formatDate, getStatusLabel } from "../../lib/utils";
import { Clock, CheckCircle, Lock } from "lucide-react";

export function TrackingPage() {
  const { code } = useParams<{ code: string }>();
  const { loading: downloading, downloadFile } = useFileDownload();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordAuthenticated, setPasswordAuthenticated] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!code) {
        setLoading(false);
        return;
      }

      try {
        const data = await getSubmissionByTrackingCode(code);
        if (data) {
          setSubmission(data);
          // Fetch board to check if it has a password
          try {
            const boardData = await getBoard(data.boardId);
            if (boardData) {
              setBoard(boardData);
              if (boardData.accessPassword) {
                setPasswordRequired(true);
              }
            }
          } catch (boardError) {
            console.error("Failed to fetch board:", boardError);
          }
        } else {
          setError("Submission not found. Please check your tracking code.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch submission",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [code]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!board?.accessPassword) {
      setPasswordAuthenticated(true);
      return;
    }

    if (passwordInput === board.accessPassword) {
      setPasswordAuthenticated(true);
      // Store in sessionStorage so they don't need to enter again
      sessionStorage.setItem(`tracking_auth_${code}`, "true");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-4">
            Tracking Not Found
          </h1>
          <p className="text-[#6B7B8D]">
            {error ||
              "The submission you are looking for does not exist or the tracking code is incorrect."}
          </p>
        </div>
      </div>
    );
  }

  // Show password prompt if board is password-protected and user hasn't authenticated
  if (passwordRequired && !passwordAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-center w-12 h-12 bg-[#FFF3CD] rounded-full mx-auto mb-6">
            <Lock size={24} className="text-[#F39C12]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2 text-center">
            Password Protected
          </h1>
          <p className="text-[#6B7B8D] text-center mb-6">
            This submission is password protected. Please enter the password to
            view.
          </p>

          {passwordError && (
            <div className="mb-4 p-3 bg-[#FFE5E5] border border-[#E74C3C] rounded-lg">
              <p className="text-sm text-[#E74C3C]">{passwordError}</p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Unlock
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const statusMessages: Record<string, string> = {
    received:
      "Your feedback has been received. Thank you for submitting! Our team will review it shortly.",
    in_review:
      "Your feedback is currently being reviewed by our team. We appreciate your input.",
    in_progress:
      "We are actively working on your feedback. Updates coming soon.",
    resolved:
      "Your feedback has been resolved! Check out the details below to learn what changed.",
    closed: "This feedback has been closed.",
  };

  const timelineEvents = [
    {
      date: submission.createdAt,
      label: "Submitted",
      status: true,
    },
    {
      date: submission.updatedAt,
      label: "Updated",
      status: submission.status !== "received",
    },
    {
      date: submission.resolvedAt,
      label: "Resolved",
      status:
        submission.status === "resolved" || submission.status === "closed",
    },
  ].filter(
    (e): e is { date: Timestamp; label: string; status: boolean } =>
      e.date !== undefined,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFB] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
                  {submission.subject}
                </h1>
                <p className="text-[#6B7B8D]">{submission.trackingCode}</p>
              </div>
              <Badge status={submission.status} />
            </div>

            <p className="text-[#444441] whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          <div className="border-t border-[#D3D1C7] pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#6B7B8D] mb-1">Category</p>
                <p className="font-medium text-[#1E3A5F]">
                  {submission.category}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7B8D] mb-1">Priority</p>
                <p className="font-medium text-[#1E3A5F] capitalize">
                  {submission.priority}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7B8D] mb-1">Status</p>
                <p className="font-medium text-[#1E3A5F]">
                  {getStatusLabel(submission.status)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-[#1E3A5F] mb-6">
            Status Message
          </h2>
          <p className="text-[#444441] leading-relaxed">
            {statusMessages[submission.status]}
          </p>
        </div>

        {submission.attachments && submission.attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <AttachmentGallery
              attachments={submission.attachments}
              onDownload={(attachment) =>
                downloadFile(submission.id, attachment)
              }
              loading={downloading}
            />
          </div>
        )}

        {submission.publicReply && (
          <div className="bg-[#EBF9F1] border border-[#27AE60] rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-bold text-[#0F6E56] mb-2">
              Response from {submission.publicReplyBy}
            </h2>
            {submission.publicReplyAt && (
              <p className="text-sm text-[#0F6E56] mb-4">
                {formatDate(submission.publicReplyAt.toDate())}
              </p>
            )}
            <p className="text-[#0F6E56] leading-relaxed whitespace-pre-wrap">
              {submission.publicReply}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#1E3A5F] mb-6">Timeline</h2>

          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.status
                        ? "bg-[#27AE60] text-white"
                        : "bg-[#EFF3F6] text-[#6B7B8D]"
                    }`}
                  >
                    {event.status ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  {index < timelineEvents.length - 1 && (
                    <div className="w-1 h-8 bg-[#D3D1C7] mt-2"></div>
                  )}
                </div>
                <div className="pt-2 pb-6">
                  <p className="font-medium text-[#1E3A5F]">{event.label}</p>
                  <p className="text-sm text-[#6B7B8D]">
                    {formatDate(event.date.toDate())}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

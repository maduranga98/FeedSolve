import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getBoardBySlug,
  createSubmission,
  getCompanyMembers,
} from "../../lib/firestore";
import { Button, Input, Select, LoadingSpinner } from "../../components/Shared";
import {
  FileUploadInput,
  FilePreview,
  FileProgressBar,
} from "../../components/Attachments";
import { useFileUpload } from "../../hooks/useFileUpload";
import type { Board, SubmissionFormInput, User } from "../../types";
import { Copy, Check } from "lucide-react";

export function SubmitFeedback() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { uploads, uploadFiles, uploading: fileUploading } = useFileUpload();
  const [board, setBoard] = useState<Board | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ trackingCode: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingTrackingCode, setExistingTrackingCode] = useState("");

  const [formData, setFormData] = useState<SubmissionFormInput>({
    category: "",
    subject: "",
    description: "",
    email: "",
    isAnonymous: false,
    submissionLanguage: i18n.language || "en",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchBoard = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const boardData = await getBoardBySlug(slug);
        if (boardData) {
          setBoard(boardData);
          if (boardData.categories.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category: boardData.categories[0],
            }));
          }
          // Fetch team members for this company
          try {
            const members = await getCompanyMembers(boardData.companyId);
            setTeamMembers(members);
          } catch (error) {
            console.error("Failed to fetch team members:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch board:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [slug]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category)
      newErrors.category =
        t("forms:feedback.category") + " " + t("forms:validation.required");
    if (!formData.subject.trim())
      newErrors.subject =
        t("forms:feedback.subject") + " " + t("forms:validation.required");
    if (!formData.description.trim())
      newErrors.description =
        t("forms:feedback.description") + " " + t("forms:validation.required");

    if (!formData.isAnonymous) {
      if (!formData.email?.trim())
        newErrors.email = t("forms:validation.required");
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        newErrors.email = t("forms:validation.email");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !board) return;

    setSubmitting(true);
    try {
      const result = await createSubmission(
        board.id,
        board.companyId,
        formData,
      );

      // Upload files if any were selected
      if (selectedFiles.length > 0) {
        await uploadFiles(result.submissionId, selectedFiles);
      }

      setSuccess(result);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : t("errors:something_went_wrong"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (fileId: string | number) => {
    if (typeof fileId !== "number") return;
    setSelectedFiles((prev) => prev.filter((_, i) => i !== fileId));
  };

  const handleCopyCode = () => {
    if (success) {
      navigator.clipboard.writeText(success.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-4">
            {t("common:not_found")}
          </h1>
          <p className="text-[#6B7B8D]">{t("common:board_not_found")}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-[#EBF9F1] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-[#27AE60]" />
          </div>

          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">
            {t("forms:feedback.submit_success")}
          </h1>
          <p className="text-[#6B7B8D] mb-6">{t("forms:feedback.thank_you")}</p>

          <div className="bg-[#F8FAFB] rounded-lg p-4 mb-6">
            <p className="text-xs text-[#6B7B8D] mb-2">
              {t("forms:feedback.tracking_code")}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold text-[#1E3A5F] flex-1">
                {success.trackingCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-[#E8E8E8] rounded-lg transition-colors"
              >
                {copiedCode ? (
                  <Check size={20} className="text-[#27AE60]" />
                ) : (
                  <Copy size={20} className="text-[#2E86AB]" />
                )}
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/track/${success.trackingCode}`)}
          >
            {t("forms:feedback.track_feedback")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF6FB] via-[#F8FAFB] to-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white/90 backdrop-blur-sm border border-[#DDEAF2] rounded-2xl shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-[#6B7B8D] font-semibold mb-2">
            Already submitted feedback?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter tracking code (e.g. #FSV-AB12)"
              value={existingTrackingCode}
              onChange={(e) => setExistingTrackingCode(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const code = existingTrackingCode.trim();
                if (!code) return;
                navigate(`/track/${code}`);
              }}
              className="sm:w-auto w-full"
            >
              View Updates
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3EDF4] shadow-md p-8">
          <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
            {board.name}
          </h1>
          <p className="text-[#6B7B8D] mb-8">{board.description}</p>

          {errors.submit && (
            <div className="mb-4 p-4 bg-[#FFE5E5] border border-[#E74C3C] rounded-lg">
              <p className="text-sm text-[#E74C3C]">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label={t("forms:feedback.category")}
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              options={board.categories.map((cat) => ({
                value: cat,
                label: cat,
              }))}
              error={errors.category}
            />

            <Select
              label={t("forms:feedback.language") || "Language"}
              value={formData.submissionLanguage || i18n.language || "en"}
              onChange={(e) =>
                setFormData({ ...formData, submissionLanguage: e.target.value })
              }
              options={[
                { value: "en", label: "🇬🇧 English" },
                { value: "si", label: "🇱🇰 සිංහල" },
                { value: "ta", label: "🇮🇳 தமிழ்" },
                { value: "ar", label: "🇸🇦 العربية" },
                { value: "hi", label: "🇮🇳 हिन्दी" },
              ]}
            />

            <Input
              label={t("forms:feedback.subject")}
              placeholder={t("forms:feedback.subject_placeholder")}
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              error={errors.subject}
            />

            <div>
              <label className="block text-sm font-medium text-[#1E3A5F] mb-2">
                {t("forms:feedback.description")}
              </label>
              <textarea
                placeholder={t("forms:feedback.description_placeholder")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#2E86AB] transition-colors resize-none h-32 ${
                  errors.description
                    ? "border-[#E74C3C] focus:ring-[#E74C3C]"
                    : "border-[#D3D1C7] hover:border-[#2E86AB]"
                }`}
              />
              {errors.description && (
                <p className="text-sm text-[#E74C3C] mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isAnonymous: e.target.checked,
                  })
                }
                disabled={!board.isAnonymousAllowed}
                className="w-5 h-5 rounded border-[#D3D1C7] text-[#2E86AB] focus:ring-[#2E86AB] disabled:opacity-50"
              />
              <span className="text-[#1E3A5F] font-medium">
                {t("forms:feedback.anonymous")}
              </span>
            </label>

            {!formData.isAnonymous && (
              <Input
                label={t("forms:feedback.email")}
                type="email"
                placeholder="your@email.com"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                helperText={t("forms:feedback.email_helper")}
              />
            )}
            {teamMembers.length > 0 && (
              <Select
                label={
                  t("forms:feedback.assign_to") ||
                  "Assign to Team Member (Optional)"
                }
                value={formData.assignedTo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                options={[
                  { value: "", label: "No assignment" },
                  ...teamMembers.map((member) => ({
                    value: member.id,
                    label: `${member.name} (${member.email})`,
                  })),
                ]}
              />
            )}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">
                {t("forms:feedback.attachments")}
              </h3>

              <FileUploadInput
                onFilesSelected={handleFilesSelected}
                disabled={submitting || fileUploading}
              />

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <FilePreview
                    files={selectedFiles.map((file) => ({
                      name: file.name,
                      size: file.size,
                    }))}
                    onRemove={handleRemoveFile}
                    isUploading={fileUploading}
                  />
                </div>
              )}

              {uploads.size > 0 && (
                <div className="mt-4 space-y-3">
                  {Array.from(uploads.values()).map((upload) => (
                    <FileProgressBar
                      key={upload.fileId}
                      filename={upload.filename}
                      progress={upload.progress}
                      totalBytes={upload.totalBytes}
                      uploadedBytes={upload.uploadedBytes}
                      error={upload.error}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting || fileUploading}
              disabled={submitting || fileUploading}
              className="w-full"
            >
              {fileUploading
                ? t("forms:feedback.uploading")
                : t("forms:feedback.submit_button")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getBoardBySlug,
  createSubmission,
  getCompanyMembers,
  getCompany,
} from "../../lib/firestore";
import { applyBrandColors, DEFAULT_COLOR_THEME } from "../../lib/color-utils";
import { applyTextDirection } from "../../lib/rtl";
import { Button, Input, Select, LoadingSpinner } from "../../components/Shared";
import {
  FileUploadInput,
  FilePreview,
  FileProgressBar,
} from "../../components/Attachments";
import { useFileUpload } from "../../hooks/useFileUpload";
import type { Board, Company, SubmissionFormInput, User } from "../../types";
import { Copy, Check, MapPin, Phone, Mail } from "lucide-react";

const BRANDED_STYLES = `
  [data-branded] .brand-primary-bg { background-color: var(--brand-primary, #2E86AB); }
  [data-branded] .brand-primary-text { color: var(--brand-primary, #2E86AB); }
  [data-branded] .brand-secondary-text { color: var(--brand-secondary, #1E3A5F); }
  [data-branded] .brand-muted-text { color: var(--brand-primary-dark, #6B7B8D); }
  [data-branded] .brand-primary-border { border-color: var(--brand-primary-border, #D3D1C7); }
  [data-branded] .brand-primary-ring { --tw-ring-color: var(--brand-primary, #2E86AB); }
  [data-branded] .brand-btn-primary {
    background-color: var(--brand-primary, #2E86AB);
    color: var(--brand-text-on-primary, #FFFFFF);
  }
  [data-branded] .brand-btn-primary:hover {
    background-color: var(--brand-primary-dark, #246d8c);
  }
  [data-branded] .brand-input-border {
    border-color: var(--brand-primary-border, #D3D1C7);
  }
  [data-branded] .brand-input-border:hover {
    border-color: var(--brand-primary, #2E86AB);
  }
  [data-branded] .brand-input-border:focus {
    border-color: var(--brand-primary, #2E86AB);
    --tw-ring-color: var(--brand-primary, #2E86AB);
  }
  [data-branded] .brand-header-bg {
    background-color: var(--brand-primary-bg, rgba(46, 134, 171, 0.08));
  }
`;

export function SubmitFeedback() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { uploads, uploadFiles, uploading: fileUploading } = useFileUpload();
  const [board, setBoard] = useState<Board | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ trackingCode: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingTrackingCode, setExistingTrackingCode] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

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
          try {
            const members = await getCompanyMembers(boardData.companyId);
            setTeamMembers(members);
          } catch (error) {
            console.error("Failed to fetch team members:", error);
          }
          try {
            const companyData = await getCompany(boardData.companyId);
            if (companyData) {
              setCompany(companyData);
            }
          } catch (error) {
            console.error("Failed to fetch company:", error);
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

  useEffect(() => {
    if (company?.branding) {
      applyBrandColors(
        formRef.current,
        company.branding.primaryColor,
        company.branding.secondaryColor
      );
    }
  }, [company]);

  const branding = company?.branding;

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
        formData
      );

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

  const handleLanguageChange = (lang: string) => {
    setFormData({ ...formData, submissionLanguage: lang });
    i18n.changeLanguage(lang);
    localStorage.setItem("feedsolve_language", lang);
    applyTextDirection(lang);
  };

  const showPoweredBy =
    !company ||
    company.subscription.tier === "free" ||
    company.subscription.tier === "starter";

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
      <div
        ref={formRef}
        data-branded
        className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4"
      >
        <style>{BRANDED_STYLES}</style>
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 text-center">
          {/* Company branding */}
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.companyName || company?.name}
              className="h-14 w-14 rounded-lg object-contain mx-auto mb-3"
            />
          ) : (
            <div
              className="h-14 w-14 rounded-lg flex items-center justify-center text-xl font-bold mx-auto mb-3"
              style={{
                backgroundColor:
                  "var(--brand-primary, #2E86AB)",
                color: "var(--brand-text-on-primary, #FFFFFF)",
              }}
            >
              {(branding?.companyName || company?.name || board.name)
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          {(branding?.companyName || company?.name) && (
            <h2 className="text-lg font-semibold brand-secondary-text mb-1">
              {branding?.companyName || company?.name}
            </h2>
          )}
          {branding?.slogan && (
            <p className="text-xs brand-primary-text mb-4">
              {branding.slogan}
            </p>
          )}

          {/* Success icon */}
          <div className="w-16 h-16 bg-[#EBF9F1] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-[#27AE60]" />
          </div>

          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">
            {t("forms:feedback.submit_success")}
          </h1>
          <p className="text-[#6B7B8D] mb-6">
            {t("forms:feedback.thank_you")}
          </p>

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

          <button
            onClick={() => navigate(`/track/${success.trackingCode}`)}
            className="w-full px-5 py-2.5 text-base font-medium rounded-lg transition-all brand-btn-primary"
          >
            {t("forms:feedback.track_feedback")}
          </button>

          {showPoweredBy && (
            <p className="text-xs text-[#9AABBF] mt-6">
              {t("forms:feedback.powered_by")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={formRef}
      data-branded
      className="min-h-screen bg-gradient-to-b from-[#EEF6FB] via-[#F8FAFB] to-white p-4 sm:p-8"
    >
      <style>{BRANDED_STYLES}</style>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Existing tracking code lookup */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#DDEAF2] rounded-2xl shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-[#6B7B8D] font-semibold mb-2">
            {t("forms:feedback.already_submitted")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder={t("forms:feedback.enter_tracking_code")}
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
              {t("forms:feedback.view_updates")}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3EDF4] shadow-md overflow-hidden">
          {/* Branded Header */}
          <div className="brand-header-bg p-6 border-b brand-primary-border">
            <div className="flex items-center gap-4">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName || company?.name}
                  className="h-12 w-12 rounded-lg object-contain"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: "var(--brand-primary, #2E86AB)",
                    color: "var(--brand-text-on-primary, #FFFFFF)",
                  }}
                >
                  {(
                    branding?.companyName ||
                    company?.name ||
                    board.name
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                >
                  {branding?.companyName || company?.name || board.name}
                </h1>
                {branding?.slogan && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--brand-primary, #2E86AB)" }}
                  >
                    {branding.slogan}
                  </p>
                )}
              </div>
            </div>
            {(branding?.description || board.description) && (
              <p
                className="text-sm mt-3"
                style={{ color: "var(--brand-primary-dark, #6B7B8D)" }}
              >
                {branding?.description || board.description}
              </p>
            )}
          </div>

          {/* Form Body */}
          <div className="p-8">
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
                onChange={(e) => handleLanguageChange(e.target.value)}
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
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                >
                  {t("forms:feedback.description")}
                </label>
                <textarea
                  placeholder={t("forms:feedback.description_placeholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 transition-colors resize-none h-32 brand-input-border ${
                    errors.description
                      ? "border-[#E74C3C] focus:ring-[#E74C3C]"
                      : ""
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
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                >
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
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                >
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

              <button
                type="submit"
                disabled={submitting || fileUploading}
                className="w-full px-5 py-2.5 text-base font-medium rounded-lg transition-all brand-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || fileUploading
                  ? t("forms:feedback.uploading")
                  : t("forms:feedback.submit_button")}
              </button>
            </form>
          </div>

          {/* Company Contact Footer */}
          {(branding?.address || branding?.contactNumber || branding?.contactEmail) && (
            <div className="px-8 pb-6 border-t border-[#E3EDF4] pt-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6B7B8D]">
                {branding.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {branding.address}
                  </span>
                )}
                {branding.contactNumber && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {branding.contactNumber}
                  </span>
                )}
                {branding.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {branding.contactEmail}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {showPoweredBy && (
          <p className="text-center text-xs text-[#9AABBF]">
            {t("forms:feedback.powered_by")}
          </p>
        )}
      </div>
    </div>
  );
}

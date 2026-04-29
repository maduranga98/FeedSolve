import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getBoardBySlug,
  createSubmission,
  getCompany,
} from "../../lib/firestore";
import { applyBrandColors } from "../../lib/color-utils";
import { applyTextDirection } from "../../lib/rtl";
import { LoadingSpinner, Input, Select } from "../../components/Shared";
import {
  FileUploadInput,
  FilePreview,
  FileProgressBar,
} from "../../components/Attachments";
import { useFileUpload } from "../../hooks/useFileUpload";
import type { Board, Company, SubmissionFormInput } from "../../types";
import {
  Copy,
  Check,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

type Step = "intro" | "form" | "success";

const BRANDED_STYLES = `
  [data-branded] .brand-primary-bg { background-color: var(--brand-primary, #2E86AB); }
  [data-branded] .brand-primary-text { color: var(--brand-primary, #2E86AB); }
  [data-branded] .brand-secondary-text { color: var(--brand-secondary, #1E3A5F); }

  /* Page background uses brand primary tint */
  [data-branded].brand-page-bg {
    background: linear-gradient(
      150deg,
      var(--brand-primary-bg, rgba(46,134,171,0.10)) 0%,
      rgba(248,250,251,0.92) 45%,
      rgba(255,255,255,0.80) 100%
    );
  }

  /* Card header gradient */
  [data-branded] .brand-header-bg {
    background: linear-gradient(135deg, var(--brand-primary-bg, rgba(46,134,171,0.12)) 0%, var(--brand-primary-bg, rgba(46,134,171,0.04)) 100%);
  }

  /* Form body section has subtle brand tint */
  [data-branded] .brand-form-body {
    background-color: var(--brand-primary-bg, rgba(46,134,171,0.03));
  }

  /* Input, select, textarea — border + subtle bg tint */
  [data-branded] input:not([type="checkbox"]):not([type="radio"]),
  [data-branded] select,
  [data-branded] textarea {
    border-color: var(--brand-primary-border, #c8dce8);
    background-color: var(--brand-primary-bg, rgba(46,134,171,0.04));
    transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
  }
  [data-branded] input:not([type="checkbox"]):not([type="radio"]):hover,
  [data-branded] select:hover,
  [data-branded] textarea:hover {
    border-color: var(--brand-primary, #2E86AB);
    background-color: #fff;
  }
  [data-branded] input:not([type="checkbox"]):not([type="radio"]):focus,
  [data-branded] select:focus,
  [data-branded] textarea:focus {
    border-color: var(--brand-primary, #2E86AB);
    background-color: #fff;
    box-shadow: 0 0 0 3px var(--brand-primary-bg, rgba(46,134,171,0.15));
    outline: none;
  }
  [data-branded] input[type="checkbox"] {
    accent-color: var(--brand-primary, #2E86AB);
  }

  /* Primary action button */
  [data-branded] .brand-btn-primary {
    background-color: var(--brand-primary, #2E86AB);
    color: var(--brand-text-on-primary, #FFFFFF);
  }
  [data-branded] .brand-btn-primary:hover {
    background-color: var(--brand-primary-dark, #246d8c);
  }
  [data-branded] .brand-btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  /* Section divider accented */
  [data-branded] .brand-section-divider {
    border-color: var(--brand-primary-border, rgba(46,134,171,0.20));
  }
`;

const LANGUAGES = [
  { value: "en", label: "🇬🇧 English" },
  { value: "si", label: "🇱🇰 සිංහල" },
  { value: "ta", label: "🇮🇳 தமிழ்" },
  { value: "ar", label: "🇸🇦 العربية" },
  { value: "hi", label: "🇮🇳 हिन्दी" },
];

export function SubmitFeedback() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { uploads, uploadFiles, uploading: fileUploading } = useFileUpload();

  const [step, setStep] = useState<Step>("intro");
  const [board, setBoard] = useState<Board | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
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
    submitterName: "",
    submitterMobile: "",
    isAnonymous: false,
    submissionLanguage: i18n.language || "en",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchBoard = async () => {
      if (!slug) { setLoading(false); return; }
      try {
        const boardData = await getBoardBySlug(slug);
        if (boardData) {
          setBoard(boardData);
          document.title = `${boardData.name} | FeedSolve`;
          if (boardData.categories.length > 0) {
            setFormData(prev => ({ ...prev, category: boardData.categories[0] }));
          }
          try {
            const companyData = await getCompany(boardData.companyId);
            if (companyData) setCompany(companyData);
          } catch {
            // non-critical
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
    if (company?.branding && formRef.current) {
      applyBrandColors(
        formRef.current,
        company.branding.primaryColor,
        company.branding.secondaryColor
      );
    }
  }, [company, step]);

  const branding = company?.branding;
  const companyDisplayName = branding?.companyName || company?.name || board?.name || "";

  const SUBJECT_MAX = 100;
  const DESCRIPTION_MAX = 5000;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category)
      newErrors.category = t("forms:feedback.category") + " " + t("forms:validation.required");
    else if (board && board.categories.length > 0 && !board.categories.includes(formData.category))
      newErrors.category = t("forms:validation.invalid_category") || "Invalid category selected";

    const subject = formData.subject.trim();
    if (!subject)
      newErrors.subject = t("forms:feedback.subject") + " " + t("forms:validation.required");
    else if (subject.length > SUBJECT_MAX)
      newErrors.subject = `Subject must be at most ${SUBJECT_MAX} characters`;

    const description = formData.description.trim();
    if (!description)
      newErrors.description = t("forms:feedback.description") + " " + t("forms:validation.required");
    else if (description.length > DESCRIPTION_MAX)
      newErrors.description = `Description must be at most ${DESCRIPTION_MAX} characters`;

    if (!formData.isAnonymous) {
      if (!formData.email?.trim())
        newErrors.email = t("forms:validation.required");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = t("forms:validation.email");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !board) return;
    setSubmitting(true);
    try {
      const result = await createSubmission(board.id, board.companyId, formData);
      if (selectedFiles.length > 0) {
        await uploadFiles(result.submissionId, selectedFiles);
      }
      setSuccess(result);
      setStep("success");
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : t("errors:something_went_wrong"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setFormData(prev => ({ ...prev, submissionLanguage: lang }));
    i18n.changeLanguage(lang);
    localStorage.setItem("feedsolve_language", lang);
    applyTextDirection(lang);
  };

  const handleCopyCode = () => {
    if (success) {
      navigator.clipboard.writeText(success.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
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
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-4">{t("common:not_found")}</h1>
          <p className="text-[#6B7B8D]">{t("common:board_not_found")}</p>
        </div>
      </div>
    );
  }

  /* ─── INTRO PAGE ─── */
  if (step === "intro") {
    return (
      <div
        ref={formRef}
        data-branded
        className="min-h-screen brand-page-bg flex flex-col items-center justify-center p-4"
      >
        <style>{BRANDED_STYLES}</style>

        <div className="w-full max-w-lg">
          {/* Tracking lookup */}
          <div className="mb-6">
            <p className="text-xs text-center text-[#9AABBF] mb-2">
              {t("forms:feedback.already_submitted")}
            </p>
            <div className="flex gap-2 bg-white/80 backdrop-blur border border-[#DDEAF2] rounded-xl shadow-sm p-2">
              <Input
                placeholder={t("forms:feedback.enter_tracking_code")}
                value={existingTrackingCode}
                onChange={e => setExistingTrackingCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const code = existingTrackingCode.trim().replace(/^#/, "");
                    if (code) navigate(`/track/${code}`);
                  }
                }}
                className="border-0 shadow-none bg-transparent focus:ring-0 focus:border-0"
              />
              <button
                type="button"
                onClick={() => {
                  const code = existingTrackingCode.trim().replace(/^#/, "");
                  if (code) navigate(`/track/${code}`);
                }}
                className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg bg-[#1E3A5F] text-white hover:bg-[#163056] transition-colors"
              >
                {t("forms:feedback.view_updates")}
              </button>
            </div>
          </div>

          {/* Branding card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E3EDF4]">
            {/* Hero header */}
            <div className="brand-header-bg px-8 pt-10 pb-8 text-center border-b border-[#E3EDF4]">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={companyDisplayName}
                  className="h-20 w-20 rounded-2xl object-contain mx-auto mb-4 shadow-md"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-md brand-primary-bg"
                  style={{ color: "var(--brand-text-on-primary, #fff)" }}
                >
                  {companyDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--brand-secondary, #1E3A5F)" }}
              >
                {companyDisplayName}
              </h1>
              {branding?.slogan && (
                <p className="text-sm brand-primary-text font-medium">{branding.slogan}</p>
              )}
            </div>

            {/* Body */}
            <div className="px-8 py-8">
              <div className="flex items-start gap-3 mb-6">
                <div className="mt-0.5 p-2 rounded-xl bg-[#EBF5FB]">
                  <MessageSquare size={18} className="text-[#2E86AB]" />
                </div>
                <div>
                  <h2
                    className="text-lg font-semibold mb-1"
                    style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                  >
                    {board.name}
                  </h2>
                  <p className="text-sm text-[#6B7B8D] leading-relaxed">
                    {branding?.description || board.description || t("forms:feedback.intro_description")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep("form")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl transition-all brand-btn-primary shadow-sm hover:shadow-md"
              >
                {t("forms:feedback.start_button") || "Submit Feedback"}
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Contact footer */}
            {(branding?.address || branding?.contactNumber || branding?.contactEmail) && (
              <div className="px-8 pb-6 border-t border-[#F0F4F8] pt-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6B7B8D] justify-center">
                  {branding.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />{branding.address}
                    </span>
                  )}
                  {branding.contactNumber && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} />{branding.contactNumber}
                    </span>
                  )}
                  {branding.contactEmail && (
                    <span className="flex items-center gap-1">
                      <Mail size={11} />{branding.contactEmail}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {showPoweredBy && (
            <p className="text-center text-xs text-[#9AABBF] mt-4">
              {t("forms:feedback.powered_by")}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ─── SUCCESS / THANK YOU PAGE ─── */
  if (step === "success" && success) {
    return (
      <div
        ref={formRef}
        data-branded
        className="min-h-screen brand-page-bg flex items-center justify-center p-4"
      >
        <style>{BRANDED_STYLES}</style>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E3EDF4]">
            {/* Top brand strip */}
            <div className="brand-header-bg px-6 py-5 border-b border-[#E3EDF4] flex items-center gap-3">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={companyDisplayName}
                  className="h-10 w-10 rounded-xl object-contain"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-base font-bold brand-primary-bg"
                  style={{ color: "var(--brand-text-on-primary, #fff)" }}
                >
                  {companyDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--brand-secondary, #1E3A5F)" }}>
                  {companyDisplayName}
                </p>
                {branding?.slogan && (
                  <p className="text-xs brand-primary-text">{branding.slogan}</p>
                )}
              </div>
            </div>

            {/* Success content */}
            <div className="px-8 py-10 text-center">
              <div className="w-20 h-20 bg-[#EBF9F1] rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Check size={36} className="text-[#27AE60]" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">
                {t("forms:feedback.submit_success")}
              </h1>
              <p className="text-[#6B7B8D] mb-8 leading-relaxed">
                {t("forms:feedback.thank_you")}
              </p>

              {/* Tracking code box */}
              <div className="bg-[#F4F8FB] rounded-2xl p-5 mb-6 border border-[#DDEAF2]">
                <p className="text-xs text-[#6B7B8D] uppercase tracking-wide font-semibold mb-2">
                  {t("forms:feedback.tracking_code")}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-2xl font-mono font-bold text-[#1E3A5F] tracking-widest">
                    {success.trackingCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-[#E2EEF5] rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copiedCode ? (
                      <Check size={18} className="text-[#27AE60]" />
                    ) : (
                      <Copy size={18} style={{ color: "var(--brand-primary, #2E86AB)" }} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#9AABBF] mt-2">
                  Save this code to track your submission
                </p>
              </div>

              <button
                onClick={() => navigate(`/track/${success.trackingCode.replace(/^#/, "")}`)}
                className="w-full px-5 py-3 text-base font-semibold rounded-xl transition-all brand-btn-primary shadow-sm hover:shadow-md"
              >
                {t("forms:feedback.track_feedback")}
              </button>

              <button
                onClick={() => { setStep("intro"); setSuccess(null); setFormData({ category: board?.categories[0] || "", subject: "", description: "", email: "", submitterName: "", submitterMobile: "", isAnonymous: false, submissionLanguage: i18n.language || "en" }); }}
                className="mt-3 w-full px-5 py-2.5 text-sm text-[#6B7B8D] hover:text-[#1E3A5F] transition-colors"
              >
                Submit another response
              </button>
            </div>
          </div>

          {showPoweredBy && (
            <p className="text-center text-xs text-[#9AABBF] mt-4">
              {t("forms:feedback.powered_by")}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ─── FORM PAGE ─── */
  return (
    <div
      ref={formRef}
      data-branded
      className="min-h-screen brand-page-bg p-4 sm:p-8"
    >
      <style>{BRANDED_STYLES}</style>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-[#E3EDF4] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="brand-header-bg px-6 py-5 border-b border-[#E3EDF4]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("intro")}
                className="p-1.5 rounded-lg hover:bg-white/60 transition-colors text-[#6B7B8D]"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={companyDisplayName}
                  className="h-10 w-10 rounded-xl object-contain"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-base font-bold brand-primary-bg"
                  style={{ color: "var(--brand-text-on-primary, #fff)" }}
                >
                  {companyDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1
                  className="text-lg font-bold leading-tight"
                  style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                >
                  {companyDisplayName}
                </h1>
                {branding?.slogan && (
                  <p className="text-xs brand-primary-text">{branding.slogan}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="px-6 sm:px-8 py-8 brand-form-body">
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--brand-secondary, #1E3A5F)" }}>
              {board.name}
            </h2>
            <p className="text-sm text-[#6B7B8D] mb-6">
              {board.description || t("forms:feedback.form_description") || "Fill in the details below"}
            </p>

            {errors.submit && (
              <div className="mb-5 p-4 bg-[#FFE5E5] border border-[#E74C3C] rounded-xl">
                <p className="text-sm text-[#E74C3C]">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Language */}
              <Select
                label={t("forms:feedback.language") || "Language"}
                value={formData.submissionLanguage || i18n.language || "en"}
                onChange={e => handleLanguageChange(e.target.value)}
                options={LANGUAGES}
              />

              {/* Category */}
              <Select
                label={t("forms:feedback.category")}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                options={board.categories.map(cat => ({ value: cat, label: cat }))}
                error={errors.category}
              />

              {/* Subject */}
              <div>
                <Input
                  label={t("forms:feedback.subject")}
                  placeholder={t("forms:feedback.subject_placeholder")}
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value.slice(0, SUBJECT_MAX) })}
                  error={errors.subject}
                />
                <p className={`text-xs mt-1 text-right ${formData.subject.length >= SUBJECT_MAX ? "text-[#E74C3C]" : "text-[#9AABBF]"}`}>
                  {formData.subject.length}/{SUBJECT_MAX}
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--brand-secondary, #1E3A5F)" }}
                >
                  {t("forms:feedback.description")}
                </label>
                <textarea
                  placeholder={t("forms:feedback.description_placeholder")}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value.slice(0, DESCRIPTION_MAX) })}
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white resize-none focus:outline-none transition-all ${
                    errors.description ? "border-[#E74C3C]" : ""
                  }`}
                />
                <div className="flex items-start justify-between mt-1.5">
                  {errors.description ? (
                    <p className="text-xs text-[#E74C3C]">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <p className={`text-xs ${formData.description.length >= DESCRIPTION_MAX ? "text-[#E74C3C]" : "text-[#9AABBF]"}`}>
                    {formData.description.length}/{DESCRIPTION_MAX}
                  </p>
                </div>
              </div>

              {/* Anonymous */}
              {board.isAnonymousAllowed && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="w-4.5 h-4.5 rounded"
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--brand-secondary, #1E3A5F)" }}>
                    {t("forms:feedback.anonymous")}
                  </span>
                </label>
              )}

              {/* Email */}
              {!formData.isAnonymous && (
                <Input
                  label={board.isAnonymousAllowed ? t("forms:feedback.email") : "Email"}
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email || ""}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  helperText={t("forms:feedback.email_helper")}
                />
              )}

              {/* Optional name & mobile */}
              {!formData.isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={board.isAnonymousAllowed ? (t("forms:feedback.name") || "Name (optional)") : "Name"}
                    placeholder={t("forms:feedback.name_placeholder") || "Your name"}
                    value={formData.submitterName || ""}
                    onChange={e => setFormData({ ...formData, submitterName: e.target.value })}
                  />
                  <Input
                    label={t("forms:feedback.mobile") || "Mobile (optional)"}
                    type="tel"
                    placeholder={t("forms:feedback.mobile_placeholder") || "Your mobile number"}
                    value={formData.submitterMobile || ""}
                    onChange={e => setFormData({ ...formData, submitterMobile: e.target.value })}
                  />
                </div>
              )}

              {/* Attachments */}
              <div className="border-t brand-section-divider pt-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-secondary, #1E3A5F)" }}>
                  {t("forms:feedback.attachments")}
                </h3>
                <FileUploadInput
                  onFilesSelected={files => setSelectedFiles(prev => [...prev, ...files])}
                  disabled={submitting || fileUploading}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3">
                    <FilePreview
                      files={selectedFiles.map(f => ({ name: f.name, size: f.size }))}
                      onRemove={id => {
                        if (typeof id !== "number") return;
                        setSelectedFiles(prev => prev.filter((_, i) => i !== id));
                      }}
                      isUploading={fileUploading}
                    />
                  </div>
                )}
                {uploads.size > 0 && (
                  <div className="mt-3 space-y-2">
                    {Array.from(uploads.values()).map(u => (
                      <FileProgressBar
                        key={u.fileId}
                        filename={u.filename}
                        progress={u.progress}
                        totalBytes={u.totalBytes}
                        uploadedBytes={u.uploadedBytes}
                        error={u.error}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || fileUploading}
                className="w-full px-5 py-3.5 text-base font-semibold rounded-xl transition-all brand-btn-primary shadow-sm hover:shadow-md"
              >
                {submitting || fileUploading
                  ? t("forms:feedback.uploading")
                  : t("forms:feedback.submit_button")}
              </button>
            </form>
          </div>

          {/* Contact footer */}
          {(branding?.address || branding?.contactNumber || branding?.contactEmail) && (
            <div className="px-8 pb-6 border-t border-[#F0F4F8] pt-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6B7B8D]">
                {branding.address && (
                  <span className="flex items-center gap-1"><MapPin size={11} />{branding.address}</span>
                )}
                {branding.contactNumber && (
                  <span className="flex items-center gap-1"><Phone size={11} />{branding.contactNumber}</span>
                )}
                {branding.contactEmail && (
                  <span className="flex items-center gap-1"><Mail size={11} />{branding.contactEmail}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {showPoweredBy && (
          <p className="text-center text-xs text-[#9AABBF] mt-4">
            {t("forms:feedback.powered_by")}
          </p>
        )}
      </div>
    </div>
  );
}

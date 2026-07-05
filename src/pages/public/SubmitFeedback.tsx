import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getBoardBySlug,
  createSubmission,
  getCompany,
} from "../../lib/firestore";
import { applyBrandColors } from "../../lib/color-utils";
import { applyTextDirection } from "../../lib/rtl";
import { getCategoryLabel } from "../../lib/utils";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../../config/languages";
import { LoadingSpinner, Input, Select } from "../../components/Shared";
import { SatisfactionRating } from "../../components/public/SatisfactionRating";
import type { SatisfactionScore } from "../../components/public/SatisfactionRating";
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
  User,
  Paperclip,
  Star,
  Download,
} from "lucide-react";
import { downloadSubmissionReceiptPdf } from "../../lib/submission-receipt";

type Step = "intro" | "form" | "success";

const BRANDED_STYLES = `
  [data-branded] .brand-primary-bg { background-color: var(--brand-primary, #c0694a); }
  [data-branded] .brand-primary-text { color: var(--brand-primary, #c0694a); }
  [data-branded] .brand-secondary-text { color: var(--brand-secondary, #1c1917); }

  [data-branded].brand-page-bg {
    background: linear-gradient(
      150deg,
      var(--brand-primary-bg, rgba(192,105,74,0.12)) 0%,
      rgba(248,250,252,0.96) 50%,
      rgba(255,255,255,0.88) 100%
    );
  }

  [data-branded] .brand-header-bg {
    background: linear-gradient(
      135deg,
      var(--brand-primary-bg, rgba(192,105,74,0.10)) 0%,
      var(--brand-primary-bg, rgba(192,105,74,0.03)) 100%
    );
  }

  [data-branded] .brand-form-body {
    background-color: var(--brand-primary-bg, rgba(192,105,74,0.02));
  }

  [data-branded] input:not([type="checkbox"]):not([type="radio"]),
  [data-branded] select,
  [data-branded] textarea {
    border-color: var(--brand-primary-border, #e8d5c9);
    background-color: var(--brand-primary-bg, rgba(192,105,74,0.03));
    transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
  }
  [data-branded] input:not([type="checkbox"]):not([type="radio"]):hover,
  [data-branded] select:hover,
  [data-branded] textarea:hover {
    border-color: var(--brand-primary, #c0694a);
    background-color: #fff;
  }
  [data-branded] input:not([type="checkbox"]):not([type="radio"]):focus,
  [data-branded] select:focus,
  [data-branded] textarea:focus {
    border-color: var(--brand-primary, #c0694a);
    background-color: #fff;
    box-shadow: 0 0 0 3px var(--brand-primary-bg, rgba(192,105,74,0.15));
    outline: none;
  }
  [data-branded] input[type="checkbox"] {
    accent-color: var(--brand-primary, #c0694a);
  }

  [data-branded] .brand-btn-primary {
    background: linear-gradient(
      135deg,
      var(--brand-primary, #c0694a) 0%,
      var(--brand-secondary, #1c1917) 100%
    );
    color: var(--brand-text-on-primary, #FFFFFF);
    border: none;
    transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
  }
  [data-branded] .brand-btn-primary:hover:not(:disabled) {
    opacity: 0.91;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px var(--brand-primary-bg, rgba(192,105,74,0.45));
  }
  [data-branded] .brand-btn-primary:active:not(:disabled) {
    transform: translateY(0);
    opacity: 0.96;
  }
  [data-branded] .brand-btn-primary:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  [data-branded] .brand-section-divider {
    border-color: var(--brand-primary-border, rgba(192,105,74,0.20));
  }

  /* Decorative gradient hero — used in intro + success headers */
  [data-branded] .brand-hero-gradient {
    background: linear-gradient(
      145deg,
      var(--brand-primary, #c0694a) 0%,
      var(--brand-secondary, #1c1917) 100%
    );
    position: relative;
    overflow: hidden;
  }

  /* Section cards with left accent stripe */
  [data-branded] .brand-section-card {
    background: white;
    border: 1px solid var(--brand-primary-border, rgba(192,105,74,0.18));
    border-radius: 14px;
    padding: 20px 20px 22px;
    position: relative;
    overflow: hidden;
  }
  [data-branded] .brand-section-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 14px;
    bottom: 14px;
    width: 3px;
    background: linear-gradient(
      180deg,
      var(--brand-primary, #c0694a),
      var(--brand-secondary, #1c1917)
    );
    border-radius: 0 2px 2px 0;
  }

  /* Animations */
  @keyframes feedsolve-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes feedsolve-popIn {
    0%   { transform: scale(0.82); opacity: 0; }
    65%  { transform: scale(1.06); }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes feedsolve-successPulse {
    0%, 100% { box-shadow: 0 0 0 0   rgba(39,174,96,0); }
    45%       { box-shadow: 0 0 0 18px rgba(39,174,96,0.12); }
  }
  @keyframes feedsolve-spin {
    to { transform: rotate(360deg); }
  }

  [data-branded] .brand-animate-fadeup {
    animation: feedsolve-fadeUp 0.45s ease forwards;
  }
  [data-branded] .brand-animate-pop {
    animation: feedsolve-popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  [data-branded] .brand-success-ring {
    animation: feedsolve-successPulse 2s ease-in-out 0.5s 2;
  }
  [data-branded] .brand-spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: feedsolve-spin 0.7s linear infinite;
    display: inline-block;
  }
`;

const LANGUAGES = SUPPORTED_LANGUAGES.map(l => ({
  value: l.code,
  label: `${l.flag} ${l.name}`,
}));

export function SubmitFeedback() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { uploads, uploadFiles, uploading: fileUploading } = useFileUpload();

  const [step, setStep] = useState<Step>("intro");
  const [board, setBoard] = useState<Board | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ trackingCode: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingTrackingCode, setExistingTrackingCode] = useState("");
  const locationTag = searchParams.get("loc")?.trim() || null;

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
    satisfactionScore: null,
    satisfactionLabel: null,
    location: locationTag,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const boardLanguageCodes =
    board?.supportedLanguages && board.supportedLanguages.length > 0
      ? board.supportedLanguages
      : SUPPORTED_LANGUAGES.map(l => l.code);
  const availableLanguages = LANGUAGES.filter(l => boardLanguageCodes.includes(l.value));

  useEffect(() => {
    const fetchBoard = async () => {
      if (!slug) { setLoading(false); return; }
      try {
        const boardData = await getBoardBySlug(slug);
        if (boardData) {
          setBoard(boardData);
          document.title = `${boardData.name} | FeedSolve`;
          const allowed =
            boardData.supportedLanguages && boardData.supportedLanguages.length > 0
              ? boardData.supportedLanguages
              : null;
          if (allowed && !allowed.includes(i18n.language)) {
            const fallback = allowed[0] || DEFAULT_LANGUAGE;
            setFormData(prev => ({ ...prev, submissionLanguage: fallback }));
            i18n.changeLanguage(fallback);
            localStorage.setItem("feedsolve_language", fallback);
            applyTextDirection(fallback);
          }
          if (boardData.categories.length > 0) {
            setFormData(prev => ({ ...prev, category: boardData.categories[0], location: locationTag }));
          } else {
            setFormData(prev => ({ ...prev, location: locationTag }));
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
  }, [slug, locationTag]);

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
      newErrors.subject = t("forms:validation.subject_max", { max: SUBJECT_MAX });

    const description = formData.description.trim();
    if (!description)
      newErrors.description = t("forms:feedback.description") + " " + t("forms:validation.required");
    else if (description.length > DESCRIPTION_MAX)
      newErrors.description = t("forms:validation.description_max", { max: DESCRIPTION_MAX });

    if (!formData.isAnonymous) {
      if (!formData.email?.trim())
        newErrors.email = t("forms:validation.required");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = t("forms:validation.email");
    }

    if (board?.satisfactionRequired && !formData.satisfactionScore) {
      newErrors.satisfactionScore = t("forms:validation.satisfaction_required");
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

  const handleDownloadReceipt = async () => {
    if (!success) return;
    try {
      setDownloadingReceipt(true);
      const code = success.trackingCode.replace(/^#/, "");
      const trackingUrl = `${window.location.origin}/track/${code}`;
      await downloadSubmissionReceiptPdf({
        trackingCode: success.trackingCode,
        trackingUrl,
        boardName: board?.name,
        submittedAt: new Date(),
        companyName: branding?.companyName || company?.name,
        companyLogoUrl: branding?.logoUrl ?? null,
        companyPrimaryColor: branding?.primaryColor ?? null,
        companySecondaryColor: branding?.secondaryColor ?? null,
        companyContactEmail: branding?.contactEmail ?? null,
        companyContactNumber: branding?.contactNumber ?? null,
        companyAddress: branding?.address ?? null,
      });
    } catch (error) {
      console.error("Failed to download receipt:", error);
    } finally {
      setDownloadingReceipt(false);
    }
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
      <div className="min-h-screen bg-[#f5f0ec] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-[#f5f0ec] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1c1917] mb-4">{t("common:not_found")}</h1>
          <p className="text-[#78716c]">{t("common:board_not_found")}</p>
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

        <div className="w-full max-w-lg brand-animate-fadeup">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#efe5dd]">

            {/* ── Hero gradient header ── */}
            <div className="brand-hero-gradient px-5 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-10 text-center" style={{ position: "relative" }}>
              {/* Decorative floating circles */}
              <div style={{
                position: "absolute", top: -28, right: -28,
                width: 130, height: 130, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -36, left: -20,
                width: 110, height: 110, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", top: 20, left: 24,
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", pointerEvents: "none",
              }} />

              <div style={{ position: "relative" }}>
                {branding?.logoUrl ? (
                  <div className="mb-5">
                    <img
                      src={branding.logoUrl}
                      alt={companyDisplayName}
                      className="h-24 w-24 rounded-2xl object-contain mx-auto shadow-xl"
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(8px)",
                        padding: 6,
                        border: "1.5px solid rgba(255,255,255,0.30)",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="h-24 w-24 rounded-2xl flex items-center justify-center text-4xl font-bold mx-auto mb-5 shadow-xl"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                      border: "1.5px solid rgba(255,255,255,0.30)",
                    }}
                  >
                    {companyDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <h1 className="text-2xl font-bold text-white mb-1.5 drop-shadow-sm">
                  {companyDisplayName}
                </h1>
                {branding?.slogan && (
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {branding.slogan}
                  </p>
                )}
              </div>
            </div>

            {/* ── Card body ── */}
            <div className="px-5 sm:px-8 py-6 sm:py-8">
              {/* Board info */}
              <div className="mb-7 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                  style={{ background: "var(--brand-primary-bg, rgba(192,105,74,0.10))" }}>
                  <MessageSquare size={13} style={{ color: "var(--brand-primary, #c0694a)" }} />
                  <span className="text-xs font-bold brand-primary-text">{board.name}</span>
                </div>
                <p className="text-sm text-[#78716c] leading-relaxed">
                  {branding?.description || board.description || t("forms:feedback.intro_description")}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => setStep("form")}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-base font-bold rounded-xl brand-btn-primary shadow-md"
              >
                <span>{t("forms:feedback.start_button") || "Submit Feedback"}</span>
                <ChevronRight size={20} />
              </button>

              {/* Tracking lookup */}
              <div className="mt-7 pt-6 border-t border-[#f2ece6]">
                <p className="text-xs text-center text-[#8f8680] mb-3">
                  {t("forms:feedback.already_submitted")}
                </p>
                <div className="flex gap-2 bg-[#faf8f5] border border-[#efe5dd] rounded-xl p-1.5">
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
                    className="flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg bg-[#1c1917] text-white hover:bg-[#33302d] transition-colors"
                  >
                    {t("forms:feedback.view_updates")}
                  </button>
                </div>
              </div>
            </div>

            {/* Contact footer */}
            {(branding?.address || branding?.contactNumber || branding?.contactEmail) && (
              <div className="px-5 sm:px-8 pb-5 sm:pb-6 border-t border-[#f2ece6] pt-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#8f8680] justify-center">
                  {branding.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} />{branding.address}
                    </span>
                  )}
                  {branding.contactNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={11} />{branding.contactNumber}
                    </span>
                  )}
                  {branding.contactEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={11} />{branding.contactEmail}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {showPoweredBy && (
            <p className="text-center text-xs text-[#8f8680] mt-4">
              {t("forms:feedback.powered_by")}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ─── SUCCESS PAGE ─── */
  if (step === "success" && success) {
    return (
      <div
        ref={formRef}
        data-branded
        className="min-h-screen brand-page-bg flex items-center justify-center p-4"
      >
        <style>{BRANDED_STYLES}</style>
        <div className="w-full max-w-md brand-animate-pop">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#efe5dd]">

            {/* ── Hero header ── */}
            <div className="brand-hero-gradient px-6 py-6" style={{ position: "relative" }}>
              <div style={{
                position: "absolute", top: -20, right: -20,
                width: 100, height: 100, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -28, left: -16,
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", pointerEvents: "none",
              }} />

              <div className="flex items-center gap-3" style={{ position: "relative" }}>
                {branding?.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={companyDisplayName}
                    className="h-11 w-11 rounded-xl object-contain"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      padding: 4,
                      border: "1px solid rgba(255,255,255,0.28)",
                    }}
                  />
                ) : (
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-base font-bold"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.28)",
                    }}
                  >
                    {companyDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-white">{companyDisplayName}</p>
                  {branding?.slogan && (
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
                      {branding.slogan}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Success content ── */}
            <div className="px-5 sm:px-8 py-8 sm:py-10 text-center">
              {/* Animated success icon */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 brand-success-ring"
                style={{ background: "linear-gradient(145deg, #F0FFF4, #DCFCE7)" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(145deg, #22C55E, #16A34A)" }}
                >
                  <Check size={30} color="white" strokeWidth={3} />
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                {t("forms:feedback.submit_success")}
              </h1>
              <p className="text-[#78716c] mb-8 leading-relaxed text-sm">
                {t("forms:feedback.thank_you")}
              </p>

              {/* Tracking code */}
              <div
                className="rounded-2xl p-5 mb-6"
                style={{
                  background: "var(--brand-primary-bg, rgba(192,105,74,0.06))",
                  border: "1.5px solid var(--brand-primary-border, rgba(192,105,74,0.20))",
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3 brand-primary-text">
                  {t("forms:feedback.tracking_code")}
                </p>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <code
                    className="text-2xl sm:text-3xl font-mono font-black tracking-widest break-all"
                    style={{ color: "var(--brand-secondary, #1c1917)" }}
                  >
                    {success.trackingCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl transition-all"
                    style={{
                      background: copiedCode
                        ? "rgba(34,197,94,0.12)"
                        : "var(--brand-primary-bg, rgba(192,105,74,0.10))",
                    }}
                    title={t("forms:feedback.copy_code")}
                  >
                    {copiedCode ? (
                      <Check size={16} color="#16A34A" />
                    ) : (
                      <Copy size={16} style={{ color: "var(--brand-primary, #c0694a)" }} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#8f8680]">
                  {t("forms:feedback.save_code_helper")}
                </p>
              </div>

              <button
                onClick={() => navigate(`/track/${success.trackingCode.replace(/^#/, "")}`)}
                className="w-full px-5 py-3.5 text-sm font-bold rounded-xl transition-all brand-btn-primary shadow-md mb-3"
              >
                {t("forms:feedback.track_feedback")}
              </button>

              <button
                type="button"
                onClick={handleDownloadReceipt}
                disabled={downloadingReceipt}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all mb-3 border-2 disabled:opacity-60"
                style={{
                  borderColor: "var(--brand-primary, #c0694a)",
                  color: "var(--brand-primary, #c0694a)",
                  background: "white",
                }}
              >
                {downloadingReceipt ? (
                  <>
                    <span className="brand-spinner" style={{ borderTopColor: "var(--brand-primary, #c0694a)", borderColor: "rgba(192,105,74,0.25)" }} />
                    <span>{t("forms:feedback.preparing_pdf")}</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>{t("forms:feedback.download_pdf")}</span>
                  </>
                )}
              </button>
              <p className="text-xs text-[#8f8680] mb-1 -mt-1">
                {t("forms:feedback.pdf_help")}
              </p>

              <button
                onClick={() => {
                  setStep("intro");
                  setSuccess(null);
                  setFormData({
                    category: board?.categories[0] || "",
                    subject: "",
                    description: "",
                    email: "",
                    submitterName: "",
                    submitterMobile: "",
                    location: locationTag,
                    isAnonymous: false,
                    submissionLanguage: i18n.language || "en",
                    satisfactionScore: null,
                    satisfactionLabel: null,
                  });
                }}
                className="w-full px-5 py-2.5 text-sm text-[#8f8680] hover:text-[#78716c] transition-colors font-medium"
              >
                {t("forms:feedback.submit_another")}
              </button>
            </div>
          </div>

          {showPoweredBy && (
            <p className="text-center text-xs text-[#8f8680] mt-4">
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
        <div className="bg-white rounded-3xl border border-[#efe5dd] shadow-2xl overflow-hidden">

          {/* ── Compact brand header ── */}
          <div className="brand-hero-gradient px-6 py-5" style={{ position: "relative" }}>
            <div style={{
              position: "absolute", top: -16, right: -16,
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", pointerEvents: "none",
            }} />

            <div className="flex items-center gap-3" style={{ position: "relative" }}>
              <button
                onClick={() => setStep("intro")}
                className="p-2 rounded-xl transition-colors flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
                aria-label={t("forms:feedback.back")}
              >
                <ArrowLeft size={16} color="white" />
              </button>

              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={companyDisplayName}
                  className="h-10 w-10 rounded-xl object-contain flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    padding: 3,
                    border: "1px solid rgba(255,255,255,0.26)",
                  }}
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.26)",
                  }}
                >
                  {companyDisplayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-base font-bold text-white leading-tight truncate">
                  {companyDisplayName}
                </h1>
                {branding?.slogan && (
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.70)" }}>
                    {branding.slogan}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Form body ── */}
          <div className="px-5 sm:px-7 py-7 brand-form-body">

            {/* Board title + description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                {board.name}
              </h2>
              <p className="text-sm text-[#78716c]">
                {board.description || t("forms:feedback.form_description") || "Fill in the details below"}
              </p>
            </div>

            {/* Location tag */}
            {locationTag && (
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#9c4a2f] shadow-sm"
                  style={{ background: "var(--brand-primary-bg, rgba(192,105,74,0.10))", border: "1px solid var(--brand-primary-border, rgba(192,105,74,0.20))" }}>
                  <MapPin size={14} />
                  <span>{locationTag}</span>
                </div>
              </div>
            )}

            {/* Submit error */}
            {errors.submit && (
              <div className="mb-5 p-4 bg-[#FFF5F5] border border-[#FCA5A5] rounded-xl">
                <p className="text-sm text-[#c0392b]">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Section 1: Your Message ── */}
              <div className="brand-section-card">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-2 rounded-lg"
                    style={{ background: "var(--brand-primary-bg, rgba(192,105,74,0.10))" }}>
                    <MessageSquare size={15} style={{ color: "var(--brand-primary, #c0694a)" }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                    {t("forms:feedback.your_message_section")}
                  </h3>
                </div>

                <div className="space-y-4">
                  {availableLanguages.length > 1 && (
                    <Select
                      label={t("forms:feedback.language") || "Language"}
                      value={formData.submissionLanguage || i18n.language || DEFAULT_LANGUAGE}
                      onChange={e => handleLanguageChange(e.target.value)}
                      options={availableLanguages}
                    />
                  )}

                  <Select
                    label={t("forms:feedback.category")}
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    options={board.categories.map(cat => ({
                      value: cat,
                      label: board.categoryTranslationsEnabled
                        ? getCategoryLabel(
                            cat,
                            formData.submissionLanguage || i18n.language,
                            board.categoryTranslations
                          )
                        : cat,
                    }))}
                    error={errors.category}
                  />

                  <div>
                    <Input
                      label={t("forms:feedback.subject")}
                      placeholder={t("forms:feedback.subject_placeholder")}
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value.slice(0, SUBJECT_MAX) })}
                      error={errors.subject}
                    />
                    <p className={`text-xs mt-1 text-right ${formData.subject.length >= SUBJECT_MAX ? "text-[#c0392b]" : "text-[#8f8680]"}`}>
                      {formData.subject.length}/{SUBJECT_MAX}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--brand-secondary, #1c1917)" }}
                    >
                      {t("forms:feedback.description")}
                    </label>
                    <textarea
                      placeholder={t("forms:feedback.description_placeholder")}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value.slice(0, DESCRIPTION_MAX) })}
                      rows={5}
                      className={`w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none transition-all ${
                        errors.description ? "border-[#c0392b]" : ""
                      }`}
                    />
                    <div className="flex items-start justify-between mt-1">
                      {errors.description ? (
                        <p className="text-xs text-[#c0392b]">{errors.description}</p>
                      ) : <span />}
                      <p className={`text-xs ${formData.description.length >= DESCRIPTION_MAX ? "text-[#c0392b]" : "text-[#8f8680]"}`}>
                        {formData.description.length}/{DESCRIPTION_MAX}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: About You ── */}
              <div className="brand-section-card">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-2 rounded-lg"
                    style={{ background: "var(--brand-primary-bg, rgba(192,105,74,0.10))" }}>
                    <User size={15} style={{ color: "var(--brand-primary, #c0694a)" }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                    {t("forms:feedback.about_you_section")}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Anonymous toggle */}
                  {board.isAnonymousAllowed && (
                    <div
                      className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer select-none"
                      style={{
                        background: formData.isAnonymous
                          ? "var(--brand-primary-bg, rgba(192,105,74,0.08))"
                          : "#F9FAFB",
                        border: `1.5px solid ${formData.isAnonymous
                          ? "var(--brand-primary-border, rgba(192,105,74,0.30))"
                          : "#E5E7EB"}`,
                        transition: "all 0.2s",
                      }}
                      onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.isAnonymous}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          border: "none",
                          padding: 2,
                          background: formData.isAnonymous
                            ? "var(--brand-primary, #c0694a)"
                            : "#D1D5DB",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          flexShrink: 0,
                          position: "relative",
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          setFormData({ ...formData, isAnonymous: !formData.isAnonymous });
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
                            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            transform: formData.isAnonymous ? "translateX(20px)" : "translateX(0px)",
                          }}
                        />
                      </button>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                          {t("forms:feedback.anonymous")}
                        </div>
                        <div className="text-xs text-[#8f8680] mt-0.5">
                          {t("forms:feedback.anonymous_help")}
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.isAnonymous && (
                    <>
                      <Input
                        label={board.isAnonymousAllowed ? t("forms:feedback.email") : t("email")}
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email || ""}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        error={errors.email}
                        helperText={t("forms:feedback.email_helper")}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={board.isAnonymousAllowed ? t("forms:feedback.name") : t("name")}
                          placeholder={t("forms:feedback.name_placeholder")}
                          value={formData.submitterName || ""}
                          onChange={e => setFormData({ ...formData, submitterName: e.target.value })}
                        />
                        <Input
                          label={t("forms:feedback.mobile")}
                          type="tel"
                          placeholder={t("forms:feedback.mobile_placeholder")}
                          value={formData.submitterMobile || ""}
                          onChange={e => setFormData({ ...formData, submitterMobile: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {formData.isAnonymous && (
                    <p className="text-xs text-[#8f8680] text-center py-1">
                      {t("forms:feedback.anonymous_confirmed")}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Section 3: Attachments ── */}
              <div className="brand-section-card">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-2 rounded-lg"
                    style={{ background: "var(--brand-primary-bg, rgba(192,105,74,0.10))" }}>
                    <Paperclip size={15} style={{ color: "var(--brand-primary, #c0694a)" }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                    {t("forms:feedback.attachments")}
                  </h3>
                </div>

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

              {/* ── Section 4: Satisfaction Rating ── */}
              {board.showSatisfactionRating && (
                <div className="brand-section-card">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 rounded-lg"
                      style={{ background: "var(--brand-primary-bg, rgba(192,105,74,0.10))" }}>
                      <Star size={15} style={{ color: "var(--brand-primary, #c0694a)" }} />
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--brand-secondary, #1c1917)" }}>
                      {t("forms:feedback.satisfaction_section")}
                      {board.satisfactionRequired && (
                        <span className="text-[#c0392b] ml-1">*</span>
                      )}
                    </h3>
                  </div>

                  <SatisfactionRating
                    value={(formData.satisfactionScore as SatisfactionScore) ?? null}
                    onChange={(score, label) =>
                      setFormData({ ...formData, satisfactionScore: score, satisfactionLabel: label })
                    }
                    error={errors.satisfactionScore}
                  />
                </div>
              )}

              {/* ── Submit button ── */}
              <button
                type="submit"
                disabled={submitting || fileUploading}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-4 text-base font-bold rounded-xl transition-all brand-btn-primary shadow-md"
              >
                {(submitting || fileUploading) ? (
                  <>
                    <span className="brand-spinner" />
                    <span>{t("forms:feedback.uploading")}</span>
                  </>
                ) : (
                  t("forms:feedback.submit_button")
                )}
              </button>
            </form>
          </div>

          {/* Contact footer */}
          {(branding?.address || branding?.contactNumber || branding?.contactEmail) && (
            <div className="px-7 pb-6 border-t border-[#f2ece6] pt-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#8f8680] justify-center">
                {branding.address && (
                  <span className="flex items-center gap-1.5"><MapPin size={11} />{branding.address}</span>
                )}
                {branding.contactNumber && (
                  <span className="flex items-center gap-1.5"><Phone size={11} />{branding.contactNumber}</span>
                )}
                {branding.contactEmail && (
                  <span className="flex items-center gap-1.5"><Mail size={11} />{branding.contactEmail}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {showPoweredBy && (
          <p className="text-center text-xs text-[#8f8680] mt-4">
            {t("forms:feedback.powered_by")}
          </p>
        )}
      </div>
    </div>
  );
}

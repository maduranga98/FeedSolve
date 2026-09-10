import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useHasFeature } from "../../hooks/useHasFeature";
import {
  getCompany,
  updateCompanyBranding,
  uploadCompanyLogo,
} from "../../lib/firestore";
import {
  generateColorTheme,
  DEFAULT_COLOR_THEME,
  type BrandColorTheme,
} from "../../lib/color-utils";
import type { Company, CompanyBranding } from "../../types";
import { Button, Input, LoadingSpinner } from "../../components/Shared";
import { Upload, Trash2, Check, Palette, Building2, AlertCircle, Lock, Zap } from "lucide-react";

export function BrandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { checkFeature } = useHasFeature();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [branding, setBranding] = useState<Partial<CompanyBranding>>({});
  const [previewTheme, setPreviewTheme] = useState<BrandColorTheme | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Branding | FeedSolve';
  }, []);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.companyId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCompany(user.companyId);
        if (data) {
          setCompany(data);
          if (data.branding) {
            setBranding(data.branding);
            if (data.branding.primaryColor && data.branding.secondaryColor) {
              setPreviewTheme(
                generateColorTheme(
                  data.branding.primaryColor,
                  data.branding.secondaryColor
                )
              );
            }
          } else {
            setBranding({ companyName: data.name, contactEmail: data.email });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load company");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [user?.companyId]);

  const updatePreview = (primary?: string, secondary?: string) => {
    const p = primary || branding.primaryColor;
    const s = secondary || branding.secondaryColor;
    if (p && s) {
      setPreviewTheme(generateColorTheme(p, s));
    } else {
      setPreviewTheme(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.companyId) return;

    setUploading(true);
    setError(null);
    try {
      const result = await uploadCompanyLogo(
        user.companyId,
        file,
        branding.logoStoragePath
      );
      setBranding((prev) => ({
        ...prev,
        logoUrl: result.url,
        logoStoragePath: result.storagePath,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setBranding((prev) => ({
      ...prev,
      logoUrl: undefined,
      logoStoragePath: undefined,
    }));
  };

  const handleColorChange = (
    field: "primaryColor" | "secondaryColor",
    value: string
  ) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
    if (field === "primaryColor") {
      updatePreview(value, undefined);
    } else {
      updatePreview(undefined, value);
    }
  };

  const handleSave = async () => {
    if (!user?.companyId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateCompanyBranding(user.companyId, branding);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!checkFeature('canRemoveBranding')) {
    return (
      <div className="min-h-screen bg-[var(--c-se1e8ef)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[var(--c-sffffff)] rounded-2xl border border-[var(--c-be8ecf0)] shadow-sm p-10 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 bg-[var(--c-sebf5fb)] rounded-full flex items-center justify-center">
            <Lock size={28} className="text-[var(--c-t2e86ab)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--c-t1e3a5f)] mb-2">{t("branding_page.custom_branding")}</h2>
            <p className="text-[var(--c-t6b7b8d)] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t("branding_page.custom_branding_desc") }} />
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--c-s2e86ab)] text-white rounded-lg font-medium hover:bg-[var(--c-s1e6a8a)] transition-colors"
          >
            <Zap size={16} />
            {t("branding_page.upgrade_growth")}
          </button>
        </div>
      </div>
    );
  }

  const theme = previewTheme || DEFAULT_COLOR_THEME;

  return (
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      {/* Header */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be8ecf0)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center flex-shrink-0">
                <Palette size={20} className="text-[var(--c-t2e86ab)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">
                  {t("branding")}
                </h1>
                <p className="text-sm text-[var(--c-t6b7b8d)] mt-0.5">
                  {t("branding_page.subtitle")}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              disabled={saving || uploading}
              className="self-start sm:self-auto flex-shrink-0"
            >
              {t("save_branding")}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {error && (
        <div className="flex items-center gap-2 p-4 bg-[var(--c-sffe5e5)] border border-[var(--c-be74c3c)] rounded-lg">
          <AlertCircle size={18} className="text-[var(--c-te74c3c)] flex-shrink-0" />
          <p className="text-sm text-[var(--c-te74c3c)]">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-[var(--c-sebf9f1)] border border-[var(--c-b27ae60)] rounded-lg">
          <Check size={18} className="text-[var(--c-t27ae60)] flex-shrink-0" />
          <p className="text-sm text-[var(--c-t27ae60)]">{t("branding_saved")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be3edf4)] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={18} className="text-[var(--c-t2e86ab)]" />
            <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)]">
              {t("company_info")}
            </h2>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-t1e3a5f)] mb-2">
              {t("company_logo")}
            </label>
            {branding.logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={branding.logoUrl}
                  alt="Company logo"
                  className="h-16 w-16 rounded-lg object-contain border border-[var(--c-be3edf4)]"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="text-[var(--c-te74c3c)] hover:text-[var(--c-tc0392b)]"
                >
                  <Trash2 size={16} />
                  <span className="ml-1">{t("remove_logo")}</span>
                </Button>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center h-28 border-2 border-dashed border-[var(--c-bd3d1c7)] rounded-lg cursor-pointer hover:border-[var(--c-b2e86ab)] hover:bg-[var(--c-sf1f5f8)] transition-colors ${
                  uploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Upload size={24} className="text-[var(--c-t6b7b8d)] mb-2" />
                <span className="text-sm text-[var(--c-t6b7b8d)]">
                  {uploading ? t("branding_page.uploading") : t("upload_logo")}
                </span>
                <span className="text-xs text-[var(--c-t9aabbf)] mt-1">
                  {t("logo_requirements")}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <Input
            label={t("name")}
            value={branding.companyName || ""}
            onChange={(e) =>
              setBranding((prev) => ({ ...prev, companyName: e.target.value }))
            }
            placeholder={company?.name || ""}
          />

          <Input
            label={`${t("slogan")} (${t("optional")})`}
            value={branding.slogan || ""}
            onChange={(e) =>
              setBranding((prev) => ({ ...prev, slogan: e.target.value }))
            }
            placeholder="e.g. Your satisfaction matters"
          />

          <div>
            <label className="block text-sm font-medium text-[var(--c-t1e3a5f)] mb-2">
              {t("company_description")} ({t("optional")})
            </label>
            <textarea
              value={branding.description || ""}
              onChange={(e) =>
                setBranding((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of your company"
              className="w-full px-4 py-2 border border-[var(--c-bd3d1c7)] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] transition-colors resize-none h-24 hover:border-[var(--c-b2e86ab)]"
            />
          </div>

          <Input
            label={`${t("company_address")} (${t("optional")})`}
            value={branding.address || ""}
            onChange={(e) =>
              setBranding((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="123 Main St, City, Country"
          />

          <Input
            label={`${t("contact_number")} (${t("optional")})`}
            value={branding.contactNumber || ""}
            onChange={(e) =>
              setBranding((prev) => ({
                ...prev,
                contactNumber: e.target.value,
              }))
            }
            placeholder="+1 234 567 890"
          />

          <Input
            label={`${t("contact_email")} (${t("optional")})`}
            type="email"
            value={branding.contactEmail || ""}
            onChange={(e) =>
              setBranding((prev) => ({
                ...prev,
                contactEmail: e.target.value,
              }))
            }
            placeholder="contact@company.com"
          />
        </div>

        {/* Color Theme */}
        <div className="space-y-6">
          <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be3edf4)] shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={18} className="text-[var(--c-t2e86ab)]" />
              <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)]">
                {t("color_theme")}
              </h2>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-[var(--c-t1e3a5f)] mb-2">
                {t("primary_color")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor || "#2E86AB"}
                  onChange={(e) =>
                    handleColorChange("primaryColor", e.target.value)
                  }
                  className="w-12 h-12 rounded-lg border border-[var(--c-bd3d1c7)] cursor-pointer p-1"
                />
                <Input
                  value={branding.primaryColor || "#2E86AB"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      handleColorChange("primaryColor", val);
                    } else {
                      setBranding((prev) => ({
                        ...prev,
                        primaryColor: val,
                      }));
                    }
                  }}
                  placeholder="#2E86AB"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-[var(--c-t1e3a5f)] mb-2">
                {t("secondary_color")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.secondaryColor || "#1E3A5F"}
                  onChange={(e) =>
                    handleColorChange("secondaryColor", e.target.value)
                  }
                  className="w-12 h-12 rounded-lg border border-[var(--c-bd3d1c7)] cursor-pointer p-1"
                />
                <Input
                  value={branding.secondaryColor || "#1E3A5F"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      handleColorChange("secondaryColor", val);
                    } else {
                      setBranding((prev) => ({
                        ...prev,
                        secondaryColor: val,
                      }));
                    }
                  }}
                  placeholder="#1E3A5F"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <p className="text-xs text-[var(--c-t6b7b8d)] font-medium uppercase tracking-wide">
                {t("branding_page.auto_variants")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { label: "Light", color: theme.primaryLight },
                  { label: "Primary", color: theme.primary },
                  { label: "Dark", color: theme.primaryDark },
                  { label: "Bg", color: theme.primaryBg },
                  { label: "Border", color: theme.primaryBorder },
                ].map((swatch) => (
                  <div key={swatch.label} className="text-center">
                    <div
                      className="h-8 rounded-md border border-[var(--c-be3edf4)]"
                      style={{ backgroundColor: swatch.color }}
                    />
                    <span className="text-[10px] text-[var(--c-t6b7b8d)]">
                      {swatch.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Light", color: theme.secondaryLight },
                  { label: "Secondary", color: theme.secondary },
                  { label: "Dark", color: theme.secondaryDark },
                ].map((swatch) => (
                  <div key={swatch.label} className="text-center">
                    <div
                      className="h-8 rounded-md border border-[var(--c-be3edf4)]"
                      style={{ backgroundColor: swatch.color }}
                    />
                    <span className="text-[10px] text-[var(--c-t6b7b8d)]">
                      {swatch.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be3edf4)] shadow-sm p-6">
            <p className="text-xs text-[var(--c-t6b7b8d)] font-medium uppercase tracking-wide mb-4">
              {t("preview")}
            </p>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: theme.primaryBorder }}
            >
              {/* Simulated branded header */}
              <div
                className="p-4 flex items-center gap-3"
                style={{ backgroundColor: theme.primaryBg }}
              >
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.textOnPrimary,
                    }}
                  >
                    {(branding.companyName || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: theme.secondary }}
                  >
                    {branding.companyName || "Company Name"}
                  </p>
                  {branding.slogan && (
                    <p className="text-xs" style={{ color: theme.primary }}>
                      {branding.slogan}
                    </p>
                  )}
                </div>
              </div>

              {/* Simulated form body */}
              <div className="p-4 space-y-3">
                <div
                  className="h-3 rounded-full w-3/4"
                  style={{ backgroundColor: theme.primaryBorder }}
                />
                <div
                  className="h-8 rounded-lg border w-full"
                  style={{ borderColor: theme.primaryBorder }}
                />
                <div
                  className="h-3 rounded-full w-1/2"
                  style={{ backgroundColor: theme.primaryBorder }}
                />
                <div
                  className="h-8 rounded-lg border w-full"
                  style={{ borderColor: theme.primaryBorder }}
                />
                <button
                  className="w-full h-9 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.textOnPrimary,
                  }}
                >
                  {t("submit")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink, Share2, Radio, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, LoadingSpinner } from '../../../components/Shared';
import { useAuth } from '../../../hooks/useAuth';
import { addAuditLog, getCompany, getCompanySubmissions, updateCompanyPublicFeedSettings } from '../../../lib/firestore';
import { getAppOrigin } from '../../../lib/app-url';
import { generateBoardSlug } from '../../../lib/utils';
import type { Company } from '../../../types';

const MESSAGE_LIMIT = 200;

type PublicFeedForm = {
  showPublicFeed: boolean;
  companySlug: string;
  publicFeedTitle: string;
  publicFeedMessage: string;
  showPublicFeedbackLink: boolean;
};

export function CompanySettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<PublicFeedForm>({
    showPublicFeed: false,
    companySlug: '',
    publicFeedTitle: '',
    publicFeedMessage: '',
    showPublicFeedbackLink: true,
  });
  const [resolvedCount, setResolvedCount] = useState(0);
  const [resolutionRate, setResolutionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `${t('company_settings.title')} | FeedSolve`;
  }, [t]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.companyId) {
        setLoading(false);
        return;
      }

      try {
        const companyData = await getCompany(user.companyId);
        if (!companyData) return;
        const fallbackSlug = companyData.companySlug || generateBoardSlug(companyData.name);
        setCompany(companyData);
        setForm({
          showPublicFeed: companyData.showPublicFeed ?? false,
          companySlug: fallbackSlug,
          publicFeedTitle: companyData.publicFeedTitle || '',
          publicFeedMessage: companyData.publicFeedMessage || '',
          showPublicFeedbackLink: companyData.showPublicFeedbackLink ?? true,
        });

        const submissions = await getCompanySubmissions(user.companyId, 500);
        const resolved = submissions.filter((submission) => submission.status === 'resolved' || submission.status === 'closed').length;
        setResolvedCount(resolved);
        setResolutionRate(submissions.length ? Math.round((resolved / submissions.length) * 100) : 0);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.companyId]);

  const savedSlug = company?.companySlug || '';
  const currentSafeSlug = generateBoardSlug(form.companySlug || company?.name || '');
  const hasUnsavedSlug = Boolean(currentSafeSlug && savedSlug && currentSafeSlug !== savedSlug);
  const appOrigin = useMemo(() => getAppOrigin(), []);
  const appHostname = useMemo(() => {
    try {
      return new URL(appOrigin).hostname;
    } catch {
      return appOrigin.replace(/^https?:\/\//, '');
    }
  }, [appOrigin]);
  const previewUrl = useMemo(() => `${appOrigin}/r/${currentSafeSlug || 'your-slug'}`, [appOrigin, currentSafeSlug]);
  const defaultTitle = `${company?.branding?.companyName || company?.name || 'Your Company'} Feedback Transparency`;

  const handleSave = async () => {
    if (!user?.companyId || !company) return;
    const safeSlug = generateBoardSlug(form.companySlug || company.name);
    if (!safeSlug) {
      toast.error(t('company_settings.slug_error'));
      return;
    }

    setSaving(true);
    try {
      const nextSettings = {
        showPublicFeed: form.showPublicFeed,
        companySlug: safeSlug,
        publicFeedTitle: form.publicFeedTitle.trim() || null,
        publicFeedMessage: form.publicFeedMessage.trim() || null,
        showPublicFeedbackLink: form.showPublicFeedbackLink,
      };
      await updateCompanyPublicFeedSettings(user.companyId, nextSettings);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: form.showPublicFeed ? `Updated public resolution feed ${safeSlug}` : 'Disabled public resolution feed',
        resourceType: 'settings',
        resourceId: user.companyId,
        resourceName: 'Public Resolution Feed',
        details: nextSettings,
      });
      setCompany((prev) => (prev ? { ...prev, ...nextSettings } : prev));
      setForm((prev) => ({ ...prev, companySlug: safeSlug }));
      toast.success(t('company_settings.feed_saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('company_settings.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (hasUnsavedSlug) {
      toast.error(t('company_settings.save_slug_first'));
      return;
    }
    await navigator.clipboard.writeText(previewUrl);
    toast.success(t('company_settings.link_copied'));
  };

  const shareOnLinkedIn = () => {
    if (hasUnsavedSlug) {
      toast.error(t('company_settings.save_slug_first'));
      return;
    }
    const companyName = company?.branding?.companyName || company?.name || 'We';
    const text = `${companyName} has resolved ${resolvedCount} submissions with a ${resolutionRate}% resolution rate. See our Feedback Transparency page powered by FeedSolve: ${previewUrl}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(previewUrl)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      <div className="border-b border-[var(--c-be8ecf0)] bg-[var(--c-sffffff)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">{t('company_settings.title')}</h1>
          <p className="mt-1 text-sm text-[var(--c-t6b7b8d)]">{t('company_settings.subtitle')}</p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-[var(--c-bd3d1c7)] bg-[var(--c-sffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Radio size={20} className="text-[var(--c-t2e86ab)]" />
                <h2 className="text-xl font-bold text-[var(--c-t1e3a5f)]">{t('company_settings.public_feed')}</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--c-t6b7b8d)]">
                {t('company_settings.public_feed_desc', { hostname: appHostname })}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.showPublicFeed}
                onChange={(event) => setForm((prev) => ({ ...prev, showPublicFeed: event.target.checked }))}
              />
              <span className="h-7 w-12 flex-shrink-0 rounded-full bg-[var(--c-sd3d1c7)] transition peer-checked:bg-[var(--c-s27ae60)] after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-[var(--c-sffffff)] after:transition peer-checked:after:translate-x-5" />
              <span className="ml-3 text-sm font-semibold text-[var(--c-t1e3a5f)] whitespace-nowrap">{t('company_settings.show_public_feed')}</span>
            </label>
          </div>

          {form.showPublicFeed && (
            <div className="mt-6 space-y-5 border-t border-[var(--c-beef2f5)] pt-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <Input
                  label="Preview URL"
                  value={previewUrl}
                  readOnly
                  helperText={hasUnsavedSlug ? t('company_settings.save_slug_hint') : t('company_settings.preview_hint')}
                />
                <a href={hasUnsavedSlug ? undefined : previewUrl} target="_blank" rel="noreferrer" aria-disabled={hasUnsavedSlug} className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--c-bd3d1c7)] bg-[var(--c-sffffff)] px-4 py-2.5 text-sm font-medium text-[var(--c-t1e3a5f)] hover:bg-[var(--c-sf1f5f8)] ${hasUnsavedSlug ? 'pointer-events-none opacity-50' : ''}`}>
                  {t('preview')} <ExternalLink size={16} />
                </a>
                <Button type="button" variant="secondary" onClick={copyLink} disabled={hasUnsavedSlug}><Copy size={16} /> {t('company_settings.copy_link')}</Button>
              </div>

              <Input
                label={t('company_settings.public_slug')}
                value={form.companySlug}
                onChange={(event) => setForm((prev) => ({ ...prev, companySlug: generateBoardSlug(event.target.value) }))}
                helperText={t('company_settings.slug_help')}
              />

              <Input
                label={t('company_settings.custom_title')}
                placeholder={defaultTitle}
                value={form.publicFeedTitle}
                onChange={(event) => setForm((prev) => ({ ...prev, publicFeedTitle: event.target.value }))}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--c-t1e3a5f)]">{t('company_settings.custom_message')}</label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-[var(--c-bd3d1c7)] bg-[var(--c-sffffff)] px-3.5 py-2.5 text-sm text-[var(--c-t1e3a5f)] outline-none transition focus:border-[var(--c-b2e86ab)] focus:ring-2 focus:ring-[var(--c-b2e86ab)]/30"
                  maxLength={MESSAGE_LIMIT}
                  placeholder={t('company_settings.message_placeholder')}
                  value={form.publicFeedMessage}
                  onChange={(event) => setForm((prev) => ({ ...prev, publicFeedMessage: event.target.value.slice(0, MESSAGE_LIMIT) }))}
                />
                <p className="mt-1.5 text-xs text-[var(--c-t6b7b8d)]">{t('company_settings.characters', { count: form.publicFeedMessage.length, limit: MESSAGE_LIMIT })}</p>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-[var(--c-bd3d1c7)] bg-[var(--c-sf1f5f8)] p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[var(--c-bd3d1c7)] text-[var(--c-t2e86ab)]"
                  checked={form.showPublicFeedbackLink}
                  onChange={(event) => setForm((prev) => ({ ...prev, showPublicFeedbackLink: event.target.checked }))}
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--c-t1e3a5f)]">{t('company_settings.show_feedback_link')}</span>
                  <span className="block text-sm text-[var(--c-t6b7b8d)]">{t('company_settings.feedback_link_desc')}</span>
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={handleSave} isLoading={saving}><Save size={16} /> {t('company_settings.save_feed_settings')}</Button>
                <Button type="button" variant="secondary" onClick={shareOnLinkedIn} disabled={hasUnsavedSlug}><Share2 size={16} /> {t('company_settings.share_linkedin')}</Button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[var(--c-beef2f5)] pt-4 text-sm font-medium text-[var(--c-t6b7b8d)]">
            {t('powered_by_feedsolve')}
          </div>
        </section>
      </main>
    </div>
  );
}

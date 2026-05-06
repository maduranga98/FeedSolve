import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Share2, Radio, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, LoadingSpinner } from '../../../components/Shared';
import { useAuth } from '../../../hooks/useAuth';
import { getCompany, getCompanySubmissions, updateCompanyPublicFeedSettings } from '../../../lib/firestore';
import { generateBoardSlug } from '../../../lib/utils';
import type { Company } from '../../../types';

const APP_ORIGIN = import.meta.env.VITE_APP_URL || 'https://feedsolve.com';
const MESSAGE_LIMIT = 200;

type PublicFeedForm = {
  showPublicFeed: boolean;
  companySlug: string;
  publicFeedTitle: string;
  publicFeedMessage: string;
  showPublicFeedbackLink: boolean;
};

export function CompanySettings() {
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
    document.title = 'Company Settings | FeedSolve';
  }, []);

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
        const resolved = submissions.filter((submission) => submission.status === 'resolved').length;
        setResolvedCount(resolved);
        setResolutionRate(submissions.length ? Math.round((resolved / submissions.length) * 100) : 0);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.companyId]);

  const previewUrl = useMemo(() => `${APP_ORIGIN}/r/${form.companySlug || 'your-slug'}`, [form.companySlug]);
  const defaultTitle = `${company?.branding?.companyName || company?.name || 'Your Company'} Feedback Transparency`;

  const handleSave = async () => {
    if (!user?.companyId || !company) return;
    const safeSlug = generateBoardSlug(form.companySlug || company.name);
    if (!safeSlug) {
      toast.error('Please enter a URL-safe public feed slug.');
      return;
    }

    setSaving(true);
    try {
      await updateCompanyPublicFeedSettings(user.companyId, {
        showPublicFeed: form.showPublicFeed,
        companySlug: safeSlug,
        publicFeedTitle: form.publicFeedTitle.trim() || null,
        publicFeedMessage: form.publicFeedMessage.trim() || null,
        showPublicFeedbackLink: form.showPublicFeedbackLink,
      });
      setForm((prev) => ({ ...prev, companySlug: safeSlug }));
      toast.success('Public feed settings saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save public feed settings.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(previewUrl);
    toast.success('Public feed link copied.');
  };

  const shareOnLinkedIn = () => {
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
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="border-b border-[#E8ECF0] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Company Settings</h1>
          <p className="mt-1 text-sm text-[#6B7B8D]">Manage public accountability options for your FeedSolve workspace.</p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-[#D3D1C7] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Radio size={20} className="text-[#2E86AB]" />
                <h2 className="text-xl font-bold text-[#1E3A5F]">Public Resolution Feed</h2>
              </div>
              <p className="mt-2 text-sm text-[#6B7B8D]">
                Share your resolution stats publicly at feedsolve.com/r/your-slug.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.showPublicFeed}
                onChange={(event) => setForm((prev) => ({ ...prev, showPublicFeed: event.target.checked }))}
              />
              <span className="h-7 w-12 rounded-full bg-[#D3D1C7] transition peer-checked:bg-[#27AE60] after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
              <span className="ml-3 text-sm font-semibold text-[#1E3A5F]">Show public resolution feed</span>
            </label>
          </div>

          {form.showPublicFeed && (
            <div className="mt-6 space-y-5 border-t border-[#EEF2F5] pt-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <Input
                  label="Preview URL"
                  value={previewUrl}
                  readOnly
                  helperText="This link opens in a new tab and is visible without sign-in."
                />
                <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D3D1C7] bg-white px-4 py-2.5 text-sm font-medium text-[#1E3A5F] hover:bg-[#F8FAFB]">
                  Preview <ExternalLink size={16} />
                </a>
                <Button type="button" variant="secondary" onClick={copyLink}><Copy size={16} /> Copy Link</Button>
              </div>

              <Input
                label="Public feed slug"
                value={form.companySlug}
                onChange={(event) => setForm((prev) => ({ ...prev, companySlug: generateBoardSlug(event.target.value) }))}
                helperText="Use lowercase letters, numbers, and hyphens. Slugs should be unique."
              />

              <Input
                label="Custom title (optional)"
                placeholder={defaultTitle}
                value={form.publicFeedTitle}
                onChange={(event) => setForm((prev) => ({ ...prev, publicFeedTitle: event.target.value }))}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1E3A5F]">Custom message (optional)</label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-[#D3D1C7] bg-white px-3.5 py-2.5 text-sm text-[#1E3A5F] outline-none transition focus:border-[#2E86AB] focus:ring-2 focus:ring-[#2E86AB]/30"
                  maxLength={MESSAGE_LIMIT}
                  placeholder="Add a short message about how your team handles feedback."
                  value={form.publicFeedMessage}
                  onChange={(event) => setForm((prev) => ({ ...prev, publicFeedMessage: event.target.value.slice(0, MESSAGE_LIMIT) }))}
                />
                <p className="mt-1.5 text-xs text-[#6B7B8D]">{form.publicFeedMessage.length}/{MESSAGE_LIMIT} characters</p>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-[#D3D1C7] bg-[#F8FAFB] p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[#D3D1C7] text-[#2E86AB]"
                  checked={form.showPublicFeedbackLink}
                  onChange={(event) => setForm((prev) => ({ ...prev, showPublicFeedbackLink: event.target.checked }))}
                />
                <span>
                  <span className="block text-sm font-semibold text-[#1E3A5F]">Show “Submit feedback” footer link</span>
                  <span className="block text-sm text-[#6B7B8D]">Let visitors jump from the public feed to your feedback boards.</span>
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={handleSave} isLoading={saving}><Save size={16} /> Save public feed settings</Button>
                <Button type="button" variant="secondary" onClick={shareOnLinkedIn}><Share2 size={16} /> Share on LinkedIn</Button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[#EEF2F5] pt-4 text-sm font-medium text-[#6B7B8D]">
            Powered by FeedSolve
          </div>
        </section>
      </main>
    </div>
  );
}

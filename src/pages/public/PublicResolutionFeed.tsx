import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ExternalLink, Radio, ShieldCheck } from 'lucide-react';
import type { Company, Submission, Board } from '../../types';
import {
  getCompanyBoards,
  getCompanyBySlug,
  getPublicFeedSubmissions,
  getRecentResolvedSubmissions,
} from '../../lib/firestore';
import { ResolutionMetricCard } from '../../components/public/ResolutionMetricCard';
import { RecentActivityFeed } from '../../components/public/RecentActivityFeed';
import { getAppOrigin } from '../../lib/app-url';


function toDate(value: Submission['createdAt'] | Date | string | number | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if ('toDate' in value && typeof value.toDate === 'function') return value.toDate();
  return null;
}

function isResolvedSubmission(submission: Submission): boolean {
  return (submission.status === 'resolved' || submission.status === 'closed') && Boolean(submission.resolvedAt);
}

function formatDurationFromHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return 'under 1 hour';
  if (hours < 24) return `${Math.max(1, Math.round(hours))} hour${Math.round(hours) === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

function resolutionTone(rate: number): 'success' | 'amber' | 'danger' {
  if (rate > 80) return 'success';
  if (rate >= 50) return 'amber';
  return 'danger';
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F1F5F8] px-4 py-10">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <div className="h-48 rounded-2xl bg-white" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 rounded-xl bg-white" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-white" />
      </div>
    </div>
  );
}

export function PublicResolutionFeed() {
  const { t } = useTranslation();
  const { companySlug } = useParams<{ companySlug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [recentResolved, setRecentResolved] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appOrigin = useMemo(() => getAppOrigin(), []);
  const feedsolveOgImage = useMemo(() => `${appOrigin}/og-feedsolve.png`, [appOrigin]);

  useEffect(() => {
    const loadPublicFeed = async () => {
      if (!companySlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const companyData = await getCompanyBySlug(companySlug);
        if (!companyData) {
          setNotFound(true);
          return;
        }

        setCompany(companyData);
        if (!companyData.showPublicFeed) return;

        const [publicSubmissions, recent, companyBoards] = await Promise.all([
          getPublicFeedSubmissions(companyData.id),
          getRecentResolvedSubmissions(companyData.id, 10),
          getCompanyBoards(companyData.id),
        ]);
        setSubmissions(publicSubmissions);
        setRecentResolved(recent);
        setBoards(companyBoards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this public feed.');
      } finally {
        setLoading(false);
      }
    };

    loadPublicFeed();
  }, [companySlug]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolved = submissions.filter(isResolvedSubmission);
    const resolutionRate = submissions.length ? Math.round((resolved.length / submissions.length) * 100) : 0;

    const resolutionDurations = resolved.flatMap((submission) => {
      const createdAt = toDate(submission.createdAt);
      const resolvedAt = toDate(submission.resolvedAt);
      if (!createdAt || !resolvedAt) return [];
      return [Math.max(0, resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)];
    });
    const totalResolvedHours = resolutionDurations.reduce((sum, hours) => sum + hours, 0);

    const thisMonth = submissions.filter((submission) => {
      const createdAt = toDate(submission.createdAt);
      return createdAt ? createdAt >= monthStart : false;
    });
    const resolvedThisMonth = thisMonth.filter(isResolvedSubmission);

    return {
      resolutionRate,
      resolvedCount: resolved.length,
      averageResolutionTime: resolutionDurations.length ? formatDurationFromHours(totalResolvedHours / resolutionDurations.length) : t('public_feed.no_resolved_data'),
      activeBoards: boards.length,
      submissionsThisMonth: thisMonth.length,
      resolvedThisMonth: resolvedThisMonth.length,
      monthlyResolutionRate: thisMonth.length ? Math.round((resolvedThisMonth.length / thisMonth.length) * 100) : 0,
    };
  }, [boards.length, submissions]);

  useEffect(() => {
    if (!company) return;
    const title = `${company.name} — Feedback Transparency | FeedSolve`;
    const description = `${company.name} has resolved ${stats.resolvedCount} submissions with a ${stats.resolutionRate}% resolution rate. Powered by FeedSolve.`;
    document.title = title;

    const upsertMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', feedsolveOgImage);
  }, [company, feedsolveOgImage, stats.resolutionRate, stats.resolvedCount]);

  if (loading) return <LoadingSkeleton />;

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F8] px-4">
        <div className="max-w-md rounded-2xl border border-[#D3D1C7] bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-[#1E3A5F]">{t('public_feed.not_found_title')}</h1>
          <p className="mt-3 text-[#6B7B8D]">{t('public_feed.not_found_desc')}</p>
          <a className="mt-6 inline-flex rounded-lg bg-[#2E86AB] px-5 py-2.5 font-medium text-white" href="https://feedsolve.com">
            {t('public_feed.visit_feedsolve')}
          </a>
        </div>
      </div>
    );
  }

  if (!company?.showPublicFeed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F8] px-4">
        <div className="max-w-lg rounded-2xl border border-[#D3D1C7] bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-[#2E86AB]" />
          <h1 className="mt-4 text-2xl font-bold text-[#1E3A5F]">
            {t('public_feed.feed_disabled', { name: company?.name || 'This company' })}
          </h1>
          <p className="mt-3 text-[#6B7B8D]">{t('public_feed.feed_disabled_desc')}</p>
          <a className="mt-6 inline-flex rounded-lg bg-[#2E86AB] px-5 py-2.5 font-medium text-white" href="https://feedsolve.com">
            {t('powered_by_feedsolve')}
          </a>
        </div>
      </div>
    );
  }

  const displayName = company.branding?.companyName || company.name;
  const publicTitle = company.publicFeedTitle || `${displayName} Feedback Transparency`;
  const firstBoard = boards[0];
  const submitLink = firstBoard ? `${appOrigin}/submit/${firstBoard.slug}` : null;

  return (
    <div className="min-h-screen bg-[#F1F5F8] text-[#1E3A5F]">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="overflow-hidden rounded-2xl border border-[#D3D1C7] bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2E86AB] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {company.branding?.logoUrl ? (
                  <img src={company.branding.logoUrl} alt={`${displayName} logo`} className="h-16 w-16 rounded-xl bg-white object-contain p-2" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white/80">{displayName}</p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{publicTitle}</h1>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">
                <Radio size={16} className="text-[#27AE60]" /> {t('public_feed.updated_live')}
              </div>
            </div>
            {company.publicFeedMessage && <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">{company.publicFeedMessage}</p>}
          </div>
          <div className="flex flex-col gap-3 px-6 py-4 text-sm text-[#6B7B8D] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#27AE60]" /> {t('public_feed.public_metrics')}</span>
            <span>{t('powered_by_feedsolve')}</span>
          </div>
        </header>

        {error && <div className="mt-6 rounded-lg border border-[#F2B7B0] bg-[#FDECEC] p-4 text-[#C0392B]">{error}</div>}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <ResolutionMetricCard label={t('public_feed.resolution_rate')} value={`${stats.resolutionRate}%`} tone={resolutionTone(stats.resolutionRate)} isHero helperText={t('public_feed.helper_resolution_rate')} />
          <ResolutionMetricCard label={t('public_feed.resolved_all_time')} value={stats.resolvedCount} tone="primary" />
          <ResolutionMetricCard label={t('public_feed.avg_resolution_time')} value={stats.averageResolutionTime} tone="neutral" />
          <ResolutionMetricCard label={t('public_feed.active_boards')} value={stats.activeBoards} tone="neutral" />
        </section>

        <section className="mt-6 rounded-xl border border-[#D3D1C7] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{t('public_feed.this_month')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ResolutionMetricCard label={t('public_feed.submissions_received')} value={stats.submissionsThisMonth} tone="neutral" />
            <ResolutionMetricCard label={t('public_feed.submissions_resolved')} value={stats.resolvedThisMonth} tone="success" />
            <ResolutionMetricCard label={t('public_feed.monthly_resolution_rate')} value={`${stats.monthlyResolutionRate}%`} tone={resolutionTone(stats.monthlyResolutionRate)} />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{t('public_feed.recent_resolved')}</h2>
            <p className="mt-1 text-sm text-[#6B7B8D]">{t('public_feed.recent_resolved_desc')}</p>
          </div>
          <RecentActivityFeed submissions={recentResolved} formatResolutionTime={(submission) => {
            const createdAt = toDate(submission.createdAt);
            const resolvedAt = toDate(submission.resolvedAt);
            if (!createdAt || !resolvedAt) return t('public_feed.a_short_time');
            return formatDurationFromHours((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
          }} />
        </section>
      </main>

      <footer className="border-t border-[#D3D1C7] bg-white px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-sm text-[#6B7B8D] sm:flex-row sm:items-center sm:justify-between">
          <a href="https://feedsolve.com" className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D3D1C7] px-4 py-2 font-semibold text-[#1E3A5F]">
            {t('powered_by_feedsolve')} <ExternalLink size={14} />
          </a>
          {company.showPublicFeedbackLink && submitLink && (
            <a href={submitLink} className="font-semibold text-[#2E86AB]">
              {t('public_feed.submit_feedback_to', { name: displayName })}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}

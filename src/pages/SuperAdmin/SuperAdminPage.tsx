import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Search, X } from 'lucide-react';
import { LoadingSpinner } from '../../components/Shared';
import { downloadTextFile } from '../../lib/download';
import {
  useSuperAdminOverview,
  type AdminCompany,
  type Engagement,
} from '../../hooks/useSuperAdmin';

type SortKey = 'createdAt' | 'lastSubmissionAt' | 'totalSubmissions' | 'boardCount' | 'revenueCents' | 'name';

const ENGAGEMENT: Record<Engagement, { label: string; dot: string; hint: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', hint: 'Submissions in the last 30 days' },
  dormant: { label: 'Dormant', dot: 'bg-amber-500', hint: 'Had submissions, none in 30 days' },
  inactive: { label: 'Inactive', dot: 'bg-rose-500', hint: 'Has boards, never received a submission' },
  not_started: { label: 'Not started', dot: 'bg-stone-400', hint: 'Signed up, no boards created' },
};

const money = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDate = (ms: number | null) => (ms ? dateFmt.format(ms) : '—');

function fmtRelative(ms: number | null) {
  if (!ms) return 'Never';
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function csvCell(value: string | number | null) {
  const s = value === null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(rows: AdminCompany[]) {
  const header = [
    'Company', 'Company email', 'Owner', 'Owner email', 'Plan', 'Billing', 'Status', 'Engagement',
    'Members', 'Boards', 'Total submissions', 'Submissions (30d)', 'Last submission',
    'Last activity', 'Signed up', 'Total revenue (USD)', 'MRR (USD)',
  ];
  const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : '');
  const lines = rows.map((c) =>
    [
      c.name, c.email, c.owner?.name ?? '', c.owner?.email ?? '', c.tier, c.billing, c.subscriptionStatus,
      c.engagement, c.memberCount, c.boardCount, c.totalSubmissions, c.submissionsLast30Days,
      iso(c.lastSubmissionAt), iso(c.lastActivityAt), iso(c.createdAt),
      (c.revenueCents / 100).toFixed(2), (c.mrrCents / 100).toFixed(2),
    ].map(csvCell).join(','),
  );
  downloadTextFile([header.join(','), ...lines].join('\n'), `feedsolve-companies-${Date.now()}.csv`, 'text/csv;charset=utf-8');
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)] p-4">
      <p className="text-xs font-medium text-[var(--c-t78716c)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--c-t1c1917)] tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--c-ta89890)]">{sub}</p>}
    </div>
  );
}

function Th({
  k, children, right, sortKey, sortDir, onSort,
}: {
  k: SortKey; children: string; right?: boolean; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void;
}) {
  return (
    <th scope="col" className={`px-4 py-3 font-medium ${right ? 'text-end' : 'text-start'}`}>
      <button onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-[var(--c-t1c1917)]">
        {children}
        {sortKey === k && <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

function EngagementBadge({ value }: { value: Engagement }) {
  const e = ENGAGEMENT[value];
  return (
    <span title={e.hint} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--c-t1c1917)]">
      <span className={`h-2 w-2 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  );
}

function CompanyDrawer({ company, onClose }: { company: AdminCompany; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="relative h-full w-full max-w-md overflow-y-auto bg-[var(--c-sffffff)] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[var(--c-t1c1917)]">{company.name}</h2>
            <p className="truncate text-sm text-[var(--c-t78716c)]">{company.email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)]">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Submissions" value={company.totalSubmissions} sub={`${company.submissionsLast30Days} in 30d`} />
          <Stat label="Revenue" value={money(company.revenueCents)} sub={`${money(company.mrrCents)} MRR`} />
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {[
            ['Engagement', <EngagementBadge key="e" value={company.engagement} />],
            ['Plan', `${company.tier} · ${company.billing} · ${company.subscriptionStatus}`],
            ['Signed up', fmtDate(company.createdAt)],
            ['Last submission', fmtDate(company.lastSubmissionAt)],
            ['Last activity', fmtRelative(company.lastActivityAt)],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between gap-4">
              <dt className="text-[var(--c-t78716c)]">{k}</dt>
              <dd className="text-end font-medium capitalize text-[var(--c-t1c1917)]">{v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-6 text-sm font-semibold text-[var(--c-t1c1917)]">Boards ({company.boards.length})</h3>
        <ul className="mt-2 divide-y divide-[var(--c-be0d6cf)] rounded-2xl border border-[var(--c-be0d6cf)]">
          {company.boards.length === 0 && <li className="p-3 text-sm text-[var(--c-ta89890)]">No boards created</li>}
          {company.boards.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="min-w-0 truncate text-[var(--c-t1c1917)]">{b.name}</span>
              <span className="shrink-0 tabular-nums text-[var(--c-t78716c)]">{b.submissionCount} · {fmtDate(b.createdAt)}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-semibold text-[var(--c-t1c1917)]">People ({company.members.length})</h3>
        <ul className="mt-2 divide-y divide-[var(--c-be0d6cf)] rounded-2xl border border-[var(--c-be0d6cf)]">
          {company.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-[var(--c-t1c1917)]">{m.name || m.email}</p>
                <p className="truncate text-xs text-[var(--c-ta89890)]">{m.email}</p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs font-medium capitalize text-[var(--c-t78716c)]">{m.role}</p>
                <p className="text-xs text-[var(--c-ta89890)]">{fmtRelative(m.lastActive)}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export function SuperAdminPage() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useSuperAdminOverview();
  const [query, setQuery] = useState('');
  const [engagement, setEngagement] = useState<Engagement | 'all'>('all');
  const [tier, setTier] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Super Admin | FeedSolve';
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const filtered = data.companies.filter(
      (c) =>
        (engagement === 'all' || c.engagement === engagement) &&
        (tier === 'all' || c.tier === tier) &&
        (!q || [c.name, c.email, c.owner?.name, c.owner?.email].some((v) => v?.toLowerCase().includes(q))),
    );
    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir;
    });
  }, [data, query, engagement, tier, sortKey, sortDir]);

  const selected = data?.companies.find((c) => c.id === selectedId) ?? null;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const inputCls =
    'rounded-xl border border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)] px-3 py-2 text-sm text-[var(--c-t1c1917)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-bc0694a)]';

  return (
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      <header className="border-b border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <button onClick={() => navigate('/dashboard')} aria-label="Back to app" className="rounded-xl p-2 text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)]">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[var(--c-t1c1917)]">Super Admin</h1>
            {data && <p className="text-xs text-[var(--c-ta89890)]">Updated {new Date(data.generatedAt).toLocaleTimeString()}</p>}
          </div>
          <div className="ms-auto flex gap-2">
            <button onClick={() => data && exportCsv(rows)} disabled={!rows.length} className={`${inputCls} inline-flex items-center gap-2 disabled:opacity-50`}>
              <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={refresh} disabled={loading} className={`${inputCls} inline-flex items-center gap-2 disabled:opacity-50`}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

        {data?.warnings && data.warnings.length > 0 && (
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Some figures are incomplete ({data.warnings.join(', ')}). This is usually a Firestore index that is not deployed yet:
            run <code>firebase deploy --only firestore:indexes</code>, wait for it to build, then refresh.
          </div>
        )}

        {loading && !data && (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
        )}

        {data && (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Stat label="Companies" value={data.totals.companies} sub={`${data.totals.paidCompanies} paid`} />
              <Stat label="Users" value={data.totals.users} />
              <Stat label="Boards" value={data.totals.boards} />
              <Stat label="Submissions" value={data.totals.submissions.toLocaleString()} />
              <Stat label="Total revenue" value={money(data.totals.revenueCents)} />
              <Stat label="MRR" value={money(data.totals.mrrCents)} />
            </section>

            <section className="flex flex-wrap gap-2" aria-label="Engagement filter">
              {(['all', 'active', 'dormant', 'inactive', 'not_started'] as const).map((key) => {
                const count = key === 'all' ? data.totals.companies : data.totals.engagement[key];
                const on = engagement === key;
                return (
                  <button
                    key={key}
                    onClick={() => setEngagement(key)}
                    aria-pressed={on}
                    title={key === 'all' ? undefined : ENGAGEMENT[key].hint}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      on
                        ? 'border-[var(--c-bc0694a)] bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]'
                        : 'border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)] text-[var(--c-t78716c)] hover:text-[var(--c-t1c1917)]'
                    }`}
                  >
                    {key !== 'all' && <span className={`h-2 w-2 rounded-full ${ENGAGEMENT[key].dot}`} />}
                    {key === 'all' ? 'All' : ENGAGEMENT[key].label}
                    <span className="tabular-nums opacity-70">{count}</span>
                  </button>
                );
              })}
            </section>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--c-ta89890)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company, owner or email"
                  aria-label="Search companies"
                  className={`${inputCls} w-full ps-9`}
                />
              </div>
              <select value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Plan filter" className={inputCls}>
                <option value="all">All plans</option>
                {['free', 'starter', 'growth', 'business'].map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)]">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="border-b border-[var(--c-be0d6cf)] text-xs text-[var(--c-t78716c)]">
                  <tr>
                    <Th k="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Company</Th>
                    <th scope="col" className="px-4 py-3 text-start font-medium">Owner</th>
                    <th scope="col" className="px-4 py-3 text-start font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 text-start font-medium">Plan</th>
                    <Th k="boardCount" right sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Boards</Th>
                    <Th k="totalSubmissions" right sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Submissions</Th>
                    <Th k="lastSubmissionAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Last submission</Th>
                    <Th k="revenueCents" right sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Revenue</Th>
                    <Th k="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Signed up</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-be0d6cf)]">
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-[var(--c-ta89890)]">No companies match</td></tr>
                  )}
                  {rows.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="cursor-pointer hover:bg-[var(--c-sf0eae5)]"
                    >
                      <td className="max-w-[14rem] px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}
                          className="block max-w-full truncate text-start font-medium text-[var(--c-t1c1917)]"
                        >
                          {c.name}
                        </button>
                        <p className="text-xs text-[var(--c-ta89890)]">{c.memberCount} member{c.memberCount === 1 ? '' : 's'}</p>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3">
                        <p className="truncate text-[var(--c-t1c1917)]">{c.owner?.name || '—'}</p>
                        <p className="truncate text-xs text-[var(--c-ta89890)]">{c.owner?.email}</p>
                      </td>
                      <td className="px-4 py-3"><EngagementBadge value={c.engagement} /></td>
                      <td className="px-4 py-3 capitalize text-[var(--c-t78716c)]">
                        {c.tier}
                        {c.tier !== 'free' && c.subscriptionStatus !== 'active' && (
                          <span className="ms-1 text-xs text-rose-600">({c.subscriptionStatus.replace('_', ' ')})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">{c.boardCount}</td>
                      <td className="px-4 py-3 text-end tabular-nums">
                        {c.totalSubmissions.toLocaleString()}
                        <span className="block text-xs text-[var(--c-ta89890)]">{c.submissionsLast30Days} in 30d</span>
                      </td>
                      <td className="px-4 py-3">
                        {fmtRelative(c.lastSubmissionAt)}
                        <span className="block text-xs text-[var(--c-ta89890)]">{fmtDate(c.lastSubmissionAt)}</span>
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">{money(c.revenueCents)}</td>
                      <td className="px-4 py-3 text-[var(--c-t78716c)]">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--c-ta89890)]">
              Showing {rows.length} of {data.totals.companies}. Revenue is the sum of paid Stripe invoices; MRR is
              estimated from list prices of active paid plans.
            </p>
          </>
        )}
      </main>

      {selected && <CompanyDrawer company={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

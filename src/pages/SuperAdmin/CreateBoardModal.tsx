import { useEffect, useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import {
  createBoardAsSuperAdmin,
  type AdminCompany,
  type CreateBoardResult,
} from '../../hooks/useSuperAdmin';
import { SubmissionFieldsEditor } from '../../components/boards/SubmissionFieldsEditor';
import type { SubmissionFormDraft } from '../../components/boards/SubmissionFieldsEditor';
import {
  buildSubmissionConfig,
  normalizeSubmissionFields,
  validateSubmissionFields,
} from '../../lib/submission-fields';

type Role = 'admin' | 'manager' | 'viewer';
interface UserRow { email: string; role: Role }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_FORM_DRAFT: SubmissionFormDraft = {
  useCustomFields: false,
  appliesTo: 'internal',
  fields: [],
  showCategorySelector: true,
  allowAttachments: true,
  showTrackingCodeToSubmitter: true,
};

const field =
  'w-full rounded-xl border border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)] px-3 py-2 text-sm text-[var(--c-t1c1917)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-bc0694a)]';

interface Props {
  companies: AdminCompany[];
  defaultCompanyId?: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBoardModal({ companies, defaultCompanyId, onClose, onCreated }: Props) {
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formDraft, setFormDraft] = useState<SubmissionFormDraft>(DEFAULT_FORM_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateBoardResult | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const company = companies.find((c) => c.id === companyId);
  const updateUser = (i: number, patch: Partial<UserRow>) =>
    setUsers((u) => u.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanUsers = users
      .map((u) => ({ ...u, email: u.email.trim().toLowerCase() }))
      .filter((u) => u.email);
    const bad = cleanUsers.find((u) => !EMAIL_RE.test(u.email));
    if (!companyId) return setError('Select a company');
    if (name.trim().length < 2) return setError('Board name must be at least 2 characters');
    if (bad) return setError(`Invalid email: ${bad.email}`);

    // Same normalisation and validation as the board's Submission Form settings. Left at its
    // defaults the board is created exactly as before, with no submissionConfig at all.
    const normalizedFields = normalizeSubmissionFields(formDraft.fields);
    if (formDraft.useCustomFields) {
      const formError = validateSubmissionFields(normalizedFields, formDraft.appliesTo);
      if (formError) {
        setFormOpen(true);
        return setError(formError);
      }
    }
    const formChanged =
      formDraft.useCustomFields ||
      normalizedFields.length > 0 ||
      !formDraft.showCategorySelector ||
      !formDraft.allowAttachments ||
      !formDraft.showTrackingCodeToSubmitter;
    const submissionConfig = formChanged
      ? buildSubmissionConfig(formDraft.useCustomFields, formDraft.appliesTo, normalizedFields, {
          showCategorySelector: formDraft.showCategorySelector,
          allowAttachments: formDraft.allowAttachments,
          showTrackingCodeToSubmitter: formDraft.showTrackingCodeToSubmitter,
        })
      : undefined;

    setSubmitting(true);
    try {
      const res = await createBoardAsSuperAdmin({
        companyId,
        name: name.trim(),
        description: description.trim(),
        categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
        isAnonymousAllowed: anonymous,
        ...(submissionConfig ? { submissionConfig } : {}),
        users: cleanUsers,
      });
      setResult(res);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Create board" className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[var(--c-sffffff)] p-6 shadow-xl sm:rounded-3xl ${formOpen ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--c-t1c1917)]">{result ? 'Board created' : 'New board'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)]">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="mt-4 space-y-4 text-sm">
            <p className="text-[var(--c-t1c1917)]">
              <span className="font-medium">{result.name}</span> was added to{' '}
              <span className="font-medium">{company?.name}</span>.
            </p>
            <p className="break-all rounded-xl bg-[var(--c-sf0eae5)] px-3 py-2 text-xs text-[var(--c-t78716c)]">/submit/{result.slug}</p>
            {result.invites.length > 0 && (
              <ul className="divide-y divide-[var(--c-be0d6cf)] rounded-2xl border border-[var(--c-be0d6cf)]">
                {result.invites.map((i) => (
                  <li key={i.email} className="flex items-center justify-between gap-3 p-3">
                    <span className="min-w-0 truncate text-[var(--c-t1c1917)]">{i.email}</span>
                    <span className={`shrink-0 text-xs font-medium ${i.status === 'invited' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {i.status === 'invited' ? 'Invite sent' : i.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={onClose} className="w-full rounded-xl bg-[var(--c-bc0694a)] px-4 py-2.5 text-sm font-medium text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--c-t1c1917)]">Company</span>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={field} required>
                <option value="">Select a company…</option>
                {[...companies].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.email}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--c-t1c1917)]">Board name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={field} required />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--c-t1c1917)]">Description <span className="font-normal text-[var(--c-ta89890)]">(optional)</span></span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} className={field} />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--c-t1c1917)]">Categories <span className="font-normal text-[var(--c-ta89890)]">(comma separated)</span></span>
              <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="Bug, Idea, Praise" className={field} />
            </label>

            <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Allow anonymous submissions
            </label>

            <div className="rounded-2xl border border-[var(--c-be0d6cf)]">
              <button
                type="button"
                onClick={() => setFormOpen((open) => !open)}
                aria-expanded={formOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
              >
                <span>
                  <span className="block font-medium text-[var(--c-t1c1917)]">
                    Submission form <span className="font-normal text-[var(--c-ta89890)]">(optional)</span>
                  </span>
                  <span className="block text-xs text-[var(--c-t78716c)]">
                    {formDraft.useCustomFields
                      ? `Custom fields on · ${formDraft.fields.length} field${formDraft.fields.length === 1 ? '' : 's'}`
                      : 'Standard Subject / Description form'}
                  </span>
                </span>
                <ChevronDown size={16} className={`shrink-0 text-[var(--c-t78716c)] transition-transform ${formOpen ? 'rotate-180' : ''}`} />
              </button>
              {/* Kept mounted so the draft survives collapsing. */}
              <div hidden={!formOpen} className="border-t border-[var(--c-be0d6cf)] p-4">
                <SubmissionFieldsEditor value={formDraft} onChange={setFormDraft} />
                <p className="mt-3 text-xs text-[var(--c-t78716c)]">
                  Custom fields are applied once the company's plan includes them.
                </p>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-[var(--c-t1c1917)]">Users <span className="font-normal text-[var(--c-ta89890)]">(invited to the company by email)</span></legend>
              {users.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <input type="email" value={u.email} onChange={(e) => updateUser(i, { email: e.target.value })} placeholder="name@company.com" aria-label="User email" className={`${field} min-w-0 flex-1`} />
                  <select value={u.role} onChange={(e) => updateUser(i, { role: e.target.value as Role })} aria-label="Role" className={`${field} w-28 shrink-0`}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button type="button" onClick={() => setUsers((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove user" className="rounded-xl p-2 text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)]">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setUsers((r) => [...r, { email: '', role: 'manager' }])} disabled={users.length >= 20} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-tc0694a)] disabled:opacity-50">
                <Plus size={14} /> Add user
              </button>
            </fieldset>

            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-[var(--c-be0d6cf)] px-4 py-2 text-sm text-[var(--c-t78716c)]">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-xl bg-[var(--c-bc0694a)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {submitting ? 'Creating…' : 'Create board'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

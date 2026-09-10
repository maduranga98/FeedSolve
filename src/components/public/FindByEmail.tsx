import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Info, Mail, ShieldCheck } from "lucide-react";
import { Button, Input } from "../Shared";
import { useSubmissionsByEmail } from "../../hooks/useSubmissionsByEmail";
import { SubmissionListItem, type PublicSubmissionSummary } from "./SubmissionListItem";

const RATE_LIMIT_KEY = "feedsolve_email_lookup_rate_limit";
const MAX_LOOKUPS_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

interface LookupRateLimit {
  email_lookup_count: number;
  last_reset: number;
}

function getRateLimitState(): LookupRateLimit {
  if (typeof window === "undefined") {
    return { email_lookup_count: 0, last_reset: Date.now() };
  }

  try {
    const current = window.localStorage.getItem(RATE_LIMIT_KEY);
    if (!current) return { email_lookup_count: 0, last_reset: Date.now() };

    const parsed = JSON.parse(current) as LookupRateLimit;
    if (!parsed.last_reset || Date.now() - parsed.last_reset >= ONE_HOUR_MS) {
      return { email_lookup_count: 0, last_reset: Date.now() };
    }

    return parsed;
  } catch {
    return { email_lookup_count: 0, last_reset: Date.now() };
  }
}

function incrementLookupCount() {
  if (typeof window === "undefined") return;

  const current = getRateLimitState();
  const next = {
    email_lookup_count: current.email_lookup_count + 1,
    last_reset: current.last_reset,
  };
  window.localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(next));
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function FindByEmail() {
  const navigate = useNavigate();
  const { submissions, loading, error, lookupSubmissions, reset } = useSubmissionsByEmail();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const companies = useMemo(() => {
    const companyMap = new Map<string, string>();
    submissions.forEach(item => companyMap.set(item.companyId, item.companyName));
    return Array.from(companyMap.entries()).map(([id, name]) => ({ id, name }));
  }, [submissions]);

  const selectedCompanySubmissions = useMemo(() => {
    if (!selectedCompanyId) return [];
    return submissions.filter(item => item.companyId === selectedCompanyId);
  }, [selectedCompanyId, submissions]);

  const shouldShowCompanySelector = submissions.length > 0 && companies.length > 1 && !selectedCompanyId;
  const shouldShowResults = selectedCompanyId && selectedCompanySubmissions.length > 0;
  const showEmptyState = hasSearched && !loading && submissions.length === 0 && !error;

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    setEmailError(null);
    setRateLimitError(null);
    setSelectedCompanyId(null);

    if (!trimmedEmail) {
      setEmailError("Enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    const rateLimit = getRateLimitState();
    if (rateLimit.email_lookup_count >= MAX_LOOKUPS_PER_HOUR) {
      setRateLimitError("Too many lookups. Please try again in an hour.");
      return;
    }

    incrementLookupCount();
    const results = await lookupSubmissions(trimmedEmail);
    setHasSearched(true);

    const uniqueCompanyIds = Array.from(new Set(results.map(item => item.companyId)));
    if (uniqueCompanyIds.length === 1) {
      setSelectedCompanyId(uniqueCompanyIds[0]);
    }
  };

  const handleBack = () => {
    setHasSearched(false);
    setSelectedCompanyId(null);
    setEmailError(null);
    setRateLimitError(null);
    reset();
  };

  const navigateToSubmission = (item: PublicSubmissionSummary) => {
    navigate(`/track/${item.submission.trackingCode.replace(/^#/, "")}`);
  };

  return (
    <div className="space-y-5 text-left">
      <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)]">
            <ShieldCheck size={20} className="text-[var(--c-tc0694a)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--c-t1c1917)]">Find by Email</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--c-t78716c)]">
              We only show submissions where you provided your email. Anonymous submissions cannot be retrieved.
            </p>
          </div>
        </div>
      </div>

      {!hasSearched && (
        <form onSubmit={handleLookup} className="space-y-4">
          <Input
            label="Your email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={event => setEmail(event.target.value)}
            error={emailError || undefined}
            helperText="Enter the email you used when submitting feedback"
            leftIcon={<Mail size={16} />}
            autoComplete="email"
          />

          {rateLimitError && (
            <div className="rounded-xl border border-[var(--c-bfadbd8)] bg-[var(--c-sfdecea)] p-3 text-sm text-[var(--c-tc0392b)]">
              {rateLimitError}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[var(--c-bfadbd8)] bg-[var(--c-sfdecea)] p-3 text-sm text-[var(--c-tc0392b)]">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
            Find Submissions
          </Button>
        </form>
      )}

      {showEmptyState && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 text-center">
            <Info size={22} className="mx-auto mb-3 text-[var(--c-t78716c)]" />
            <p className="text-sm leading-relaxed text-[var(--c-t78716c)]">
              No submissions found for this email. Make sure you used the same email when submitting, or track using your code above.
            </p>
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={handleBack}>
            Try Another Email
          </Button>
        </div>
      )}

      {shouldShowCompanySelector && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--c-tc0694a)] hover:text-[var(--c-t1c1917)]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h3 className="text-base font-bold text-[var(--c-t1c1917)]">Which company are you looking for?</h3>
            <p className="mt-1 text-sm text-[var(--c-t78716c)]">Choose a company to see matching submissions.</p>
          </div>
          <div className="space-y-2">
            {companies.map(company => (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedCompanyId(company.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-4 text-left shadow-sm transition hover:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/30"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
                  <Building2 size={18} />
                </span>
                <span className="font-semibold text-[var(--c-t1c1917)]">{company.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {shouldShowResults && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--c-tc0694a)] hover:text-[var(--c-t1c1917)]"
          >
            <ArrowLeft size={16} /> Back to email lookup
          </button>
          <div>
            <h3 className="text-base font-bold text-[var(--c-t1c1917)]">
              {selectedCompanySubmissions.length} submission{selectedCompanySubmissions.length === 1 ? "" : "s"} found
            </h3>
            <p className="mt-1 text-sm text-[var(--c-t78716c)]">
              Select a tracking code to open the full status page.
            </p>
          </div>
          <div className="space-y-3">
            {selectedCompanySubmissions.map(item => (
              <SubmissionListItem
                key={item.submission.id}
                item={item}
                onClick={() => navigateToSubmission(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  GitMerge,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquareReply,
  PartyPopper,
  Plus,
  QrCode,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProductTour } from '../../hooks/useProductTour';
import { hasPermission } from '../../lib/rbac';

interface TourStep {
  id: string;
  icon: LucideIcon;
  /** `data-tour` value to spotlight; the card is centred when it isn't on screen. */
  target?: string;
  /** Needs permission to create boards. */
  manage?: boolean;
}

const STEPS: TourStep[] = [
  { id: 'welcome', icon: Sparkles },
  { id: 'board', icon: LayoutDashboard },
  { id: 'create', icon: Plus, target: 'create-board', manage: true },
  { id: 'languages', icon: Globe, target: 'board-edit', manage: true },
  { id: 'share', icon: QrCode, target: 'board-share', manage: true },
  { id: 'submissions', icon: Inbox, target: 'nav-submissions' },
  { id: 'templates', icon: MessageSquareReply, target: 'nav-reply-templates' },
  { id: 'bulk', icon: ListChecks },
  { id: 'merge', icon: GitMerge },
  { id: 'done', icon: PartyPopper },
];

const PAD = 8;
const CARD_W = 360;
const GAP = 14;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const visible =
    r.width > 0 &&
    r.height > 0 &&
    r.bottom > 0 &&
    r.right > 0 &&
    r.top < window.innerHeight &&
    r.left < window.innerWidth;
  return visible ? el : null;
}

export function ProductTour() {
  const location = useLocation();
  const { open, finish } = useProductTour();

  // Targets live on the dashboard; remounting on each open restarts at step 1.
  if (!open || location.pathname !== '/dashboard') return null;
  return <TourOverlay onFinish={finish} />;
}

function TourOverlay({ onFinish: finish }: { onFinish: () => void }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(240);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const steps = useMemo(() => {
    const role = user?.role?.toLowerCase();
    const canManage =
      role === 'owner' || role === 'admin' || (!!user && hasPermission(user.role, 'submissions:create'));
    return STEPS.filter((s) => !s.manage || canManage);
  }, [user]);

  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  const measure = useCallback(() => {
    const el = findTarget(step?.target);
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step?.target]);

  // Scroll the target into view once per step, then keep the box in sync.
  useLayoutEffect(() => {
    findTarget(step?.target)?.scrollIntoView({ block: 'center', behavior: 'auto' });
    const raf = requestAnimationFrame(measure);
    const id = window.setInterval(measure, 300); // targets may mount after data loads
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step?.target, measure]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, box]);

  const next = useCallback(() => (isLast ? finish() : setIndex((i) => i + 1)), [isLast, finish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, next, back]);

  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  if (!step) return null;

  const Icon = step.icon;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;
  const cardW = Math.min(CARD_W, vw - 32);

  let cardStyle: React.CSSProperties;
  if (!box || mobile) {
    cardStyle = mobile
      ? { left: 16, right: 16, bottom: 16, width: 'auto' }
      : { left: (vw - cardW) / 2, top: Math.max(16, (vh - cardH) / 2), width: cardW };
  } else {
    const spaceBelow = vh - (box.top + box.height + PAD);
    const spaceRight = vw - (box.left + box.width + PAD);
    let top: number;
    let left: number;
    if (spaceRight >= cardW + GAP) {
      left = box.left + box.width + PAD + GAP;
      top = box.top + box.height / 2 - cardH / 2;
    } else if (spaceBelow >= cardH + GAP) {
      top = box.top + box.height + PAD + GAP;
      left = box.left + box.width / 2 - cardW / 2;
    } else {
      top = box.top - PAD - GAP - cardH;
      left = box.left + box.width / 2 - cardW / 2;
    }
    cardStyle = {
      width: cardW,
      left: Math.min(Math.max(16, left), vw - cardW - 16),
      top: Math.min(Math.max(16, top), vh - cardH - 16),
    };
  }

  const key = `tour.steps.${step.id}`;

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {/* Click shield + dimmed backdrop. The spotlight is a hole cut by a huge box-shadow. */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {box ? (
        <div
          aria-hidden="true"
          className="absolute rounded-xl pointer-events-none transition-all duration-200 ring-2 ring-[var(--c-bc0694a)]"
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.width + PAD * 2,
            height: box.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(12, 10, 9, 0.6)',
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(12,10,9,0.6)]" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="absolute rounded-2xl bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)] shadow-xl p-5"
        style={cardStyle}
      >
        <button
          type="button"
          onClick={finish}
          aria-label={t('tour.skip')}
          className="absolute top-3 end-3 p-1.5 rounded-lg text-[var(--c-t8f8680)] hover:text-[var(--c-t1c1917)] hover:bg-[var(--c-sf0eae5)] transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-10 h-10 rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)] flex items-center justify-center mb-3">
          <Icon size={20} />
        </div>
        <h2 id="tour-title" className="text-base font-semibold text-[var(--c-t1c1917)] pe-6">
          {t(`${key}.title`)}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--c-t78716c)]">{t(`${key}.body`)}</p>
        {i18n.exists(`${key}.hint`) && (
          <p className="mt-2 text-xs font-medium text-[var(--c-tc0694a)]">{t(`${key}.hint`)}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1" aria-hidden="true">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? 'w-4 bg-[var(--c-sc0694a)]'
                    : 'w-1.5 bg-[var(--c-be9e0d9)]'
                }`}
              />
            ))}
          </div>
          <span className="sr-only">{t('tour.progress', { current: index + 1, total: steps.length })}</span>

          <div className="ms-auto flex items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)] transition-colors"
              >
                <ArrowLeft size={14} className="rtl:rotate-180" />
                {t('back')}
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)] transition-colors"
              >
                {t('tour.skip')}
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-[var(--c-sc0694a)] text-white hover:bg-[var(--c-s246d8c)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-bc0694a)]"
            >
              {isLast ? t('tour.finish') : t('next')}
              {!isLast && <ArrowRight size={14} className="rtl:rotate-180" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

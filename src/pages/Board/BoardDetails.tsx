import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, ArrowLeft, CalendarClock, MapPin, QrCode, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getBoard, getCompany } from '../../lib/firestore';
import { Button, LoadingSpinner } from '../../components/Shared';
import { QRCustomizer } from '../../components/QR';
import type { Board, Company } from '../../types';
import { LocationManager } from '../../components/boards/LocationManager';
import { LocationQRSection } from '../../components/boards/LocationQRSection';
import { RecurringCycleSettings } from '../../components/boards/RecurringCycleSettings';

type SetupStep = 'qr' | 'cycle' | 'locations';

const setupSteps: Array<{ id: SetupStep; label: string; description: string; icon: typeof QrCode }> = [
  { id: 'qr', label: 'QR Code', description: 'Style & share', icon: QrCode },
  { id: 'cycle', label: 'Recurring Cycle', description: 'Automate resets', icon: CalendarClock },
  { id: 'locations', label: 'Locations', description: 'Manage spots', icon: MapPin },
];

export function BoardDetails() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeSetupStep, setActiveSetupStep] = useState<SetupStep>('cycle');

  useEffect(() => {
    if (!user || !boardId) {
      void Promise.resolve().then(() => setLoading(false));
      return;
    }

    const fetchBoard = async () => {
      try {
        setLoading(true);
        const boardData = await getBoard(boardId);
        if (!boardData) {
          setError('Board not found');
          return;
        }
        if (boardData.companyId !== user.companyId) {
          setError('Unauthorized');
          return;
        }
        setBoard({ ...boardData, locations: boardData.locations || [] });
        const companyData = await getCompany(boardData.companyId);
        setCompany(companyData);
        document.title = `${boardData.name} | FeedSolve`;
      } catch (err) {
        setError('Failed to load board');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId, user]);

  const handleCopyLink = () => {
    if (board) {
      const feedbackUrl = `${window.location.origin}/submit/${board.slug}`;
      navigator.clipboard.writeText(feedbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareQR = async () => {
    if (!board) return;

    const feedbackUrl = `${window.location.origin}/submit/${board.slug}`;
    const text = `Share your feedback: ${feedbackUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${board.name} - Feedback Board`,
          text,
          url: feedbackUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <main className="min-h-screen bg-color-bg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-color-accent hover:text-color-primary mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="text-center">
            <p className="text-color-error mb-4">{error || 'Board not found'}</p>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </div>
        </div>
      </main>
    );
  }

  const feedbackUrl = `${window.location.origin}/submit/${board.slug}`;

  return (
    <main className="min-h-screen bg-color-bg">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 font-medium text-color-accent hover:text-color-primary"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-start">
          {/* Board Info */}
          <div className="rounded-2xl border border-color-border bg-color-surface p-6 shadow-md lg:sticky lg:top-6">
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#f5e6df] to-white p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c0694a]">
                Feedback board
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-color-primary break-words">{board.name}</h1>
              <p className="mt-2 text-color-muted-text">{board.description}</p>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <p className="text-sm font-semibold text-color-muted-text mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {board.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-color-accent-light text-color-primary rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-color-muted-text mb-2">Feedback URL</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={feedbackUrl}
                    className="flex-1 px-3 py-2 border border-color-border rounded-md bg-color-bg text-sm text-color-body-text"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5"
                  >
                    {copied ? <Check size={14} className="text-color-success" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-color-border bg-color-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-text">
                    Anonymous
                  </p>
                  <p className="mt-1 font-bold text-color-body-text">
                    {board.isAnonymousAllowed ? 'Allowed' : 'Not Allowed'}
                  </p>
                </div>
                <div className="rounded-xl border border-color-border bg-color-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-text">
                    Submissions
                  </p>
                  <p className="mt-1 text-xl font-bold text-color-accent">{board.submissionCount}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleShareQR}
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Share Feedback Form
              </Button>
              <Button
                onClick={() => navigate('/submissions')}
                variant="secondary"
                className="w-full"
              >
                View Submissions
              </Button>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#d6cabf] bg-white shadow-md">
            <div className="border-b border-[#e9e0d9] bg-gradient-to-r from-[#f5f0ec] via-white to-[#f5e6df] p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c0694a]">Board setup</p>
                <h2 className="mt-1 text-xl font-bold text-[#1c1917] sm:text-2xl">Configure how feedback is collected</h2>
                <p className="mt-1 text-sm text-[#78716c]">
                  Manage QR sharing, recurring cycles, and locations for this board.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label="Board setup sections">
                {setupSteps.map((step) => {
                  const Icon = step.icon;
                  const active = activeSetupStep === step.id;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveSetupStep(step.id)}
                      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-[#c0694a] bg-white text-[#1c1917] shadow-sm ring-2 ring-[#c0694a]/15'
                          : 'border-[#d6cabf] bg-white/65 text-[#78716c] hover:border-[#c0694a]/50 hover:bg-white'
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-[#c0694a] text-white' : 'bg-[#f1ebe5] text-[#78716c] group-hover:text-[#c0694a]'}`}>
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{step.label}</span>
                        <span className="block text-xs">{step.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#faf8f5] p-4 sm:p-6">
              {activeSetupStep === 'qr' && (
                <div className="rounded-xl border border-[#d6cabf] bg-white p-5">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5e6df] text-[#c0694a]">
                      <QrCode size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1c1917]">QR Code</h3>
                      <p className="text-sm text-[#78716c]">Customize style, colors, logo, and frame — then download.</p>
                    </div>
                  </div>
                  <QRCustomizer feedbackUrl={feedbackUrl} boardName={board.name} />
                </div>
              )}

              {activeSetupStep === 'cycle' && (
                <RecurringCycleSettings
                  board={board}
                  company={company}
                  onBoardChange={setBoard}
                />
              )}

              {activeSetupStep === 'locations' && (
                <div className="space-y-5">
                  <LocationManager
                    board={board}
                    company={company}
                    onBoardChange={setBoard}
                  />
                  <LocationQRSection board={board} feedbackUrl={feedbackUrl} />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

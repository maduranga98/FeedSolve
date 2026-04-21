import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getBoard } from '../../lib/firestore';
import { Button, LoadingSpinner } from '../../components/Shared';
import type { Board } from '../../types';

export function BoardDetails() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !boardId) {
      setLoading(false);
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
        setBoard(boardData);
      } catch (err) {
        setError('Failed to load board');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId, user]);

  const handleDownloadQR = () => {
    const element = document.getElementById('qr-code');
    if (element) {
      const canvas = element.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${board?.name || 'board'}-qr-code.png`;
        link.click();
      }
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-color-accent hover:text-color-primary mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Board Info */}
          <div className="bg-color-surface rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-color-primary mb-2">{board.name}</h1>
            <p className="text-color-muted-text mb-6">{board.description}</p>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-color-muted-text mb-1">Categories</p>
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
                <p className="text-sm text-color-muted-text mb-1">Feedback URL</p>
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
                    className="flex items-center gap-1"
                  >
                    {copied ? '✓' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-color-muted-text mb-1">Anonymous Submissions</p>
                <p className="text-color-body-text">
                  {board.isAnonymousAllowed ? 'Allowed' : 'Not Allowed'}
                </p>
              </div>

              <div>
                <p className="text-sm text-color-muted-text mb-1">Submissions Received</p>
                <p className="text-lg font-bold text-color-accent">{board.submissionCount}</p>
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
                onClick={() => navigate('/dashboard')}
                variant="secondary"
                className="w-full"
              >
                View Submissions
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-color-surface rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-color-primary mb-6">QR Code</h2>
            <div
              id="qr-code"
              className="p-4 bg-white rounded-lg border-2 border-color-border mb-6"
            >
              <QRCodeSVG
                value={feedbackUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-color-muted-text text-center mb-4">
              Scan this QR code or share the link above to collect feedback
            </p>
            <Button
              onClick={handleDownloadQR}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download QR Code
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

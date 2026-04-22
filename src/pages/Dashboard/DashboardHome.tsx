import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions } from '../../lib/firestore';
import type { Submission } from '../../types';
import { LoadingSpinner, Button, Badge } from '../../components/Shared';
import { UsageOverview } from '../../components/Dashboard/UsageOverview';
import { Plus, Inbox, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const submissionsData = await getCompanySubmissions(user.companyId);
      setSubmissions(
        submissionsData.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
      );
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#9AABBF] font-medium mb-0.5">
                {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
              </p>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">
                {t('boards:dashboard.title')}
              </h1>
              {!loading && (
                <p className="text-sm text-[#6B7B8D] mt-1">
                  {submissions.length}{' '}
                  {submissions.length === 1
                    ? t('boards:dashboard.submission_one')
                    : t('boards:dashboard.submission_other')}{' '}
                  total
                </p>
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/board/create')}
              className="flex-shrink-0"
            >
              <Plus size={16} />
              {t('boards:dashboard.create_board')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Usage Overview */}
        <div className="mb-6">
          <UsageOverview />
        </div>

        {/* Submissions */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="card rounded-xl p-12 text-center slide-up">
            <div className="w-16 h-16 bg-[#EBF5FB] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Inbox size={32} className="text-[#2E86AB]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">No submissions yet</h2>
            <p className="text-sm text-[#6B7B8D] mb-6 max-w-sm mx-auto">
              {t('boards:dashboard.create_first')}
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/board/create')}>
              <Plus size={16} />
              {t('boards:dashboard.create_board')}
            </Button>
          </div>
        ) : (
          <div className="slide-up space-y-4">
            <div className="bg-white border border-[#E8ECF0] rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1E3A5F]">Submissions workspace</h2>
                  <p className="text-sm text-[#6B7B8D] mt-1">
                    Manage assignments, statuses, and replies in a dedicated submissions section.
                  </p>
                </div>
                <Button variant="primary" onClick={() => navigate('/submissions')}>
                  Open Submissions
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            <div className="bg-white border border-[#E8ECF0] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1E3A5F]">Recent submissions</h3>
                <span className="text-xs text-[#9AABBF]">{Math.min(5, submissions.length)} shown</span>
              </div>
              <div className="space-y-3">
                {submissions.slice(0, 5).map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => navigate(`/submission/${submission.id}`)}
                    className="w-full rounded-lg border border-[#E8ECF0] px-4 py-3 text-left hover:bg-[#F8FBFD] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#1E3A5F] truncate">{submission.subject}</p>
                        <p className="text-xs text-[#9AABBF] mt-0.5">{submission.trackingCode}</p>
                      </div>
                      <Badge status={submission.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

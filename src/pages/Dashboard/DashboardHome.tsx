import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getCompanySubmissions, getCompanyMembers } from "../../lib/firestore";
import type { Submission, User } from "../../types";
import { LoadingSpinner, Button } from "../../components/Shared";
import SubmissionDetail from "../../components/Submissions/SubmissionDetail";
import { UsageOverview } from "../../components/Dashboard/UsageOverview";
import { AdvancedSearch } from "../../components/Filters/AdvancedSearch";
import { Plus, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const loadData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [submissionsData, usersData] = await Promise.all([
        getCompanySubmissions(user.companyId),
        getCompanyMembers(user.companyId),
      ]);
      setSubmissions(
        submissionsData.sort(
          (a, b) =>
            b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime(),
        ),
      );
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load submissions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#9AABBF] font-medium mb-0.5">
                {greeting}
                {user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
              </p>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">
                {t("boards:dashboard.title")}
              </h1>
              {!loading && (
                <p className="text-sm text-[#6B7B8D] mt-1">
                  {submissions.length}{" "}
                  {submissions.length === 1
                    ? t("boards:dashboard.submission_one")
                    : t("boards:dashboard.submission_other")}{" "}
                  total
                </p>
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/board/create")}
              className="flex-shrink-0"
            >
              <Plus size={16} />
              {t("boards:dashboard.create_board")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Usage Overview */}
        <div className="mb-6">
          <UsageOverview />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-[#FFE5E5] border border-[#E74C3C] rounded-lg">
            <p className="text-sm text-[#E74C3C]">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-[#E74C3C] hover:text-[#C0392B] font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

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
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">
              No submissions yet
            </h2>
            <p className="text-sm text-[#6B7B8D] mb-6 max-w-sm mx-auto">
              {t("boards:dashboard.create_first")}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/board/create")}
            >
              <Plus size={16} />
              {t("boards:dashboard.create_board")}
            </Button>
          </div>
        ) : (
          <div className="slide-up">
            <AdvancedSearch
              submissions={submissions}
              users={users}
              onSubmissionClick={setSelectedSubmission}
            />
          </div>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}

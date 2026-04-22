import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getCompanyBoards } from "../../lib/firestore";
import type { Board } from "../../types";
import { LoadingSpinner, Button } from "../../components/Shared";
import { UsageOverview } from "../../components/Dashboard/UsageOverview";
import { Plus, QrCode, ExternalLink, LayoutTemplate } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const boardsData = await getCompanyBoards(user.companyId);
      setBoards(
        boardsData.sort(
          (a, b) =>
            b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime(),
        ),
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load boards. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

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
                  {boards.length} {boards.length === 1 ? "board" : "boards"}{" "}
                  created
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

        {/* Boards */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : boards.length === 0 ? (
          <div className="card rounded-xl p-12 text-center slide-up">
            <div className="w-16 h-16 bg-[#EBF5FB] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LayoutTemplate size={32} className="text-[#2E86AB]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">
              No boards yet
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
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#1E3A5F]">
                Created submission forms
              </h2>
              <p className="text-sm text-[#6B7B8D] mt-1">
                Open a form to copy its public link or view/download its QR code.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white border border-[#E8ECF0] rounded-xl p-5 flex flex-col gap-3"
                >
                  <div>
                    <h3 className="text-base font-semibold text-[#1E3A5F]">
                      {board.name}
                    </h3>
                    <p className="text-sm text-[#6B7B8D] line-clamp-2 mt-1">
                      {board.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9AABBF]">
                      {board.submissionCount} submissions
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/submit/${board.slug}`)}
                      className="inline-flex items-center gap-1 text-[#2E86AB] hover:text-[#1E3A5F]"
                    >
                      View form link
                      <ExternalLink size={14} />
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="w-full justify-center"
                  >
                    <QrCode size={16} />
                    View QR code
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

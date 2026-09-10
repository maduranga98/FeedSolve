import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getCompanyBoards, deleteBoard, updateBoard, addAuditLog } from "../../lib/firestore";
import type { Board, CategoryTranslations } from "../../types";
import { LoadingSpinner, Button } from "../../components/Shared";
import { CategoryEditor } from "../../components/boards/CategoryEditor";
import { pruneCategoryTranslations } from "../../lib/utils";
import { UsageOverview } from "../../components/dashboard/UsageOverview";
import {
  Plus,
  QrCode,
  ExternalLink,
  LayoutTemplate,
  Pencil,
  Trash2,
  X,
  Tag,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../config/languages";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/utils";

type EditBoardData = {
  name: string;
  description: string;
  categories: string[];
  categoryTranslationsEnabled: boolean;
  categoryTranslations: CategoryTranslations;
  isAnonymousAllowed: boolean;
  showSatisfactionRating: boolean;
  satisfactionRequired: boolean;
  supportedLanguages: string[];
};

function EditBoardModal({
  board,
  onSave,
  onClose,
}: {
  board: Board;
  onSave: (data: EditBoardData) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description);
  const [categories, setCategories] = useState<string[]>(board.categories);
  const [categoryTranslations, setCategoryTranslations] = useState<CategoryTranslations>(
    board.categoryTranslations ?? {}
  );
  const [categoryTranslationsEnabled, setCategoryTranslationsEnabled] = useState(
    board.categoryTranslationsEnabled ?? false
  );
  const [isAnonymousAllowed, setIsAnonymousAllowed] = useState(board.isAnonymousAllowed);
  const [showSatisfactionRating, setShowSatisfactionRating] = useState(board.showSatisfactionRating);
  const [satisfactionRequired, setSatisfactionRequired] = useState(board.satisfactionRequired);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(board.supportedLanguages ?? ["en"]);
  const [saving, setSaving] = useState(false);

  const BOARD_NAME_MAX = 100;

  const handleToggleLanguage = (code: string) => {
    setSupportedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || categories.length === 0 || supportedLanguages.length === 0) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        categories,
        categoryTranslationsEnabled,
        categoryTranslations: categoryTranslationsEnabled
          ? pruneCategoryTranslations(categories, supportedLanguages, categoryTranslations)
          : {},
        isAnonymousAllowed,
        showSatisfactionRating,
        satisfactionRequired,
        supportedLanguages,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--c-sffffff)] rounded-xl max-w-lg w-full shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-be9e0d9)] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[var(--c-t1c1917)]">{t("forms:board.edit_board")}</h2>
          <button onClick={onClose} className="text-[var(--c-t8f8680)] hover:text-[var(--c-t1c1917)]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-t3c3632)] mb-1">
              {t("forms:board.name")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, BOARD_NAME_MAX))}
              className="w-full px-3 py-2 border border-[var(--c-bd6cabf)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]"
              required
            />
            <p className={`text-xs mt-1 text-right ${name.length >= BOARD_NAME_MAX ? "text-[var(--c-te74c3c)]" : "text-[var(--c-t8f8680)]"}`}>
              {name.length}/{BOARD_NAME_MAX}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-t3c3632)] mb-1">
              {t("description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--c-bd6cabf)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] resize-none"
            />
          </div>

          {/* Categories */}
          <CategoryEditor
            categories={categories}
            translations={categoryTranslations}
            supportedLanguages={supportedLanguages}
            translationsEnabled={categoryTranslationsEnabled}
            onToggleTranslations={setCategoryTranslationsEnabled}
            onChange={(nextCategories, nextTranslations) => {
              setCategories(nextCategories);
              setCategoryTranslations(nextTranslations);
            }}
          />

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-t3c3632)] mb-1">
              {t("forms:feedback.language")}
            </label>
            <p className="text-[var(--c-t78716c)] text-xs mb-2">{t("forms:board.choose_languages_help")}</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const selected = supportedLanguages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleToggleLanguage(lang.code)}
                    aria-pressed={selected}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                      selected
                        ? "bg-[var(--c-sf5e6df)] border-[var(--c-bc0694a)] text-[var(--c-t1c1917)] font-medium"
                        : "bg-[var(--c-sffffff)] border-[var(--c-bd6cabf)] text-[var(--c-t78716c)] hover:bg-[var(--c-sf5f0ec)]"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymousAllowed}
              onChange={(e) => setIsAnonymousAllowed(e.target.checked)}
              className="w-5 h-5 rounded border-[var(--c-bd6cabf)] text-[var(--c-tc0694a)] focus:ring-[var(--c-bc0694a)]"
            />
            <span className="text-sm text-[var(--c-t1c1917)] font-medium">
              {t("forms:board.anonymous_allowed")}
            </span>
          </label>

          {/* Satisfaction rating */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showSatisfactionRating}
                onChange={(e) => {
                  setShowSatisfactionRating(e.target.checked);
                  if (!e.target.checked) setSatisfactionRequired(false);
                }}
                className="w-5 h-5 rounded border-[var(--c-bd6cabf)] text-[var(--c-tc0694a)] focus:ring-[var(--c-bc0694a)]"
              />
              <div>
                <span className="text-sm text-[var(--c-t1c1917)] font-medium block">{t("forms:board.collect_satisfaction")}</span>
                <span className="text-[var(--c-t78716c)] text-xs">{t("forms:board.collect_satisfaction_help")}</span>
              </div>
            </label>
            {showSatisfactionRating && (
              <label className="flex items-center gap-3 cursor-pointer mt-2 ml-8">
                <input
                  type="checkbox"
                  checked={satisfactionRequired}
                  onChange={(e) => setSatisfactionRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--c-bd6cabf)] text-[var(--c-tc0694a)] focus:ring-[var(--c-bc0694a)]"
                />
                <div>
                  <span className="text-sm text-[var(--c-t1c1917)] font-medium block">{t("forms:board.rating_required_label")}</span>
                  <span className="text-[var(--c-t78716c)] text-xs">{t("forms:board.rating_required_help")}</span>
                </div>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} className="flex-1 justify-center">
              {t("cancel")}
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? t("saving") : t("save_changes")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  board,
  onConfirm,
  onClose,
}: {
  board: Board;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--c-sffffff)] rounded-xl max-w-sm w-full shadow-lg p-6">
        <div className="w-12 h-12 bg-[var(--c-sffe5e5)] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-[var(--c-te74c3c)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--c-t1c1917)] text-center mb-2">
          {t("boards:dashboard.delete_confirm_title")}
        </h2>
        <p className="text-sm text-[var(--c-t78716c)] text-center mb-6">
          {t("boards:dashboard.delete_confirm_body", { name: board.name })}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1 justify-center">
            {t("cancel")}
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 text-sm font-medium text-white bg-[var(--c-se74c3c)] hover:bg-[var(--c-sc0392b)] rounded-lg transition-colors disabled:opacity-60"
          >
            {deleting ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);

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
          (a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("boards:dashboard.failed_to_load")
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = `${t('dashboard')} | FeedSolve`;
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditSave = async (board: Board, data: EditBoardData) => {
    await updateBoard(board.id, data);
    if (user) {
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: "Edited board",
        resourceType: "board",
        resourceId: board.id,
        resourceName: data.name,
        details: { oldName: board.name, oldDescription: board.description, ...data },
      });
    }
    setBoards((prev) =>
      prev.map((b) => (b.id === board.id ? { ...b, ...data } : b))
    );
  };

  const handleDeleteConfirm = async (board: Board) => {
    await deleteBoard(board.id);
    if (user) {
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: "Deleted board",
        resourceType: "board",
        resourceId: board.id,
        resourceName: board.name,
        details: { submissionCount: board.submissionCount },
      });
    }
    setBoards((prev) => prev.filter((b) => b.id !== board.id));
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greetings.morning")
      : hour < 18
      ? t("greetings.afternoon")
      : t("greetings.evening");

  return (
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      {/* Page header */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be9e0d9)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--c-t8f8680)] font-medium mb-0.5">
                {greeting}
                {user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
              </p>
              <h1 className="text-2xl font-bold text-[var(--c-t1c1917)]">
                {t("boards:dashboard.title")}
              </h1>
              {!loading && (
                <p className="text-sm text-[var(--c-t78716c)] mt-1">
                  {t("boards:dashboard.boards_count", { count: boards.length })}
                </p>
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/board/create")}
              className="flex-shrink-0 self-start sm:self-auto"
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
          <div className="mb-6 p-4 bg-[var(--c-sffe5e5)] border border-[var(--c-be74c3c)] rounded-lg">
            <p className="text-sm text-[var(--c-te74c3c)]">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-[var(--c-te74c3c)] hover:text-[var(--c-tc0392b)] font-medium underline"
            >
              {t("try_again")}
            </button>
          </div>
        )}

        {/* Boards */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : boards.length === 0 ? (
          <div className="card rounded-xl p-12 text-center slide-up bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)]">
            <div className="w-16 h-16 bg-[var(--c-sf5e6df)] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LayoutTemplate size={32} className="text-[var(--c-tc0694a)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--c-t1c1917)] mb-2">{t("boards:dashboard.no_boards_yet")}</h2>
            <p className="text-sm text-[var(--c-t78716c)] mb-6 max-w-sm mx-auto">
              {t("boards:dashboard.create_first")}
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate("/board/create")}>
              <Plus size={16} />
              {t("boards:dashboard.create_board")}
            </Button>
          </div>
        ) : (
          <div className="slide-up">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--c-t1c1917)]">
                  {t("boards:dashboard.your_boards")}
                </h2>
                <p className="text-sm text-[var(--c-t78716c)] mt-0.5">
                  {t("boards:dashboard.your_boards_subtitle")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)] rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Header: name + action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[var(--c-t1c1917)] truncate">
                        {board.name}
                      </h3>
                      <p className="text-sm text-[var(--c-t78716c)] line-clamp-2 mt-0.5">
                        {board.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingBoard(board)}
                        className="p-1.5 text-[var(--c-t8f8680)] hover:text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)] rounded-lg transition-colors"
                        title={t("boards:dashboard.edit_tooltip")}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingBoard(board)}
                        className="p-1.5 text-[var(--c-t8f8680)] hover:text-[var(--c-te74c3c)] hover:bg-[var(--c-sffe5e5)] rounded-lg transition-colors"
                        title={t("boards:dashboard.delete_tooltip")}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-[var(--c-t8f8680)]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(board.createdAt.toDate())}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {t("boards:dashboard.submissions_count", { count: board.submissionCount })}
                    </span>
                  </div>

                  {/* Categories */}
                  {board.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {board.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 text-xs bg-[var(--c-sf2ece6)] text-[var(--c-t78716c)] px-2 py-0.5 rounded-full"
                        >
                          <Tag size={10} />
                          {cat}
                        </span>
                      ))}
                      {board.categories.length > 3 && (
                        <span className="text-xs text-[var(--c-t8f8680)] px-1">
                          {t("boards:dashboard.more_count", { count: board.categories.length - 3 })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--c-bf2ece6)]">
                    <button
                      type="button"
                      onClick={() => navigate(`/board/${board.id}`)}
                      className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--c-tc0694a)] bg-[var(--c-sf5e6df)] hover:bg-[var(--c-sd6eefa)] py-2 px-2 rounded-lg transition-colors"
                    >
                      <QrCode size={13} className="flex-shrink-0" />
                      <span className="truncate">{t("boards:dashboard.qr_code_and_settings")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `${window.location.origin}/submit/${board.slug}`,
                          "_blank"
                        )
                      }
                      className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--c-t78716c)] bg-[var(--c-se1e8ef)] hover:bg-[var(--c-se9e0d9)] py-2 px-2 rounded-lg transition-colors"
                    >
                      <ExternalLink size={13} className="flex-shrink-0" />
                      <span className="truncate">{t("boards:dashboard.open_form")}</span>
                    </button>
                  </div>

                  {/* View Submissions link */}
                  <button
                    type="button"
                    onClick={() => navigate(`/submissions`)}
                    className="text-xs text-[var(--c-t8f8680)] hover:text-[var(--c-tc0694a)] transition-colors text-center"
                  >
                    {t("boards:dashboard.view_submissions")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          onSave={(data) => handleEditSave(editingBoard, data)}
          onClose={() => setEditingBoard(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingBoard && (
        <DeleteConfirmModal
          board={deletingBoard}
          onConfirm={() => handleDeleteConfirm(deletingBoard)}
          onClose={() => setDeletingBoard(null)}
        />
      )}
    </div>
  );
}

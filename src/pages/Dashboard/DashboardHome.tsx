import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getCompanyBoards, deleteBoard, updateBoard, addAuditLog } from "../../lib/firestore";
import type { Board } from "../../types";
import { LoadingSpinner, Button } from "../../components/Shared";
import { UsageOverview } from "../../components/Dashboard/UsageOverview";
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
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/utils";

function EditBoardModal({
  board,
  onSave,
  onClose,
}: {
  board: Board;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECF0]">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">Edit Board</h2>
          <button onClick={onClose} className="text-[#9AABBF] hover:text-[#1E3A5F]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-1">
              Board Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} className="flex-1 justify-center">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? "Saving…" : "Save Changes"}
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
      <div className="bg-white rounded-xl max-w-sm w-full shadow-lg p-6">
        <div className="w-12 h-12 bg-[#FFE5E5] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-[#E74C3C]" />
        </div>
        <h2 className="text-lg font-semibold text-[#1E3A5F] text-center mb-2">
          Delete Board?
        </h2>
        <p className="text-sm text-[#6B7B8D] text-center mb-6">
          <span className="font-medium text-[#1E3A5F]">{board.name}</span> will
          be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1 justify-center">
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 text-sm font-medium text-white bg-[#E74C3C] hover:bg-[#C0392B] rounded-lg transition-colors disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
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
        err instanceof Error ? err.message : "Failed to load boards. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = 'Dashboard | FeedSolve';
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditSave = async (board: Board, data: { name: string; description: string }) => {
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
                  {boards.length} {boards.length === 1 ? "board" : "boards"} created
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
          <div className="card rounded-xl p-12 text-center slide-up bg-white border border-[#E8ECF0]">
            <div className="w-16 h-16 bg-[#EBF5FB] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LayoutTemplate size={32} className="text-[#2E86AB]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">No boards yet</h2>
            <p className="text-sm text-[#6B7B8D] mb-6 max-w-sm mx-auto">
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
                <h2 className="text-lg font-semibold text-[#1E3A5F]">
                  Your Feedback Boards
                </h2>
                <p className="text-sm text-[#6B7B8D] mt-0.5">
                  Click a board to configure it, copy its public link, or download its QR code.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white border border-[#E8ECF0] rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Header: name + action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#1E3A5F] truncate">
                        {board.name}
                      </h3>
                      <p className="text-sm text-[#6B7B8D] line-clamp-2 mt-0.5">
                        {board.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingBoard(board)}
                        className="p-1.5 text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] rounded-lg transition-colors"
                        title="Edit board"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingBoard(board)}
                        className="p-1.5 text-[#9AABBF] hover:text-[#E74C3C] hover:bg-[#FFE5E5] rounded-lg transition-colors"
                        title="Delete board"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-[#9AABBF]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(board.createdAt.toDate())}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {board.submissionCount} submission{board.submissionCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Categories */}
                  {board.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {board.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 text-xs bg-[#F0F4F8] text-[#6B7B8D] px-2 py-0.5 rounded-full"
                        >
                          <Tag size={10} />
                          {cat}
                        </span>
                      ))}
                      {board.categories.length > 3 && (
                        <span className="text-xs text-[#9AABBF] px-1">
                          +{board.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-[#F0F4F8]">
                    <button
                      type="button"
                      onClick={() => navigate(`/board/${board.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#2E86AB] bg-[#EBF5FB] hover:bg-[#D6EEFA] py-2 rounded-lg transition-colors"
                    >
                      <QrCode size={13} />
                      QR Code & Settings
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `${window.location.origin}/submit/${board.slug}`,
                          "_blank"
                        )
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7B8D] bg-[#F4F7FA] hover:bg-[#E8ECF0] py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink size={13} />
                      Open Form
                    </button>
                  </div>

                  {/* View Submissions link */}
                  <button
                    type="button"
                    onClick={() => navigate(`/submissions`)}
                    className="text-xs text-[#9AABBF] hover:text-[#2E86AB] transition-colors text-center"
                  >
                    View submissions →
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

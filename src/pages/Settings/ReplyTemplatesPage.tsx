import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lock, Plus } from 'lucide-react';
import { Navbar } from '../../components/Navigation/Navbar';
import { LoadingSpinner } from '../../components/Shared';
import { Button } from '../../components/Shared';
import { ReplyTemplateCard } from '../../components/Templates/ReplyTemplateCard';
import { TemplateModal } from '../../components/Templates/TemplateModal';
import { useTemplates } from '../../hooks/useTemplates';
import { useHasFeature } from '../../hooks/useHasFeature';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyBoards } from '../../lib/firestore';
import type { ReplyTemplate } from '../../types';

export function ReplyTemplatesPage() {
  const { user } = useAuth();
  const { checkFeature } = useHasFeature();
  const navigate = useNavigate();
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTemplates();

  const [categories, setCategories] = useState<string[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ReplyTemplate | null | undefined>(
    undefined
  ); // undefined = closed, null = creating new
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canUseTemplates = checkFeature('canUseTemplates');

  useEffect(() => {
    document.title = 'Reply Templates | FeedSolve';
  }, []);

  useEffect(() => {
    if (!user?.companyId) return;
    getCompanyBoards(user.companyId).then((boards) => {
      const all = boards.flatMap((b) => b.categories);
      setCategories(Array.from(new Set(all)).sort());
    }).catch(() => {});
  }, [user?.companyId]);

  const handleSave = async (data: Pick<ReplyTemplate, 'title' | 'body' | 'category'>) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data);
    } else {
      await createTemplate(data);
    }
    setEditingTemplate(undefined);
  };

  const handleDeleteConfirm = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTemplate(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F4F7FA]">
        {/* Header */}
        <div className="bg-white border-b border-[#E8ECF0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-[#2E86AB]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1E3A5F]">Reply Templates</h1>
                  <p className="text-sm text-[#6B7B8D] mt-0.5">
                    Save common responses to reply faster.
                  </p>
                </div>
              </div>
              {canUseTemplates && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEditingTemplate(null)}
                >
                  <Plus size={14} className="mr-1" />
                  New Template
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tier gate */}
          {!canUseTemplates && (
            <div className="mb-6 flex items-start gap-3 p-5 bg-white border border-[#E8ECF0] rounded-xl">
              <Lock size={18} className="text-[#9AABBF] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1E3A5F]">
                  Reply templates are available on the Growth plan and above.
                </p>
                <p className="text-sm text-[#6B7B8D] mt-1">
                  Upgrade to create and reuse reply templates across your team.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="mt-3 text-sm font-medium text-[#2E86AB] hover:underline"
                >
                  View plans →
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : !canUseTemplates ? null : templates.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[#E8ECF0] rounded-xl">
              <FileText size={36} className="mx-auto text-[#D3D1C7] mb-4" />
              <p className="text-[#444441] font-medium mb-1">No templates yet</p>
              <p className="text-sm text-[#6B7B8D] max-w-xs mx-auto">
                Create your first reply template to save time on common responses.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-5"
                onClick={() => setEditingTemplate(null)}
              >
                <Plus size={14} className="mr-1" />
                Create first template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((t) => (
                <ReplyTemplateCard
                  key={t.id}
                  template={t}
                  onEdit={setEditingTemplate}
                  onDelete={(template) => {
                    if (window.confirm(`Delete "${template.title}"?`)) {
                      handleDeleteConfirm(template.id);
                    }
                  }}
                />
              ))}
              {deletingId && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingTemplate !== undefined && (
        <TemplateModal
          initial={editingTemplate}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditingTemplate(undefined)}
        />
      )}
    </>
  );
}

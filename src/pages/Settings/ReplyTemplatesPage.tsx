import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { checkFeature, getTemplateCap } = useHasFeature();
  const navigate = useNavigate();
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTemplates();

  const [categories, setCategories] = useState<string[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ReplyTemplate | null | undefined>(
    undefined
  ); // undefined = closed, null = creating new
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canUseTemplates = checkFeature('canUseTemplates');
  const templateCap = getTemplateCap();
  const atTemplateLimit = templates.length >= templateCap;

  useEffect(() => {
    document.title = `${t('reply_templates.title')} | FeedSolve`;
  }, [t]);

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
      if (atTemplateLimit) return;
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
      <div className="min-h-screen bg-color-bg">
        {/* Header */}
        <div className="bg-white border-b border-[#e9e0d9]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f5e6df] rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-[#c0694a]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1c1917]">{t('reply_templates.title')}</h1>
                  <p className="text-sm text-[#78716c] mt-0.5">
                    {t('reply_templates.subtitle')}
                  </p>
                </div>
              </div>
              {canUseTemplates && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={atTemplateLimit}
                  onClick={() => setEditingTemplate(null)}
                >
                  <Plus size={14} className="mr-1" />
                  {t('reply_templates.new_template')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tier gate */}
          {!canUseTemplates && (
            <div className="mb-6 flex items-start gap-3 p-5 bg-white border border-[#e9e0d9] rounded-xl">
              <Lock size={18} className="text-[#8f8680] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1c1917]">
                  {t('reply_templates.tier_gate')}
                </p>
                <p className="text-sm text-[#78716c] mt-1">
                  {t('reply_templates.tier_gate_desc')}
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="mt-3 text-sm font-medium text-[#c0694a] hover:underline"
                >
                  {t('reply_templates.view_plans')}
                </button>
              </div>
            </div>
          )}

          {canUseTemplates && Number.isFinite(templateCap) && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-white border border-[#e9e0d9] rounded-xl">
              <FileText size={18} className="text-[#8f8680] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1c1917]">
                  {t('reply_templates.usage', { used: templates.length, cap: templateCap })}
                </p>
                {atTemplateLimit && (
                  <p className="text-sm text-[#78716c] mt-1">
                    {t('reply_templates.limit_reached')}{' '}
                    <button
                      onClick={() => navigate('/pricing')}
                      className="font-medium text-[#c0694a] hover:underline"
                    >
                      {t('reply_templates.upgrade_more')}
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : !canUseTemplates ? null : templates.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[#e9e0d9] rounded-xl">
              <FileText size={36} className="mx-auto text-[#d6cabf] mb-4" />
              <p className="text-[#3c3632] font-medium mb-1">{t('reply_templates.no_templates')}</p>
              <p className="text-sm text-[#78716c] max-w-xs mx-auto">
                {t('reply_templates.no_templates_desc')}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-5"
                onClick={() => setEditingTemplate(null)}
              >
                <Plus size={14} className="mr-1" />
                {t('reply_templates.create_first')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <ReplyTemplateCard
                  key={tmpl.id}
                  template={tmpl}
                  onEdit={setEditingTemplate}
                  onDelete={(template) => {
                    if (window.confirm(t('reply_templates.delete_confirm', { name: template.title }))) {
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

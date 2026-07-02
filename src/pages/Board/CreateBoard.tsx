import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useUsage } from '../../hooks/useUsage';
import { createBoard, getTemplate, addAuditLog, incrementTemplateUsage } from '../../lib/firestore';
import { Button, Input } from '../../components/Shared';
import type { BoardFormInput } from '../../types';
import type { BoardTemplate } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { Plus, Trash2 } from 'lucide-react';

export function CreateBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { boards: boardsUsage } = useUsage();
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const [formData, setFormData] = useState<BoardFormInput>({
    name: '',
    description: '',
    categories: ['Bug Report', 'Feature Request', 'Complaint'],
    isAnonymousAllowed: false,
    showSatisfactionRating: false,
    satisfactionRequired: false,
    supportedLanguages: ['en'],
  });
  const [newCategory, setNewCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create Board | FeedSolve';
  }, []);

  useEffect(() => {
    const loadTemplate = async () => {
      const state = location.state as { templateId?: unknown } | null;
      const templateId = typeof state?.templateId === 'string' ? state.templateId : undefined;
      if (templateId) {
        try {
          const template = await getTemplate(templateId);
          if (template) {
            setSelectedTemplate(template);
            setFormData(prev => ({
              ...prev,
              categories: template.categories,
            }));
          }
        } catch (error) {
          console.error('Failed to load template:', error);
        }
      }
    };

    loadTemplate();
  }, [location]);

  const BOARD_NAME_MAX = 100;
  const CATEGORY_NAME_MAX = 100;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('forms:validation.board_name_required');
    } else if (formData.name.trim().length > BOARD_NAME_MAX) {
      newErrors.name = t('forms:validation.board_name_max', { max: BOARD_NAME_MAX });
    }

    if (!formData.description.trim()) {
      newErrors.description = t('forms:validation.description_required');
    }

    if (formData.categories.length === 0) {
      newErrors.categories = t('forms:validation.categories_required');
    }

    if (!formData.supportedLanguages || formData.supportedLanguages.length === 0) {
      newErrors.languages = t('forms:validation.languages_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (trimmed.length > CATEGORY_NAME_MAX) {
      setErrors(prev => ({ ...prev, newCategory: t('forms:validation.category_name_max', { max: CATEGORY_NAME_MAX }) }));
      return;
    }
    setErrors(prev => { const e = { ...prev }; delete e.newCategory; return e; });
    setFormData({
      ...formData,
      categories: [...formData.categories, trimmed],
    });
    setNewCategory('');
  };

  const handleToggleLanguage = (code: string) => {
    setErrors(prev => { const e = { ...prev }; delete e.languages; return e; });
    setFormData(prev => {
      const current = prev.supportedLanguages ?? [];
      const next = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code];
      return { ...prev, supportedLanguages: next };
    });
  };

  const handleRemoveCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    if (boardsUsage.atLimit) {
      setErrors({
        submit: t('forms:validation.boards_limit_reached', { limit: boardsUsage.limit }),
      });
      return;
    }

    setIsLoading(true);
    try {
      const newBoard = await createBoard(user.companyId, formData);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: "Created board",
        resourceType: "board",
        resourceId: newBoard.id,
        resourceName: newBoard.name,
        details: {
          categories: formData.categories,
          ...(selectedTemplate
            ? { templateId: selectedTemplate.id, templateName: selectedTemplate.name }
            : {}),
        },
      });
      if (selectedTemplate) {
        void incrementTemplateUsage(selectedTemplate.id).catch((error) => {
          console.error('Failed to update template usage count:', error);
        });
      }
      navigate(`/board/${newBoard.id}`);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : t('boards:errors.creation_failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ece5de] px-4 py-8">
      <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-5 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1917] mb-2">
          {selectedTemplate ? t('boards:templates.create_from_template') : t('forms:board.create_board')}
        </h1>
        <p className="text-[#78716c] mb-8">
          {selectedTemplate
            ? t('forms:board.creating_from_template', { name: selectedTemplate.name })
            : t('forms:board.description_placeholder')}
        </p>

        {selectedTemplate && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>{t('forms:board.template_label')}:</strong> {selectedTemplate.name}
            </p>
          </div>
        )}

        {errors.submit && (
          <div className="mb-4 p-4 bg-[#FFE5E5] border border-[#c0392b] rounded-lg">
            <p className="text-sm text-[#c0392b]">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label={t('forms:board.name')}
              placeholder={selectedTemplate ? selectedTemplate.name : 'Product Feedback'}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value.slice(0, BOARD_NAME_MAX) })
              }
              error={errors.name}
            />
            <p className={`text-xs mt-1 text-right ${formData.name.length >= BOARD_NAME_MAX ? 'text-[#c0392b]' : 'text-[#8f8680]'}`}>
              {formData.name.length}/{BOARD_NAME_MAX}
            </p>
          </div>

          <Input
            label={t('forms:board.description')}
            placeholder="Collect feedback about your product"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            error={errors.description}
          />

          <div>
            <label className="block text-sm font-medium text-[#1c1917] mb-3">
              {t('forms:board.categories')}
            </label>

            <div className="space-y-2 mb-4">
              {formData.categories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#f5f0ec] p-3 rounded-lg border border-[#d6cabf]"
                >
                  <span className="text-[#1c1917]">{category}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="text-[#c0392b] hover:text-[#C0392B]"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {errors.categories && (
              <p className="text-sm text-[#c0392b] mb-3">{errors.categories}</p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('forms:board.category_placeholder')}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value.slice(0, CATEGORY_NAME_MAX))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                className="flex-1 px-4 py-2 border border-[#d6cabf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c0694a]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCategory}
                className="flex items-center gap-2"
              >
                <Plus size={18} />
              </Button>
            </div>
            {errors.newCategory && (
              <p className="text-xs text-[#c0392b] mt-1">{errors.newCategory}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1c1917] mb-1">
              {t('forms:feedback.language')}
            </label>
            <p className="text-[#78716c] text-xs mb-3">
              {t('forms:board.choose_languages_help')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map(lang => {
                const selected = (formData.supportedLanguages ?? []).includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleToggleLanguage(lang.code)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selected
                        ? 'bg-[#f5e6df] border-[#c0694a] text-[#1c1917] font-medium'
                        : 'bg-white border-[#d6cabf] text-[#78716c] hover:bg-[#f5f0ec]'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.languages && (
              <p className="text-sm text-[#c0392b] mt-2">{errors.languages}</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAnonymousAllowed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isAnonymousAllowed: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-[#d6cabf] text-[#c0694a] focus:ring-[#c0694a]"
            />
            <span className="text-[#1c1917] font-medium">
              {t('forms:board.anonymous_allowed')}
            </span>
          </label>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showSatisfactionRating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    showSatisfactionRating: e.target.checked,
                    satisfactionRequired: e.target.checked ? formData.satisfactionRequired : false,
                  })
                }
                className="w-5 h-5 rounded border-[#d6cabf] text-[#c0694a] focus:ring-[#c0694a]"
              />
              <div>
                <span className="text-[#1c1917] font-medium block">{t('forms:board.collect_satisfaction')}</span>
                <span className="text-[#78716c] text-xs">{t('forms:board.collect_satisfaction_help')}</span>
              </div>
            </label>

            {formData.showSatisfactionRating && (
              <label className="flex items-center gap-3 cursor-pointer mt-3 ml-8">
                <input
                  type="checkbox"
                  checked={formData.satisfactionRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      satisfactionRequired: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-[#d6cabf] text-[#c0694a] focus:ring-[#c0694a]"
                />
                <div>
                  <span className="text-[#1c1917] font-medium text-sm block">{t('forms:board.rating_required_label')}</span>
                  <span className="text-[#78716c] text-xs">{t('forms:board.rating_required_help')}</span>
                </div>
              </label>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="flex-1"
            >
              {selectedTemplate ? t('boards:templates.create_from_template') : t('forms:board.create_board')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

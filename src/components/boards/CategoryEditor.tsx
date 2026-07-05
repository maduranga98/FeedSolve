import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../Shared';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import type { CategoryTranslations } from '../../types';

const CATEGORY_NAME_MAX = 100;

interface CategoryEditorProps {
  categories: string[];
  translations: CategoryTranslations;
  /** Language codes the board supports; drives which translation fields show. */
  supportedLanguages: string[];
  /** Opt-in flag: when false, categories behave as plain single-language values. */
  translationsEnabled: boolean;
  onToggleTranslations: (enabled: boolean) => void;
  onChange: (categories: string[], translations: CategoryTranslations) => void;
  error?: string;
  /** Inline error shown under the add-category input. */
  newCategoryError?: string;
  onNewCategoryError?: (message: string | undefined) => void;
}

/**
 * Edits a board's categories together with their optional per-language labels.
 * The category name entered here is the canonical value stored on submissions;
 * the translated labels are only shown to submitters on the public form.
 */
export function CategoryEditor({
  categories,
  translations,
  supportedLanguages,
  translationsEnabled,
  onToggleTranslations,
  onChange,
  error,
  newCategoryError,
  onNewCategoryError,
}: CategoryEditorProps) {
  const { t } = useTranslation();
  const [newCategory, setNewCategory] = useState('');

  // Languages to offer translation fields for, in the app's canonical order.
  const activeLanguages = SUPPORTED_LANGUAGES.filter(l => supportedLanguages.includes(l.code));
  // The toggle is only meaningful once the board supports more than one language.
  const canTranslate = activeLanguages.length > 1;
  const showTranslations = canTranslate && translationsEnabled;

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (trimmed.length > CATEGORY_NAME_MAX) {
      onNewCategoryError?.(t('forms:validation.category_name_max', { max: CATEGORY_NAME_MAX }));
      return;
    }
    if (categories.includes(trimmed)) {
      onNewCategoryError?.(t('forms:validation.category_duplicate') || 'Category already exists');
      return;
    }
    onNewCategoryError?.(undefined);
    onChange([...categories, trimmed], translations);
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    const nextCategories = categories.filter(c => c !== category);
    const nextTranslations = { ...translations };
    delete nextTranslations[category];
    onChange(nextCategories, nextTranslations);
  };

  const handleTranslationChange = (category: string, lang: string, value: string) => {
    const nextTranslations: CategoryTranslations = {
      ...translations,
      [category]: {
        ...(translations[category] ?? {}),
        [lang]: value.slice(0, CATEGORY_NAME_MAX),
      },
    };
    onChange(categories, nextTranslations);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#1c1917] mb-1">
        {t('forms:board.categories')}
      </label>

      {canTranslate && (
        <div className="mb-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={translationsEnabled}
              onChange={e => onToggleTranslations(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#d6cabf] text-[#c0694a] focus:ring-[#c0694a]"
            />
            <span>
              <span className="text-sm text-[#1c1917] font-medium block">
                {t('forms:board.enable_category_translations')}
              </span>
              <span className="text-[#78716c] text-xs">
                {t('forms:board.category_translations_help')}
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {categories.map((category) => (
          <div
            key={category}
            className="bg-[#f5f0ec] p-3 rounded-lg border border-[#d6cabf]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[#1c1917] font-medium">{category}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                className="text-[#c0392b] hover:text-[#C0392B]"
                aria-label={t('remove') || 'Remove'}
              >
                <Trash2 size={18} />
              </button>
            </div>

            {showTranslations && (
              <div className="mt-3 space-y-2">
                {activeLanguages.map(lang => (
                  <div key={lang.code} className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-xs text-[#78716c] w-28 flex-shrink-0"
                      title={lang.name}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </span>
                    <input
                      type="text"
                      dir={lang.dir}
                      value={translations[category]?.[lang.code] ?? ''}
                      placeholder={category}
                      onChange={e => handleTranslationChange(category, lang.code, e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-[#d6cabf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c0694a]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-[#c0392b] mb-3">{error}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('forms:board.category_placeholder')}
          value={newCategory}
          onChange={e => setNewCategory(e.target.value.slice(0, CATEGORY_NAME_MAX))}
          onKeyDown={e => {
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
      {newCategoryError && (
        <p className="text-xs text-[#c0392b] mt-1">{newCategoryError}</p>
      )}
    </div>
  );
}

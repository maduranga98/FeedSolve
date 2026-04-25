import { useTranslation } from 'react-i18next';
import type { BoardTemplate } from '../../types';
import { Button } from '../Shared';

interface TemplateCardProps {
  template: BoardTemplate;
  onSelect: () => void;
}

function formatIndustryLabel(industry: string): string {
  return industry
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'en' | 'si' | 'ta' | 'ar' | 'hi';
  const translation = template.translations[currentLang] || template.translations['en'];

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      style={{ borderTopColor: template.color, borderTopWidth: '4px' }}
    >
      <div className="p-6">
        {/* Icon */}
        <div className="text-4xl mb-4">{template.icon}</div>

        {/* Title and Description */}
        <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">
          {translation.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {translation.description}
        </p>

        {/* Industry Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {formatIndustryLabel(template.industry)}
          </span>
        </div>

        {/* Categories Preview */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2">
            {t('boards:templates.categories')}
          </p>
          <div className="flex flex-wrap gap-1">
            {translation.categories.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {category}
              </span>
            ))}
            {translation.categories.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{translation.categories.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Usage Count */}
        <div className="mb-6 text-xs text-gray-500">
          Used {template.usageCount.toLocaleString()} times
        </div>

        {/* Select Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onSelect}
          className="w-full"
        >
          {t('boards:templates.select_template')}
        </Button>
      </div>
    </div>
  );
}

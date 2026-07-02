import { useTranslation } from 'react-i18next';
import {
  Building2,
  CalendarDays,
  Factory,
  HeartPulse,
  LayoutTemplate,
  Package,
  ShoppingBag,
  Target,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { BoardTemplate } from '../../types';
import { Button } from '../Shared';

interface TemplateCardProps {
  template: BoardTemplate;
  onSelect: () => void;
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  retail: ShoppingBag,
  manufacturing: Factory,
  distribution: Package,
  food_beverage: UtensilsCrossed,
  logistics: Truck,
  real_estate: Building2,
  healthcare: HeartPulse,
  human_resources: Users,
  technology: Wrench,
  events: CalendarDays,
  general: Target,
};

function formatIndustryLabel(industry: string): string {
  return industry
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language as 'en' | 'si' | 'ta' | 'ar' | 'hi';
  const translation = template.translations[currentLang] || template.translations['en'];
  const Icon = INDUSTRY_ICONS[template.industry] ?? LayoutTemplate;

  return (
    <div className="card card-hover flex flex-col overflow-hidden">
      <div className="flex flex-1 flex-col p-6">
        {/* Icon + industry */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-color-accent-light text-color-accent">
            <Icon size={21} strokeWidth={1.9} />
          </div>
          <span className="inline-block rounded-full bg-color-bg px-3 py-1 text-xs font-medium text-color-muted-text">
            {formatIndustryLabel(template.industry)}
          </span>
        </div>

        {/* Title and Description */}
        <h3 className="mb-1.5 text-lg font-bold text-color-primary">
          {translation.name}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-color-muted-text line-clamp-2">
          {translation.description}
        </p>

        {/* Categories Preview */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-color-muted-text">
            {t('boards:templates.categories')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {translation.categories.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="rounded-md bg-color-bg px-2 py-1 text-xs text-color-body-text"
              >
                {category}
              </span>
            ))}
            {translation.categories.length > 3 && (
              <span className="px-2 py-1 text-xs text-color-muted-text">
                {t('boards:dashboard.more_count', { count: translation.categories.length - 3 })}
              </span>
            )}
          </div>
        </div>

        {/* Usage Count */}
        <div className="mb-4 mt-auto text-xs text-color-muted-text">
          {t('reply_templates.used_other', { count: template.usageCount })}
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

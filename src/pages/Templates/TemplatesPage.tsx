import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate, Search, Star } from 'lucide-react';
import { Navbar } from '../../components/Navigation/Navbar';
import { LoadingSpinner } from '../../components/Shared';
import { getTemplates } from '../../lib/firebase';
import type { BoardTemplate } from '../../types';
import { TemplateCard } from '../../components/Templates/TemplateCard';

function formatIndustryLabel(industry: string): string {
  return industry
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = `${t('boards:templates.title')} | FeedSolve`;
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const industries = Array.from(
    new Set(templates.map(tmpl => tmpl.industry))
  ).sort();

  const filteredTemplates = templates.filter(template => {
    const matchesIndustry = !selectedIndustry || template.industry === selectedIndustry;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const featuredTemplates = filteredTemplates.filter(tmpl => tmpl.featured);
  const otherTemplates = filteredTemplates.filter(tmpl => !tmpl.featured);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-color-bg">
        {/* Header */}
        <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be9e0d9)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--c-sf5e6df)] rounded-xl flex items-center justify-center">
                <LayoutTemplate size={20} className="text-[var(--c-tc0694a)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--c-t1c1917)]">
                  {t('boards:templates.title')}
                </h1>
                <p className="text-sm text-[var(--c-t78716c)] mt-0.5">
                  {t('boards:templates.browse')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search and Filter */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-color-muted-text"
              />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-color-border bg-color-surface py-2.5 pl-10 pr-4 text-sm text-color-body-text placeholder:text-color-muted-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-color-accent"
              />
            </div>

            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              aria-label={t('boards:templates.industry')}
              className="rounded-lg border border-color-border bg-color-surface px-4 py-2.5 text-sm text-color-body-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-color-accent sm:w-56"
            >
              <option value="">{t('all_industries')}</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>
                  {formatIndustryLabel(industry)}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Templates */}
          {featuredTemplates.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-color-primary">
                <Star size={18} className="text-color-accent" fill="currentColor" />
                {t('boards:templates.featured')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {
                      navigate('/board/create', { state: { templateId: template.id } });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Templates */}
          <div>
            <h2 className="mb-6 text-xl font-bold text-color-primary">
              {t('boards:templates.browse')}
            </h2>
            {otherTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {
                      navigate('/board/create', { state: { templateId: template.id } });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-color-muted-text">{t('boards:dashboard.no_data')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

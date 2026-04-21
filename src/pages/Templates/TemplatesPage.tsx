import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../../components/Navigation/Navbar';
import { LoadingSpinner } from '../../components/Shared';
import { getTemplates } from '../../lib/firebase';
import type { BoardTemplate } from '../../types';
import { TemplateCard } from '../../components/Templates/TemplateCard';

export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    new Set(templates.map(t => t.industry))
  ).sort();

  const filteredTemplates = templates.filter(template => {
    const matchesIndustry = !selectedIndustry || template.industry === selectedIndustry;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const featuredTemplates = filteredTemplates.filter(t => t.featured);
  const otherTemplates = filteredTemplates.filter(t => !t.featured);

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
              {t('templates.title')}
            </h1>
            <p className="text-gray-600">
              {t('templates.browse')}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div>
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.industry')}
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {t(`templates.industries.${industry}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Templates */}
          {featuredTemplates.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-6">
                ⭐ {t('templates.featured')}
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
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-6">
              {t('templates.browse')}
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
                <p className="text-gray-500">{t('boards.dashboard.no_data')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

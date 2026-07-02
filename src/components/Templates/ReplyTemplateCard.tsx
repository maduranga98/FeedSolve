import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import type { ReplyTemplate } from '../../types';

interface ReplyTemplateCardProps {
  template: ReplyTemplate;
  onEdit: (template: ReplyTemplate) => void;
  onDelete: (template: ReplyTemplate) => void;
}

export function ReplyTemplateCard({ template, onEdit, onDelete }: ReplyTemplateCardProps) {
  const { t } = useTranslation();

  const preview = template.body.length > 100
    ? template.body.slice(0, 100) + '…'
    : template.body;

  return (
    <div className="bg-white border border-[#e9e0d9] rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-[#1c1917] leading-snug">{template.title}</h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg text-[#8f8680] hover:text-[#c0694a] hover:bg-[#f5e6df] transition-colors"
            title={t('reply_templates.edit_template')}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-1.5 rounded-lg text-[#8f8680] hover:text-[#c0392b] hover:bg-[#FFF0EE] transition-colors"
            title={t('reply_templates.delete_template')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="text-sm text-[#78716c] leading-relaxed">{preview}</p>

      <div className="flex items-center gap-2 flex-wrap mt-auto">
        {template.category && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f5e6df] text-[#c0694a] text-xs font-medium">
            {template.category}
          </span>
        )}
        <span className="text-xs text-[#b3a89f] ml-auto">
          {t(template.usageCount === 1 ? 'reply_templates.used_one' : 'reply_templates.used_other', { count: template.usageCount })}
        </span>
      </div>
    </div>
  );
}

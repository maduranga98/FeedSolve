import { Pencil, Trash2 } from 'lucide-react';
import type { ReplyTemplate } from '../../types';

interface ReplyTemplateCardProps {
  template: ReplyTemplate;
  onEdit: (template: ReplyTemplate) => void;
  onDelete: (template: ReplyTemplate) => void;
}

export function ReplyTemplateCard({ template, onEdit, onDelete }: ReplyTemplateCardProps) {
  const preview = template.body.length > 100
    ? template.body.slice(0, 100) + '…'
    : template.body;

  return (
    <div className="bg-white border border-[#E8ECF0] rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-[#1E3A5F] leading-snug">{template.title}</h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg text-[#9AABBF] hover:text-[#2E86AB] hover:bg-[#EBF5FB] transition-colors"
            title="Edit template"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-1.5 rounded-lg text-[#9AABBF] hover:text-[#E74C3C] hover:bg-[#FFF0EE] transition-colors"
            title="Delete template"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="text-sm text-[#6B7B8D] leading-relaxed">{preview}</p>

      <div className="flex items-center gap-2 flex-wrap mt-auto">
        {template.category && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EBF5FB] text-[#2E86AB] text-xs font-medium">
            {template.category}
          </span>
        )}
        <span className="text-xs text-[#B0BEC9] ml-auto">
          Used {template.usageCount} {template.usageCount === 1 ? 'time' : 'times'}
        </span>
      </div>
    </div>
  );
}

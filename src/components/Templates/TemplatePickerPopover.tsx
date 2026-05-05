import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { ReplyTemplate, Submission } from '../../types';

function resolveVariables(body: string, submission: Submission, boardName: string): string {
  return body
    .replace(/\{\{submitterName\}\}/g, submission.submitterName || 'there')
    .replace(/\{\{trackingCode\}\}/g, submission.trackingCode)
    .replace(/\{\{boardName\}\}/g, boardName);
}

interface TemplatePickerPopoverProps {
  templates: ReplyTemplate[];
  submission: Submission;
  boardName: string;
  hasDraftContent: boolean;
  onInsert: (resolvedText: string, templateId: string) => void;
  onClose: () => void;
}

export function TemplatePickerPopover({
  templates,
  submission,
  boardName,
  hasDraftContent,
  onInsert,
  onClose,
}: TemplatePickerPopoverProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<ReplyTemplate | null>(null);

  const categories = useMemo(() => {
    const cats = templates.map((t) => t.category).filter(Boolean) as string[];
    return Array.from(new Set(cats)).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, search, activeCategory]);

  const handleSelect = (template: ReplyTemplate) => {
    if (hasDraftContent) {
      setPendingTemplate(template);
    } else {
      onInsert(resolveVariables(template.body, submission, boardName), template.id);
    }
  };

  const handleConfirmReplace = () => {
    if (!pendingTemplate) return;
    onInsert(resolveVariables(pendingTemplate.body, submission, boardName), pendingTemplate.id);
    setPendingTemplate(null);
  };

  return (
    <div className="border border-[#E8ECF0] rounded-xl bg-white shadow-md overflow-hidden">
      {/* Confirmation overlay */}
      {pendingTemplate && (
        <div className="p-4 bg-[#FFFBF0] border-b border-[#F0E4A8]">
          <p className="text-sm text-[#6B7B8D] mb-3">
            Replace current draft with <strong className="text-[#1E3A5F]">{pendingTemplate.title}</strong>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPendingTemplate(null)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-[#6B7B8D] bg-white border border-[#D3D1C7] rounded-lg hover:bg-[#F4F7FA] transition-colors"
            >
              Keep draft
            </button>
            <button
              onClick={handleConfirmReplace}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-[#2E86AB] rounded-lg hover:bg-[#1E6A9A] transition-colors"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {/* Search + close */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F0F4F8]">
        <Search size={14} className="text-[#9AABBF] flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          autoFocus
          className="flex-1 text-sm text-[#1E3A5F] placeholder-[#B0BEC9] bg-transparent outline-none"
        />
        <button
          onClick={onClose}
          className="p-1 text-[#9AABBF] hover:text-[#444441] rounded transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-[#F0F4F8] overflow-x-auto">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === null
                ? 'bg-[#2E86AB] text-white'
                : 'bg-[#F4F7FA] text-[#6B7B8D] hover:bg-[#E8ECF0]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#2E86AB] text-white'
                  : 'bg-[#F4F7FA] text-[#6B7B8D] hover:bg-[#E8ECF0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Template list */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#9AABBF] text-center py-6 px-4">
            No templates match. Try a different search.
          </p>
        ) : (
          filtered.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="w-full text-left px-4 py-3 hover:bg-[#F4F7FA] transition-colors border-b border-[#F8FAFB] last:border-0"
            >
              <p className="text-sm font-medium text-[#1E3A5F] leading-snug">{template.title}</p>
              <p className="text-xs text-[#9AABBF] mt-0.5 line-clamp-2 leading-relaxed">
                {template.body.slice(0, 120)}{template.body.length > 120 ? '…' : ''}
              </p>
              {template.category && (
                <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-[#EBF5FB] text-[#2E86AB] text-[10px] font-medium">
                  {template.category}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

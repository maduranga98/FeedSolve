import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Shared';
import type { ReplyTemplate } from '../../types';

const VARIABLES = [
  { label: '{{submitterName}}', title: 'Submitter name' },
  { label: '{{trackingCode}}', title: 'Tracking code' },
  { label: '{{boardName}}', title: 'Board name' },
] as const;

const MAX_TITLE = 80;
const MAX_BODY = 1000;

interface TemplateModalProps {
  initial?: ReplyTemplate | null;
  categories: string[];
  onSave: (data: Pick<ReplyTemplate, 'title' | 'body' | 'category'>) => Promise<void>;
  onClose: () => void;
}

export function TemplateModal({ initial, categories, onSave, onClose }: TemplateModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<number>(body.length);

  const trackCursor = useCallback(() => {
    if (bodyRef.current) {
      cursorRef.current = bodyRef.current.selectionStart ?? body.length;
    }
  }, [body.length]);

  // Keep cursor tracked on mouse / key events
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.addEventListener('mouseup', trackCursor);
    el.addEventListener('keyup', trackCursor);
    return () => {
      el.removeEventListener('mouseup', trackCursor);
      el.removeEventListener('keyup', trackCursor);
    };
  }, [trackCursor]);

  const insertVariable = (variable: string) => {
    const el = bodyRef.current;
    const pos = cursorRef.current;
    const next = body.slice(0, pos) + variable + body.slice(pos);
    if (next.length > MAX_BODY) return;
    setBody(next);
    const newCursor = pos + variable.length;
    cursorRef.current = newCursor;
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!body.trim()) errs.body = 'Body is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        category: category || null,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECF0] flex-shrink-0">
          <h2 className="text-base font-bold text-[#1E3A5F]">
            {initial ? 'Edit Template' : 'New Reply Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9AABBF] hover:text-[#444441] hover:bg-[#F4F7FA] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7B8D] uppercase tracking-wide mb-1.5">
              Title <span className="text-[#E74C3C]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="e.g. Delivery Delay Apology"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] ${
                errors.title ? 'border-[#E74C3C]' : 'border-[#D3D1C7]'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title && <p className="text-xs text-[#E74C3C]">{errors.title}</p>}
              <span className="text-xs text-[#B0BEC9] ml-auto">
                {title.length}/{MAX_TITLE}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7B8D] uppercase tracking-wide mb-1.5">
              Category <span className="text-[#9AABBF] font-normal normal-case">(optional)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7B8D] uppercase tracking-wide mb-1.5">
              Body <span className="text-[#E74C3C]">*</span>
            </label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value.slice(0, MAX_BODY));
                trackCursor();
              }}
              onClick={trackCursor}
              placeholder="Write your reply template here..."
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none ${
                errors.body ? 'border-[#E74C3C]' : 'border-[#D3D1C7]'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.body && <p className="text-xs text-[#E74C3C]">{errors.body}</p>}
              <span className="text-xs text-[#B0BEC9] ml-auto">
                {body.length}/{MAX_BODY}
              </span>
            </div>

            {/* Variable chips */}
            <div className="mt-2">
              <p className="text-xs text-[#9AABBF] mb-2">Insert variable at cursor:</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(({ label, title: varTitle }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => insertVariable(label)}
                    title={varTitle}
                    className="px-2.5 py-1 rounded-full bg-[#EBF5FB] text-[#185FA5] text-xs font-medium hover:bg-[#D6EEFA] transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#E8ECF0] flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim()}
            className="flex-1"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}

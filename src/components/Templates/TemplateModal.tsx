import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '../Shared';
import type { ReplyTemplate } from '../../types';

const MAX_TITLE = 80;
const MAX_BODY = 1000;

interface TemplateModalProps {
  initial?: ReplyTemplate | null;
  categories: string[];
  onSave: (data: Pick<ReplyTemplate, 'title' | 'body' | 'category'>) => Promise<void>;
  onClose: () => void;
}

export function TemplateModal({ initial, categories, onSave, onClose }: TemplateModalProps) {
  const { t } = useTranslation();

  const VARIABLES = [
    { label: '{{submitterName}}', title: t('reply_templates.var_submitter_name') },
    { label: '{{trackingCode}}', title: t('reply_templates.var_tracking_code') },
    { label: '{{boardName}}', title: t('reply_templates.var_board_name') },
  ];

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
    if (!title.trim()) errs.title = t('reply_templates.title_required');
    if (!body.trim()) errs.body = t('reply_templates.body_required');
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
      <div className="bg-[var(--c-sffffff)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-be9e0d9)] flex-shrink-0">
          <h2 className="text-base font-bold text-[var(--c-t1c1917)]">
            {initial ? t('reply_templates.edit_title') : t('reply_templates.new_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--c-t8f8680)] hover:text-[var(--c-t3c3632)] hover:bg-[var(--c-sece5de)] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--c-t78716c)] uppercase tracking-wide mb-1.5">
              {t('reply_templates.field_title')} <span className="text-[var(--c-tc0392b)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder={t('reply_templates.title_placeholder')}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] ${
                errors.title ? 'border-[var(--c-bc0392b)]' : 'border-[var(--c-bd6cabf)]'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title && <p className="text-xs text-[var(--c-tc0392b)]">{errors.title}</p>}
              <span className="text-xs text-[var(--c-tb3a89f)] ml-auto">
                {title.length}/{MAX_TITLE}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[var(--c-t78716c)] uppercase tracking-wide mb-1.5">
              {t('reply_templates.field_category')} <span className="text-[var(--c-t8f8680)] font-normal normal-case">{t('optional')}</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--c-bd6cabf)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] bg-[var(--c-sffffff)]"
            >
              <option value="">{t('reply_templates.no_category')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-[var(--c-t78716c)] uppercase tracking-wide mb-1.5">
              {t('reply_templates.field_body')} <span className="text-[var(--c-tc0392b)]">*</span>
            </label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value.slice(0, MAX_BODY));
                trackCursor();
              }}
              onClick={trackCursor}
              placeholder={t('reply_templates.body_placeholder')}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] resize-none ${
                errors.body ? 'border-[var(--c-bc0392b)]' : 'border-[var(--c-bd6cabf)]'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.body && <p className="text-xs text-[var(--c-tc0392b)]">{errors.body}</p>}
              <span className="text-xs text-[var(--c-tb3a89f)] ml-auto">
                {body.length}/{MAX_BODY}
              </span>
            </div>

            {/* Variable chips */}
            <div className="mt-2">
              <p className="text-xs text-[var(--c-t8f8680)] mb-2">{t('reply_templates.insert_variable')}</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(({ label, title: varTitle }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => insertVariable(label)}
                    title={varTitle}
                    className="px-2.5 py-1 rounded-full bg-[var(--c-sf5e6df)] text-[var(--c-t185fa5)] text-xs font-medium hover:bg-[var(--c-sd6eefa)] transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--c-be9e0d9)] flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim()}
            className="flex-1"
          >
            {saving ? t('reply_templates.saving') : initial ? t('save_changes') : t('reply_templates.create_template')}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Shared';
import { TemplatePickerPopover } from '../Templates/TemplatePickerPopover';
import { useTemplates } from '../../hooks/useTemplates';
import { useHasFeature } from '../../hooks/useHasFeature';
import { useAuth } from '../../hooks/useAuth';
import { addAuditLog } from '../../lib/firestore';
import type { Submission } from '../../types';

interface ReplyFormProps {
  onSubmit: (text: string) => Promise<void>;
  loading?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  submission?: Submission;
  boardName?: string;
}

export default function ReplyForm({
  onSubmit,
  loading,
  initialValue = '',
  onCancel,
  submission,
  boardName = '',
}: ReplyFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkFeature } = useHasFeature();
  const { templates, incrementUsage } = useTemplates();
  const [text, setText] = useState(initialValue);
  const [showPicker, setShowPicker] = useState(false);

  const canUseTemplates = checkFeature('canUseTemplates');

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await onSubmit(text);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
  };

  const handleTemplateInsert = (resolvedText: string, templateId: string) => {
    setText(resolvedText);
    setShowPicker(false);
    incrementUsage(templateId);

    const template = templates.find((item) => item.id === templateId);
    if (user && submission) {
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: `Inserted reply template ${template?.title ?? templateId}`,
        resourceType: 'submission',
        resourceId: submission.id,
        resourceName: submission.subject,
        details: { templateId, templateTitle: template?.title ?? null },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Template picker trigger */}
      {submission && (
        <div className="flex items-center justify-end">
          {canUseTemplates ? (
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--c-tc0694a)] bg-[var(--c-sf5e6df)] hover:bg-[var(--c-sf0dcd0)] rounded-lg transition-colors"
            >
              <LayoutTemplate size={13} />
              {t('reply_form.use_template')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              title={t('reply_form.template_locked')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--c-t8f8680)] bg-[var(--c-sece5de)] rounded-lg cursor-pointer hover:bg-[var(--c-se9e0d9)] transition-colors"
            >
              <Lock size={12} />
              {t('reply_form.use_template')}
            </button>
          )}
        </div>
      )}

      {/* Inline template picker */}
      {showPicker && submission && (
        <TemplatePickerPopover
          templates={templates}
          submission={submission}
          boardName={boardName}
          hasDraftContent={text.trim().length > 0}
          onInsert={handleTemplateInsert}
          onClose={() => setShowPicker(false)}
        />
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        placeholder={t('reply_form.placeholder')}
        className="w-full px-3 py-2 border border-[var(--c-bd6cabf)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] resize-none"
        rows={5}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          {t('reply_form.cancel')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={loading || !text.trim()}
        >
          {loading ? t('reply_form.sending') : t('reply_form.send')}
        </Button>
      </div>
    </form>
  );
}

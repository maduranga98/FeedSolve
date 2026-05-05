import { useState, useEffect } from 'react';
import { Lock, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Shared';
import { TemplatePickerPopover } from '../Templates/TemplatePickerPopover';
import { useTemplates } from '../../hooks/useTemplates';
import { useHasFeature } from '../../hooks/useHasFeature';
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
  const navigate = useNavigate();
  const { checkFeature } = useHasFeature();
  const { templates } = useTemplates();
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

  const handleTemplateInsert = (resolvedText: string) => {
    setText(resolvedText);
    setShowPicker(false);
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2E86AB] bg-[#EBF5FB] hover:bg-[#D6EEFA] rounded-lg transition-colors"
            >
              <LayoutTemplate size={13} />
              Use Template
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              title="Reply templates available on Growth plan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9AABBF] bg-[#F4F7FA] rounded-lg cursor-pointer hover:bg-[#E8ECF0] transition-colors"
            >
              <Lock size={12} />
              Use Template
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
        placeholder="Write a public reply that will be visible to the submitter..."
        className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
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
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={loading || !text.trim()}
        >
          {loading ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </form>
  );
}

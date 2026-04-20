import { useState, useEffect } from 'react';
import { Button } from '../Shared';

interface ReplyFormProps {
  onSubmit: (text: string) => Promise<void>;
  loading?: boolean;
  initialValue?: string;
  onCancel?: () => void;
}

export default function ReplyForm({
  onSubmit,
  loading,
  initialValue = '',
  onCancel,
}: ReplyFormProps) {
  const [text, setText] = useState(initialValue);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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

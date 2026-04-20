import { useState } from 'react';
import { Button } from '../Shared';

interface AddNoteFormProps {
  onSubmit: (text: string) => Promise<void>;
  loading?: boolean;
}

export default function AddNoteForm({ onSubmit, loading }: AddNoteFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await onSubmit(text);
      setText('');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        placeholder="Add an internal note..."
        className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
        rows={3}
      />
      <Button
        variant="primary"
        size="sm"
        type="submit"
        disabled={loading || !text.trim()}
      >
        {loading ? 'Adding...' : 'Add Note'}
      </Button>
    </form>
  );
}

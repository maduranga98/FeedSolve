import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addInternalNote } from '../../lib/firestore';
import type { InternalNote } from '../../types';
import AddNoteForm from './AddNoteForm';
import NoteCard from './NoteCard';

interface InternalNotesSectionProps {
  submissionId: string;
  notes: InternalNote[];
  onNoteAdded?: () => void;
}

export default function InternalNotesSection({
  submissionId,
  notes,
  onNoteAdded,
}: InternalNotesSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAddNote = async (text: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await addInternalNote(submissionId, text, user.name);
      onNoteAdded?.();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-[#1E3A5F] mb-3">Internal Notes</h3>
        <AddNoteForm onSubmit={handleAddNote} loading={loading} />
      </div>

      {sortedNotes.length === 0 ? (
        <div className="text-center py-8 bg-[#F8FAFB] rounded-lg border border-[#D3D1C7]">
          <p className="text-[#6B7B8D] text-sm">No internal notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

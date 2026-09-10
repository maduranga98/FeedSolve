import type { InternalNote } from '../../types';
import { formatDate } from '../../lib/utils';

interface NoteCardProps {
  note: InternalNote;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="bg-[var(--c-sf5f0ec)] border border-[var(--c-bd6cabf)] rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-[var(--c-t1c1917)] text-sm">{note.createdBy}</p>
          <p className="text-xs text-[var(--c-t78716c)]">
            {formatDate(note.createdAt.toDate())}
          </p>
        </div>
      </div>
      <p className="text-sm text-[var(--c-t3c3632)] whitespace-pre-wrap">
        {note.text}
      </p>
    </div>
  );
}

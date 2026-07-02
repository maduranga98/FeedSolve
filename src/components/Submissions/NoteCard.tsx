import type { InternalNote } from '../../types';
import { formatDate } from '../../lib/utils';

interface NoteCardProps {
  note: InternalNote;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="bg-[#f5f0ec] border border-[#d6cabf] rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-[#1c1917] text-sm">{note.createdBy}</p>
          <p className="text-xs text-[#78716c]">
            {formatDate(note.createdAt.toDate())}
          </p>
        </div>
      </div>
      <p className="text-sm text-[#3c3632] whitespace-pre-wrap">
        {note.text}
      </p>
    </div>
  );
}

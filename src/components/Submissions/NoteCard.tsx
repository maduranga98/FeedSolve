import type { InternalNote } from '../../types';
import { formatDate } from '../../lib/utils';

interface NoteCardProps {
  note: InternalNote;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="bg-[#F8FAFB] border border-[#D3D1C7] rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-[#1E3A5F] text-sm">{note.createdBy}</p>
          <p className="text-xs text-[#6B7B8D]">
            {formatDate(note.createdAt.toDate())}
          </p>
        </div>
      </div>
      <p className="text-sm text-[#444441] whitespace-pre-wrap">
        {note.text}
      </p>
    </div>
  );
}

import { useState } from 'react';
import type { User } from '../../types';
import { Button } from '../Shared';
import { Trash2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TeamMemberCardProps {
  member: User;
  onRemoved: () => void;
}

export default function TeamMemberCard({ member, onRemoved }: TeamMemberCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.name} from the team?`)) return;

    setIsRemoving(true);
    try {
      await deleteDoc(doc(db, 'users', member.id));
      onRemoved();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-[#D3D1C7] rounded-lg">
      <div className="flex-1">
        <h3 className="font-semibold text-[#444441]">{member.name}</h3>
        <p className="text-sm text-[#6B7B8D]">{member.email}</p>
        <div className="mt-2">
          <span className="inline-block px-2 py-1 bg-[#E0E8EF] text-[#1E3A5F] text-xs rounded font-medium">
            {member.role === 'admin' ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      <Button
        variant="danger"
        size="sm"
        onClick={handleRemove}
        disabled={isRemoving}
        className="flex items-center gap-2"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

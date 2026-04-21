import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyMembers, assignSubmission, unassignSubmission } from '../../lib/firestore';
import type { User } from '../../types';

interface AssignDropdownProps {
  submissionId: string;
  assignedToId?: string;
  onAssigned?: () => void;
}

export default function AssignDropdown({
  submissionId,
  assignedToId,
  onAssigned,
}: AssignDropdownProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      if (!user) return;
      try {
        const membersData = await getCompanyMembers(user.companyId);
        setMembers(membersData);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };

    loadMembers();
  }, [user]);

  const handleAssign = async (userId: string) => {
    setLoading(true);
    try {
      await assignSubmission(submissionId, userId);
      onAssigned?.();
    } catch (error) {
      console.error('Failed to assign submission:', error);
      alert('Failed to assign submission');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      await unassignSubmission(submissionId);
      onAssigned?.();
    } catch (error) {
      console.error('Failed to unassign submission:', error);
      alert('Failed to unassign submission');
    } finally {
      setLoading(false);
    }
  };

  const assignedMember = members.find((m) => m.id === assignedToId);

  return (
    <div className="relative group">
      <button
        disabled={loading}
        className="px-3 py-2 bg-[#E0E8EF] text-[#1E3A5F] rounded text-sm font-medium hover:bg-[#D0D8E0] transition-colors disabled:opacity-50"
      >
        {assignedMember ? `Assigned to ${assignedMember.name}` : 'Unassigned'}
      </button>

      <div className="absolute hidden group-hover:block right-0 mt-1 bg-white border border-[#D3D1C7] rounded shadow-lg z-50 min-w-max">
        {assignedToId && (
          <button
            onClick={handleUnassign}
            disabled={loading}
            className="block w-full text-left px-4 py-2 text-sm text-[#444441] hover:bg-[#F8FAFB] disabled:opacity-50"
          >
            Unassign
          </button>
        )}
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => handleAssign(member.id)}
            disabled={loading || member.id === assignedToId}
            className="block w-full text-left px-4 py-2 text-sm text-[#444441] hover:bg-[#F8FAFB] disabled:opacity-50 disabled:bg-[#F8FAFB]"
          >
            {member.name}
          </button>
        ))}
        {members.length === 0 && (
          <div className="px-4 py-2 text-xs text-[#6B7B8D]">
            No team members yet
          </div>
        )}
      </div>
    </div>
  );
}

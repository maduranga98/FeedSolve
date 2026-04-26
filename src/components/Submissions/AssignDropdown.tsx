import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyMembers, assignSubmission, unassignSubmission, addAuditLog } from '../../lib/firestore';
import type { User } from '../../types';
import { UserPlus, UserX } from 'lucide-react';

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
      if (user) {
        const assignedMemberName = members.find((m) => m.id === userId)?.name ?? userId;
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: `Assigned submission to ${assignedMemberName}`,
          resourceType: 'submission',
          resourceId: submissionId,
          details: { assignedToId: userId, assignedToName: assignedMemberName },
        });
      }
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
      if (user) {
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'Unassigned submission',
          resourceType: 'submission',
          resourceId: submissionId,
          details: {},
        });
      }
      onAssigned?.();
    } catch (error) {
      console.error('Failed to unassign submission:', error);
      alert('Failed to unassign submission');
    } finally {
      setLoading(false);
    }
  };

  const assignedMember = members.find((m) => m.id === assignedToId);

  const handleChange = async (value: string) => {
    if (!value) {
      await handleUnassign();
      return;
    }
    await handleAssign(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AABBF]" />
          <select
            value={assignedToId || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading || members.length === 0}
            className="w-full pl-8 pr-3 py-2.5 border border-[#D3DCE6] rounded-lg text-sm text-[#1E3A5F] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E86AB] disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!assignedToId || loading}
          onClick={handleUnassign}
          className="px-3 py-2.5 border border-[#D3DCE6] rounded-lg text-sm text-[#6B7B8D] hover:bg-[#F4F7FA] disabled:opacity-50 inline-flex items-center gap-1"
        >
          <UserX size={14} />
          Clear
        </button>
      </div>
      <p className="text-xs text-[#9AABBF]">
        {members.length === 0
          ? 'No team members available for assignment.'
          : assignedMember
            ? `Currently assigned to ${assignedMember.name}.`
            : 'Select a team member to assign ownership.'}
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyMembers } from '../../lib/firestore';
import type { User } from '../../types';
import { LoadingSpinner, Button } from '../../components/Shared';
import { Plus } from 'lucide-react';
import TeamMemberCard from '../../components/Team/TeamMemberCard';
import AddTeamMemberModal from '../../components/Team/AddTeamMemberModal';

export function TeamManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadMembers = async () => {
    if (!user) return;
    try {
      const membersData = await getCompanyMembers(user.companyId);
      setMembers(membersData.sort((a, b) =>
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      ));
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [user]);

  const handleMemberAdded = () => {
    setShowAddModal(false);
    loadMembers();
  };

  const handleMemberRemoved = () => {
    loadMembers();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
              Team Management
            </h1>
            <p className="text-[#6B7B8D]">
              {members.length} {members.length === 1 ? 'member' : 'members'} in your team
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Add Team Member
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="min-h-96" />
      ) : members.length === 0 ? (
        <div className="text-center py-16 bg-[#F8FAFB] rounded-lg border border-[#D3D1C7]">
          <p className="text-[#6B7B8D] text-lg mb-4">
            No team members yet. Invite your first team member to collaborate.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            Invite First Team Member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onRemoved={handleMemberRemoved}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTeamMemberModal
          onClose={() => setShowAddModal(false)}
          onMemberAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}

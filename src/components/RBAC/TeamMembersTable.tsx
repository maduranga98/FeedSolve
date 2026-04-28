import { useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Badge, LoadingSpinner } from '../Shared';
import { RoleModal } from './RoleModal';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS } from '../../lib/rbac';
import { PermissionGuard } from './PermissionGuard';
import type { TeamMember, UserRole } from '../../types';

interface TeamMembersTableProps {
  members: TeamMember[];
  currentUserId: string;
  isLoading?: boolean;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

export function TeamMembersTable({
  members,
  currentUserId,
  isLoading = false,
  onRoleChange,
  onRemoveMember,
}: TeamMembersTableProps) {
  const { isHigherOrEqual } = usePermissions();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      setRemovingMemberId(userId);
      setError('');
      await onRemoveMember(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await onRoleChange(userId, newRole);
    setEditingMemberId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-center text-color-muted-text py-8">No team members yet.</p>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-color-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-color-body-text">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-color-body-text">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-color-body-text">
                Role
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-color-body-text">
                Joined
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-color-body-text">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const canManage = isHigherOrEqual(member.role) && !isCurrentUser;

              return (
                <tr
                  key={member.userId}
                  className={`border-b border-color-border hover:bg-color-surface-light transition ${
                    isCurrentUser ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-color-body-text">{member.name}</p>
                    {isCurrentUser && (
                      <p className="text-xs text-color-muted-text">You</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-color-muted-text">{member.email}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={member.role === 'owner' ? 'primary' : undefined}
                      className="capitalize"
                    >
                      {ROLE_LABELS[member.role]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-color-muted-text">
                    {member.joinedAt?.toDate?.().toLocaleDateString() ||
                      new Date(member.joinedAt as any).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <PermissionGuard permission="team:manage">
                      <div className="flex justify-end gap-2">
                        {canManage && (
                          <>
                            <button
                              onClick={() => setEditingMemberId(member.userId)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit role"
                              disabled={removingMemberId === member.userId}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleRemove(member.userId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remove member"
                              disabled={removingMemberId === member.userId}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {!canManage && !isCurrentUser && (
                          <p className="text-xs text-color-muted-text">No actions</p>
                        )}
                      </div>
                    </PermissionGuard>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingMemberId && (
        <RoleModal
          isOpen={true}
          memberName={members.find(m => m.userId === editingMemberId)?.name || ''}
          currentRole={members.find(m => m.userId === editingMemberId)?.role || 'viewer'}
          onConfirm={(newRole) => handleRoleChange(editingMemberId, newRole)}
          onCancel={() => setEditingMemberId(null)}
        />
      )}
    </>
  );
}

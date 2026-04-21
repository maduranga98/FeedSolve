import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { Button, Input, LoadingSpinner } from '../../components/Shared';
import { TeamMembersTable } from '../../components/RBAC/TeamMembersTable';
import { RoleSelector } from '../../components/RBAC/RoleSelector';
import { RoleIndicator } from '../../components/RBAC/RoleIndicator';
import { PermissionGuard, PermissionDenied } from '../../components/RBAC/PermissionGuard';
import {
  getTeamMembers,
  updateMemberRole,
  removeTeamMember,
  inviteTeamMember,
  getCompanyInvitations,
} from '../../lib/firestore';
import type { TeamMember, TeamInvitation, User, UserRole } from '../../types';

export function TeamManagement() {
  const { user } = useAuth();
  const { hasPermissionTo } = usePermissions();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  const currentUser = user as User;

  useEffect(() => {
    loadTeamData();
  }, [user]);

  async function loadTeamData() {
    try {
      setLoading(true);
      const [members, invitations] = await Promise.all([
        getTeamMembers(currentUser.companyId),
        getCompanyInvitations(currentUser.companyId),
      ]);
      setTeamMembers(members);
      setPendingInvitations(invitations);
    } catch (err) {
      setError('Failed to load team data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setError('Please enter an email');
      return;
    }

    if (!hasPermissionTo('team:invite')) {
      setError('You do not have permission to invite team members');
      return;
    }

    try {
      setInviting(true);
      setError('');
      await inviteTeamMember(currentUser.companyId, inviteEmail, inviteRole, currentUser.id);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('viewer');
      await loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      console.error(err);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    try {
      await updateMemberRole(userId, newRole);
      setSuccess('Role updated');
      await loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      console.error(err);
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeTeamMember(userId);
      setSuccess('Team member removed');
      await loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team member');
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-color-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-color-surface rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-color-primary">Team Management</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-color-muted-text">Your Role:</span>
              <RoleIndicator />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-color-error text-color-error rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-color-success text-color-success rounded-md">
              {success}
            </div>
          )}

          <PermissionGuard
            permission="team:invite"
            fallback={
              <div className="mb-8">
                <PermissionDenied message="You do not have permission to invite team members" />
              </div>
            }
          >
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-color-accent-light">
              <h2 className="text-xl font-semibold text-color-primary mb-4">
                Invite Team Member
              </h2>
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  disabled={inviting}
                />
                <RoleSelector
                  value={inviteRole}
                  onChange={setInviteRole}
                  disabled={inviting}
                />
                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  isLoading={inviting}
                >
                  Send Invitation
                </Button>
              </div>
            </div>
          </PermissionGuard>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-color-primary mb-4">
              Team Members ({teamMembers.length})
            </h2>
            <TeamMembersTable
              members={teamMembers}
              currentUserId={currentUser.id}
              isLoading={loading}
              onRoleChange={handleRoleChange}
              onRemoveMember={handleRemoveMember}
            />
          </div>

          {pendingInvitations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-color-primary mb-4">
                Pending Invitations ({pendingInvitations.length})
              </h2>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50"
                  >
                    <div>
                      <p className="font-medium text-color-body-text">{invitation.email}</p>
                      <p className="text-sm text-color-muted-text">
                        Invited as {invitation.role}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                      PENDING
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

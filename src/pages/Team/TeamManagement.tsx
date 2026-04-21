import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Badge, LoadingSpinner } from '../../components/Shared';
import {
  getTeamMembers,
  updateMemberRole,
  removeTeamMember,
  inviteTeamMember,
  getCompanyInvitations,
} from '../../lib/firestore';
import type { TeamMember, TeamInvitation, User } from '../../types';

export function TeamManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
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

    if (currentUser.role !== 'admin') {
      setError('Only admins can invite team members');
      return;
    }

    try {
      setInviting(true);
      setError('');
      await inviteTeamMember(currentUser.companyId, inviteEmail, inviteRole, currentUser.id);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      await loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      console.error(err);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
    if (currentUser.role !== 'admin') {
      setError('Only admins can change roles');
      return;
    }

    try {
      await updateMemberRole(userId, newRole);
      setSuccess('Role updated');
      await loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update role');
      console.error(err);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (currentUser.role !== 'admin') {
      setError('Only admins can remove members');
      return;
    }

    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await removeTeamMember(userId);
      setSuccess('Team member removed');
      await loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove team member');
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
          <h1 className="text-3xl font-bold text-color-primary mb-8">Team Management</h1>

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

          {user.role === 'admin' && (
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
                />
                <div>
                  <label className="block text-sm font-medium text-color-body-text mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-4 py-2 border border-color-border rounded-md focus:ring-2 focus:ring-color-accent focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  isLoading={inviting}
                >
                  Send Invitation
                </Button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-color-primary mb-4">
              Team Members ({teamMembers.length})
            </h2>
            {teamMembers.length === 0 ? (
              <p className="text-color-muted-text">No team members yet.</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-4 border border-color-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-color-body-text">{member.name}</p>
                      <p className="text-sm text-color-muted-text">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.role === 'admin' && member.userId !== user.id && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.userId, e.target.value as 'admin' | 'member')
                            }
                            className="px-3 py-1 border border-color-border rounded-md text-sm focus:ring-2 focus:ring-color-accent"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button
                            onClick={() => handleRemoveMember(member.userId)}
                            variant="danger"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                      {member.role === 'admin' && (
                        <Badge variant="primary">{member.role.toUpperCase()}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingInvitations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-color-primary mb-4">
                Pending Invitations
              </h2>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border border-color-border rounded-lg bg-yellow-50"
                  >
                    <div>
                      <p className="font-medium text-color-body-text">{invitation.email}</p>
                      <p className="text-sm text-color-muted-text">
                        Invited as {invitation.role}
                      </p>
                    </div>
                    <Badge variant="warning">PENDING</Badge>
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

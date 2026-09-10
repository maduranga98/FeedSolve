import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { useUsage } from "../../hooks/useUsage";
import { Button, Input, LoadingSpinner } from "../../components/Shared";
import { TeamMembersTable } from "../../components/RBAC/TeamMembersTable";
import { RoleSelector } from "../../components/RBAC/RoleSelector";
import { RoleIndicator } from "../../components/RBAC/RoleIndicator";
import {
  PermissionGuard,
  PermissionDenied,
} from "../../components/RBAC/PermissionGuard";
import {
  getTeamMembers,
  updateMemberRole,
  removeTeamMember,
  inviteTeamMember,
  getCompanyInvitations,
  deleteInvitation,
  addAuditLog,
} from "../../lib/firestore";
import type { TeamMember, TeamInvitation, User, UserRole } from "../../types";

export function TeamManagement() {
  const { user } = useAuth();
  const { hasPermissionTo } = usePermissions();
  const { teamMembers: teamMembersUsage } = useUsage();
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    TeamInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUser = user as User;

  useEffect(() => {
    document.title = `${t("team")} | FeedSolve`;
  }, []);

  useEffect(() => {
    if (!user) return;
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
      setError(t("team_page.failed_load"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setError(t("team_page.enter_email"));
      return;
    }

    if (!hasPermissionTo("team:invite")) {
      setError(t("team_page.no_invite_permission"));
      return;
    }

    const pendingCount = pendingInvitations.length;
    const projectedCount = teamMembers.length + pendingCount + 1;
    if (
      teamMembersUsage.limit > 0 &&
      Number.isFinite(teamMembersUsage.limit) &&
      projectedCount > teamMembersUsage.limit
    ) {
      setError(t("team_page.limit_reached", { limit: teamMembersUsage.limit }));
      return;
    }

    try {
      setInviting(true);
      setError("");
      await inviteTeamMember(
        currentUser.companyId,
        inviteEmail,
        inviteRole,
        currentUser.id,
      );
      void addAuditLog(currentUser.companyId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: `Invited team member`,
        resourceType: "team",
        resourceName: inviteEmail,
        details: { invitedEmail: inviteEmail, role: inviteRole },
      });
      setSuccess(t("team_page.invitation_sent", { email: inviteEmail }));
      setInviteEmail("");
      setInviteRole("viewer");
      await loadTeamData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("team_page.failed_invite"),
      );
      console.error(err);
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvitation(invitation: TeamInvitation) {
    if (!confirm(t("team_page.confirm_cancel_invitation"))) return;

    try {
      setCancellingInvitationId(invitation.id);
      setError("");
      await deleteInvitation(invitation.id);
      void addAuditLog(currentUser.companyId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: "Cancelled invitation",
        resourceType: "team",
        resourceId: invitation.id,
        resourceName: invitation.email,
        details: { invitedEmail: invitation.email, role: invitation.role },
      });
      setSuccess(t("team_page.invitation_cancelled"));
      await loadTeamData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("team_page.failed_cancel_invitation"),
      );
      console.error(err);
    } finally {
      setCancellingInvitationId(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    try {
      const target = teamMembers.find((m) => m.userId === userId);
      await updateMemberRole(userId, newRole);
      void addAuditLog(currentUser.companyId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: `Changed role to "${newRole}"`,
        resourceType: "team",
        resourceId: userId,
        resourceName: target?.name ?? userId,
        details: { oldRole: target?.role, newRole },
      });
      setSuccess(t("team_page.role_updated"));
      await loadTeamData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team_page.failed_role"));
      console.error(err);
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      const target = teamMembers.find((m) => m.userId === userId);
      await removeTeamMember(userId);
      void addAuditLog(currentUser.companyId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: "Removed team member",
        resourceType: "team",
        resourceId: userId,
        resourceName: target?.name ?? userId,
        details: { removedEmail: target?.email },
      });
      setSuccess(t("team_page.member_removed"));
      await loadTeamData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("team_page.failed_remove"),
      );
      console.error(err);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--c-se1e8ef)]">
      {/* Page header */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be8ecf0)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-[var(--c-t2e86ab)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">
                  {t("team_page.title")}
                </h1>
                <p className="text-sm text-[var(--c-t6b7b8d)] mt-0.5">
                  {t("team_page.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-[var(--c-t6b7b8d)]">{t("team_page.your_role")}</span>
              <RoleIndicator />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-[var(--c-sffe5e5)] border border-[var(--c-be74c3c)] text-[var(--c-te74c3c)] rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-[var(--c-sebf9f1)] border border-[var(--c-b27ae60)] text-[var(--c-t27ae60)] rounded-xl">
            {success}
          </div>
        )}

        <PermissionGuard
          permission="team:invite"
          fallback={
            <div>
              <PermissionDenied message="You do not have permission to invite team members" />
            </div>
          }
        >
          <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] p-6">
            <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-4">
              {t("team_page.invite_member")}
            </h2>
            <div className="space-y-4">
              <Input
                label={t("forms:team.member_email")}
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
                {t("forms:team.add_member")}
              </Button>
            </div>
          </div>
        </PermissionGuard>

        <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] p-6">
          <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-4">
            {t("team_page.members_count", { count: teamMembers.length })}
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
          <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] p-6">
            <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-4">
              {t("team_page.pending_title", { count: pendingInvitations.length })}
            </h2>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-[var(--c-bfff3cd)] rounded-xl bg-[var(--c-sfffbf0)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--c-t1e3a5f)] break-all">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-[var(--c-t6b7b8d)]">
                      {t("team_page.invited_as", { role: invitation.role })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    <span className="px-3 py-1 bg-[var(--c-sfff3cd)] text-[var(--c-tb06f00)] rounded-full text-xs font-semibold uppercase tracking-wide">
                      {t("team_page.pending")}
                    </span>
                    <PermissionGuard permission="team:invite">
                      <button
                        onClick={() => handleCancelInvitation(invitation)}
                        disabled={cancellingInvitationId === invitation.id}
                        className="p-2 text-[var(--c-te74c3c)] hover:bg-[var(--c-sffe5e5)] rounded-lg transition disabled:opacity-50"
                        title={t("team_page.cancel_invitation")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

import type { UserRole } from '../types';

export type Permission =
  | 'submissions:read'
  | 'submissions:create'
  | 'submissions:update'
  | 'submissions:delete'
  | 'submissions:assign'
  | 'submissions:reply'
  | 'team:read'
  | 'team:invite'
  | 'team:manage'
  | 'team:remove'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'integrations:read'
  | 'integrations:write'
  | 'analytics:read'
  | 'company:read'
  | 'company:update'
  | 'company:delete'
  | 'billing:read'
  | 'billing:manage'
  | 'audit:read';

export const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  owner: new Set([
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'submissions:delete',
    'submissions:assign',
    'submissions:reply',
    'team:invite',
    'team:manage',
    'team:remove',
    'webhooks:read',
    'webhooks:write',
    'integrations:read',
    'integrations:write',
    'analytics:read',
    'company:read',
    'company:update',
    'company:delete',
    'billing:read',
    'billing:manage',
  ]),
  admin: new Set([
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'submissions:delete',
    'submissions:assign',
    'submissions:reply',
    'team:invite',
    'team:manage',
    'team:remove',
    'webhooks:read',
    'webhooks:write',
    'integrations:read',
    'integrations:write',
    'analytics:read',
    'company:read',
  ]),
  manager: new Set([
    'submissions:read',
    'submissions:update',
    'submissions:assign',
    'submissions:reply',
    'analytics:read',
  ]),
  viewer: new Set([
    'submissions:read',
    'analytics:read',
  ]),
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  viewer: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full access, can manage team, billing, and company settings',
  admin: 'Manage submissions, team members, webhooks, and integrations',
  manager: 'View and manage submissions, assign tasks, and reply to submitters',
  viewer: 'Read-only access to submissions and analytics',
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function canManageRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export function canDemoteRole(userRole: UserRole, currentRole: UserRole, newRole: UserRole): boolean {
  if (userRole !== 'owner' && userRole !== 'admin') return false;
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[newRole];
}

export function getAssignableRoles(userRole: UserRole): UserRole[] {
  const hierarchy = ROLE_HIERARCHY[userRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < hierarchy)
    .map(([role]) => role as UserRole);
}

export function isRoleHigherOrEqual(userRole: UserRole, compareRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[compareRole];
}

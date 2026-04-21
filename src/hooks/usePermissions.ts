import { useAuth } from './useAuth';
import { hasPermission, canManageRole, getAssignableRoles, isRoleHigherOrEqual } from '../lib/rbac';
import type { Permission, UserRole } from '../types';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermissionTo = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const canManage = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return canManageRole(user.role, targetRole);
  };

  const canAssignRoles = (): UserRole[] => {
    if (!user) return [];
    return getAssignableRoles(user.role);
  };

  const isHigherOrEqual = (compareRole: UserRole): boolean => {
    if (!user) return false;
    return isRoleHigherOrEqual(user.role, compareRole);
  };

  return {
    hasPermissionTo,
    canManage,
    canAssignRoles,
    isHigherOrEqual,
    userRole: user?.role,
  };
}

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types';

interface PermissionGuardProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const { hasPermissionTo } = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? permissions.every(p => hasPermissionTo(p))
    : permissions.some(p => hasPermissionTo(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionDeniedProps {
  message?: string;
}

export function PermissionDenied({ message = 'You do not have permission to access this' }: PermissionDeniedProps) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
      <p className="text-yellow-800 text-sm">{message}</p>
    </div>
  );
}

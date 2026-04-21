import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../lib/rbac';

interface RoleIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

export function RoleIndicator({ showLabel = true, className = '' }: RoleIndicatorProps) {
  const { user } = useAuth();

  if (!user) return null;

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    manager: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleColors[user.role]} ${className}`}>
      {showLabel ? ROLE_LABELS[user.role] : user.role.toUpperCase()}
    </span>
  );
}

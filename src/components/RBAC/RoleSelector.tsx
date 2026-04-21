import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../lib/rbac';
import type { UserRole } from '../../types';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  label?: string;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, label = 'Role', disabled = false }: RoleSelectorProps) {
  const { canAssignRoles } = usePermissions();
  const assignableRoles = canAssignRoles();

  if (assignableRoles.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">You cannot assign roles</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-color-body-text mb-2">
        {label}
      </label>
      <div className="grid grid-cols-1 gap-2">
        {assignableRoles.map((role) => (
          <label
            key={role}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
              value === role
                ? 'border-color-accent bg-blue-50'
                : 'border-color-border hover:border-color-accent-light'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="role"
              value={role}
              checked={value === role}
              onChange={(e) => onChange(e.target.value as UserRole)}
              disabled={disabled}
              className="mt-0.5 mr-3"
            />
            <div className="flex-1">
              <p className="font-medium text-color-body-text">{ROLE_LABELS[role]}</p>
              <p className="text-sm text-color-muted-text">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

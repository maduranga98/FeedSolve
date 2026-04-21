import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../Shared';
import { RoleSelector } from './RoleSelector';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS } from '../../lib/rbac';
import type { UserRole } from '../../types';

interface RoleModalProps {
  isOpen: boolean;
  memberName: string;
  currentRole: UserRole;
  onConfirm: (newRole: UserRole) => Promise<void>;
  onCancel: () => void;
}

export function RoleModal({
  isOpen,
  memberName,
  currentRole,
  onConfirm,
  onCancel,
}: RoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isHigherOrEqual } = usePermissions();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      onCancel();
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await onConfirm(selectedRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const canChangeRole = isHigherOrEqual(currentRole);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-color-border">
          <h2 className="text-xl font-bold text-color-primary">Change Member Role</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-color-muted-text hover:text-color-body-text"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-color-muted-text">Member</p>
            <p className="text-lg font-semibold text-color-body-text">{memberName}</p>
          </div>

          {!canChangeRole && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                You cannot change the role of someone with equal or higher privileges
              </p>
            </div>
          )}

          {canChangeRole && (
            <>
              <div>
                <label className="text-sm font-medium text-color-body-text">
                  Current Role: <span className="font-semibold">{ROLE_LABELS[currentRole]}</span>
                </label>
              </div>

              <RoleSelector
                value={selectedRole}
                onChange={setSelectedRole}
                label="New Role"
                disabled={isLoading}
              />

              {selectedRole !== currentRole && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Changing to <strong>{ROLE_LABELS[selectedRole]}</strong>
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-color-border">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={handleConfirm}
            disabled={isLoading || !canChangeRole || selectedRole === currentRole}
            isLoading={isLoading}
          >
            Update Role
          </Button>
        </div>
      </div>
    </div>
  );
}

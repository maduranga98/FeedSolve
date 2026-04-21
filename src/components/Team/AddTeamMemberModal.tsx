import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createUser } from '../../lib/firestore';
import { Button, Input } from '../Shared';
import { X } from 'lucide-react';

interface AddTeamMemberModalProps {
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AddTeamMemberModal({ onClose, onMemberAdded }: AddTeamMemberModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    try {
      const userId = `user_${Date.now()}`;
      await createUser(userId, email, name, user.companyId, role);
      onMemberAdded();
    } catch (err) {
      console.error('Failed to add team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1E3A5F]">Add Team Member</h2>
          <button
            onClick={onClose}
            className="text-[#6B7B8D] hover:text-[#444441]"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#444441] mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              disabled={loading}
              className="w-full px-3 py-2 border border-[#D3D1C7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-[#FDE8E8] text-[#A32D2D] rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

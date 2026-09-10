import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateSubmissionPriority, addAuditLog } from '../../lib/firestore';

interface PriorityDropdownProps {
  submissionId: string;
  currentPriority: 'low' | 'medium' | 'high' | 'critical';
  onUpdated?: () => void;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-[var(--c-se8f4f8)]', text: 'text-[var(--c-t0b5563)]' },
  medium: { bg: 'bg-[var(--c-sfef5e7)]', text: 'text-[var(--c-t854f0b)]' },
  high: { bg: 'bg-[var(--c-sfde8e8)]', text: 'text-[var(--c-ta32d2d)]' },
  critical: { bg: 'bg-[var(--c-s8b0000)]', text: 'text-[var(--c-tffffff)]' },
};

export default function PriorityDropdown({
  submissionId,
  currentPriority,
  onUpdated,
}: PriorityDropdownProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const style = priorityColors[currentPriority] || priorityColors.medium;

  const handleChange = async (
    newPriority: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    setLoading(true);
    try {
      await updateSubmissionPriority(submissionId, newPriority);
      if (user) {
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: `Changed priority to "${newPriority}"`,
          resourceType: 'submission',
          resourceId: submissionId,
          details: { from: currentPriority, to: newPriority },
        });
      }
      onUpdated?.();
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={currentPriority}
      onChange={(e) =>
        handleChange(e.target.value as 'low' | 'medium' | 'high' | 'critical')
      }
      disabled={loading}
      className={`w-full px-3 py-2 rounded text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)] disabled:opacity-50 ${style.bg} ${style.text}`}
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
    </select>
  );
}

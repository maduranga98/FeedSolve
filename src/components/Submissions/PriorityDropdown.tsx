import { useState } from 'react';
import { updateSubmissionPriority } from '../../lib/firestore';

interface PriorityDropdownProps {
  submissionId: string;
  currentPriority: 'low' | 'medium' | 'high' | 'critical';
  onUpdated?: () => void;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-[#E8F4F8]', text: 'text-[#0B5563]' },
  medium: { bg: 'bg-[#FEF5E7]', text: 'text-[#854F0B]' },
  high: { bg: 'bg-[#FDE8E8]', text: 'text-[#A32D2D]' },
  critical: { bg: 'bg-[#8B0000]', text: 'text-[#FFFFFF]' },
};

export default function PriorityDropdown({
  submissionId,
  currentPriority,
  onUpdated,
}: PriorityDropdownProps) {
  const [loading, setLoading] = useState(false);
  const style = priorityColors[currentPriority] || priorityColors.medium;

  const handleChange = async (
    newPriority: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    setLoading(true);
    try {
      await updateSubmissionPriority(submissionId, newPriority);
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
      className={`w-full px-3 py-2 rounded text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] disabled:opacity-50 ${style.bg} ${style.text}`}
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
    </select>
  );
}

import { useEffect, useRef } from 'react';
import type { TeamMember } from '../../types';

interface MentionDropdownProps {
  searchTerm: string;
  teamMembers: TeamMember[];
  onSelectMention: (member: TeamMember) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  searchTerm,
  teamMembers,
  onSelectMention,
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !searchTerm) return null;

  const filtered = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
    >
      {filtered.map((member) => (
        <button
          key={member.userId}
          onClick={() => {
            onSelectMention(member);
            onClose();
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition border-b border-gray-100 last:border-b-0"
        >
          <div className="font-medium text-gray-900">{member.name}</div>
          <div className="text-sm text-gray-500">{member.email}</div>
        </button>
      ))}
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { TeamMember } from '../../types';
import { MentionDropdown } from './MentionDropdown';

interface CommentInputProps {
  onSubmit: (content: string, mentions: string[]) => void;
  teamMembers: TeamMember[];
  placeholder?: string;
  isLoading?: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
  isReply?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  teamMembers,
  placeholder = 'Add a comment... Use @ to mention team members',
  isLoading = false,
  onCancel,
  showCancel = false,
  isReply = false,
}) => {
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Detect @ mentions
    const lastAtIndex = content.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = content.substring(lastAtIndex + 1);
      // Check if @ is followed by word characters
      if (/^[\w]*$/.test(afterAt) && afterAt.length > 0) {
        setMentionSearchTerm(afterAt);
        setShowMentionDropdown(true);
      } else if (afterAt === '') {
        setMentionSearchTerm('');
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  }, [content]);

  const handleSelectMention = (member: TeamMember) => {
    const lastAtIndex = content.lastIndexOf('@');
    const beforeAt = content.substring(0, lastAtIndex);
    const afterSearchTerm = content.substring(lastAtIndex + mentionSearchTerm.length + 1);

    const newContent = `${beforeAt}@${member.name} ${afterSearchTerm}`;
    setContent(newContent);
    setMentions([...mentions, member.userId]);
    setShowMentionDropdown(false);
    setMentionSearchTerm('');

    // Focus textarea after mention
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), mentions);
      setContent('');
      setMentions([]);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${isReply ? 'ml-6' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            rows={3}
            disabled={isLoading}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
          />

          <MentionDropdown
            searchTerm={mentionSearchTerm}
            teamMembers={teamMembers}
            onSelectMention={handleSelectMention}
            isOpen={showMentionDropdown}
            onClose={() => setShowMentionDropdown(false)}
          />
        </div>

        {/* Formatting Help */}
        <div className="mt-2 text-xs text-gray-500 flex gap-4">
          <span>**bold** for bold</span>
          <span>`code` for code</span>
          <span>@mention for team members</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-3">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Send size={16} />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </form>
  );
};

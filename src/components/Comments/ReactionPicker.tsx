import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const EMOJI_LIST = [
  '👍', '❤️', '😂', '🎉', '🚀', '✨', '🔥',
  '😕', '👏', '💯', '🙏', '😍', '🤔', '😢'
];

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectEmoji,
  isOpen,
  onClose,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50"
    >
      <div className="grid grid-cols-7 gap-1">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="text-xl p-1.5 hover:bg-gray-100 rounded transition"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

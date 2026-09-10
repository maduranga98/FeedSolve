import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchHistory } from '../../hooks/useSearchHistory';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search submissions...',
  suggestions = [],
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { history, addSearch, removeItem } = useSearchHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = [
    ...suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())),
    ...history
      .filter((h) => h.text.toLowerCase().includes(value.toLowerCase()))
      .map((h) => h.text)
      .slice(0, 3),
  ].slice(0, 8);

  const displaySuggestions = value.length > 0 ? filteredSuggestions : history.map((h) => h.text);

  const handleSelect = (text: string) => {
    onChange(text);
    addSearch(text);
    setIsOpen(false);
    if (onSubmit) {
      onSubmit(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSearch(value);
      setIsOpen(false);
      if (onSubmit) {
        onSubmit(value);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--c-t6b7b8d)]" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-[var(--c-bd3d1c7)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] focus:border-transparent"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--c-t6b7b8d)] hover:text-[var(--c-t444441)]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && displaySuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--c-sffffff)] border border-[var(--c-bd3d1c7)] rounded-lg shadow-lg">
          {displaySuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 hover:bg-[var(--c-sf1f5f8)] cursor-pointer border-b border-[var(--c-be0e8ef)] last:border-b-0 flex items-center justify-between group"
            >
              <span className="text-[var(--c-t444441)] text-sm">{suggestion}</span>
              {value.length === 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(suggestion);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-[var(--c-t6b7b8d)]" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

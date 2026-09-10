import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { isValidEmail } from '@/lib/notifications';

interface EmailChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}


/** Recipient list editor: type an address, press Enter, remove with the chip's ×. */
export function EmailChipInput({
  value,
  onChange,
  placeholder = 'name@company.com',
  label,
  hint,
  disabled = false,
}: EmailChipInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const addEmail = () => {
    const email = draft.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (value.includes(email)) {
      setError('That address is already on the list');
      return;
    }
    onChange([...value, email]);
    setDraft('');
    setError('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addEmail();
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-[var(--c-t1c1917)]">{label}</label>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={draft}
          disabled={disabled}
          onChange={event => {
            setDraft(event.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          onBlur={addEmail}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] px-3 py-2 text-sm text-[var(--c-t1c1917)] placeholder:text-[var(--c-ta8a29e)] focus:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bf5e6df)] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={addEmail}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--c-sc0694a)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--c-sa85a3e)] disabled:opacity-50"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {hint && !error && <p className="mt-1.5 text-xs text-[var(--c-t78716c)]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-[var(--c-tc0392b)]">{error}</p>}

      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map(email => (
            <li
              key={email}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c-sf5e6df)] py-1 pl-3 pr-1.5 text-sm text-[var(--c-t1c1917)]"
            >
              <span className="truncate max-w-[200px]">{email}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter(item => item !== email))}
                disabled={disabled}
                aria-label={`Remove ${email}`}
                className="rounded-full p-0.5 text-[var(--c-t8f8680)] transition-colors hover:bg-[var(--c-sffffff)] hover:text-[var(--c-tc0392b)] disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

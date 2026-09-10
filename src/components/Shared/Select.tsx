import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full pl-3.5 pr-9 py-2.5 border rounded-lg text-sm bg-[var(--c-sffffff)]
          text-[var(--c-t1c1917)] appearance-none cursor-pointer
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error
            ? 'border-[var(--c-bc0392b)] focus:ring-[var(--c-bc0392b)]/30 focus:border-[var(--c-bc0392b)]'
            : 'border-[var(--c-bd6cabf)] hover:border-[var(--c-b8f8680)] focus:ring-[var(--c-bc0694a)]/30 focus:border-[var(--c-bc0694a)]'
          }
          disabled:bg-[var(--c-sf5f0ec)] disabled:text-[var(--c-t8f8680)] disabled:cursor-not-allowed
          ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7B8D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.6rem center',
          backgroundSize: '1.2em 1.2em',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-[var(--c-tc0392b)] mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

import React from 'react';

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1E3A5F] mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2 border rounded-lg text-base font-inter bg-white focus:outline-none focus:ring-2 focus:ring-[#2E86AB] transition-colors ${
          error
            ? 'border-[#E74C3C] focus:ring-[#E74C3C]'
            : 'border-[#D3D1C7] hover:border-[#2E86AB]'
        }`}
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
        <p className="text-sm text-[#E74C3C] mt-1">{error}</p>
      )}
    </div>
  );
}

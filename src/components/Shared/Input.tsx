import React from 'react';

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1E3A5F] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-lg text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#2E86AB] transition-colors ${
          error
            ? 'border-[#E74C3C] focus:ring-[#E74C3C]'
            : 'border-[#D3D1C7] hover:border-[#2E86AB]'
        }`}
        {...props}
      />
      {error && (
        <p className="text-sm text-[#E74C3C] mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-[#6B7B8D] mt-1">{helperText}</p>
      )}
    </div>
  );
}

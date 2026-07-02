import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, helperText, leftIcon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1c1917] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716c]">
            {leftIcon}
          </span>
        )}
        <input
          className={`w-full ${leftIcon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 border rounded-lg text-sm bg-white
            placeholder:text-[#8f8680] text-[#1c1917]
            transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? 'border-[#c0392b] focus:ring-[#c0392b]/30 focus:border-[#c0392b]'
              : 'border-[#d6cabf] hover:border-[#8f8680] focus:ring-[#c0694a]/30 focus:border-[#c0694a]'
            }
            disabled:bg-[#f5f0ec] disabled:text-[#8f8680] disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[#c0392b] mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[#78716c] mt-1.5">{helperText}</p>
      )}
    </div>
  );
}

import { useState } from 'react';

interface SelectAllCheckboxProps {
  isChecked: boolean;
  isIndeterminate: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
}

export function SelectAllCheckbox({
  isChecked,
  isIndeterminate,
  onChange,
  disabled = false,
  title = 'Select all submissions',
}: SelectAllCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={isChecked}
      ref={(input) => {
        if (input) {
          input.indeterminate = isIndeterminate;
        }
      }}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      title={title}
      className="w-4 h-4 cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={title}
    />
  );
}

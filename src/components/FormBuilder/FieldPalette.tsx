import React from 'react';
import { FormFieldType } from '../../types';

interface FieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Short Text', icon: '📝' },
  { type: 'longtext', label: 'Long Text', icon: '📄' },
  { type: 'email', label: 'Email', icon: '✉️' },
  { type: 'select', label: 'Dropdown', icon: '▼' },
  { type: 'checkbox', label: 'Checkboxes', icon: '☑️' },
  { type: 'radio', label: 'Radio Buttons', icon: '◉' },
  { type: 'date', label: 'Date Picker', icon: '📅' },
  { type: 'file', label: 'File Upload', icon: '📎' },
  { type: 'rating', label: 'Rating (1-5)', icon: '⭐' },
];

export const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
  return (
    <div className="field-palette">
      <h3>Available Fields</h3>
      <div className="field-palette-grid">
        {FIELD_TYPES.map((field) => (
          <button
            key={field.type}
            className="field-palette-item"
            onClick={() => onAddField(field.type)}
            title={field.label}
          >
            <span className="field-palette-icon">{field.icon}</span>
            <span className="field-palette-label">{field.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

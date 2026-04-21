import React, { useState } from 'react';
import { FormField } from '../../types';
import { ConditionalLogicBuilder } from './ConditionalLogicBuilder';

interface FieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onCancel: () => void;
  maxLength: number;
  availableFields: FormField[];
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onUpdate,
  onCancel,
  maxLength,
  availableFields,
}) => {
  const [label, setLabel] = useState(field.label);
  const [helpText, setHelpText] = useState(field.helpText || '');
  const [required, setRequired] = useState(field.required);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [options, setOptions] = useState((field.options || []).join('\n'));
  const [showConditional, setShowConditional] = useState(!!field.conditionalLogic);

  const handleSave = () => {
    const updatedField: FormField = {
      ...field,
      label,
      helpText: helpText || undefined,
      required,
      placeholder: placeholder || undefined,
      options:
        field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
          ? options.split('\n').filter(o => o.trim())
          : undefined,
    };
    onUpdate(updatedField);
  };

  const fieldTypesWithOptions = ['select', 'radio', 'checkbox'];
  const fieldTypesWithPlaceholder = ['text', 'longtext', 'email'];

  return (
    <div className="field-editor">
      <h3>Edit Field</h3>

      <div className="form-group">
        <label>Field Label *</label>
        <input
          type="text"
          maxLength={maxLength}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter field label"
        />
        <small>{label.length}/{maxLength}</small>
      </div>

      {fieldTypesWithPlaceholder.includes(field.type) && (
        <div className="form-group">
          <label>Placeholder Text</label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Enter placeholder text"
          />
        </div>
      )}

      <div className="form-group">
        <label>Help Text</label>
        <textarea
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          placeholder="Optional help text for users"
          rows={3}
        />
      </div>

      {fieldTypesWithOptions.includes(field.type) && (
        <div className="form-group">
          <label>Options (one per line) *</label>
          <textarea
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            rows={4}
          />
        </div>
      )}

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Required field
        </label>
      </div>

      <div className="form-group">
        <button
          className="btn-secondary"
          onClick={() => setShowConditional(!showConditional)}
        >
          {showConditional ? 'Hide' : 'Add'} Conditional Logic
        </button>
      </div>

      {showConditional && (
        <ConditionalLogicBuilder
          field={field}
          onUpdate={onUpdate}
          availableFields={availableFields}
        />
      )}

      <div className="field-editor-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave}>
          Save Field
        </button>
      </div>
    </div>
  );
};

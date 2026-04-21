import React, { useState } from 'react';
import { FormField, ConditionalLogicRule } from '../../types';

interface ConditionalLogicBuilderProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  availableFields: FormField[];
}

export const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
  field,
  onUpdate,
  availableFields,
}) => {
  const [rule, setRule] = useState<ConditionalLogicRule>(
    field.conditionalLogic || {
      fieldId: '',
      operator: 'equals',
      value: '',
    }
  );

  const targetFieldOptions = availableFields
    .filter(f => f.id !== field.id && ['select', 'radio', 'checkbox', 'text', 'email'].includes(f.type));

  const targetField = availableFields.find(f => f.id === rule.fieldId);

  const handleApply = () => {
    const updatedField = {
      ...field,
      conditionalLogic: rule.fieldId && rule.value ? rule : undefined,
    };
    onUpdate(updatedField);
  };

  const handleRemove = () => {
    const updatedField = {
      ...field,
      conditionalLogic: undefined,
    };
    onUpdate(updatedField);
  };

  return (
    <div className="conditional-logic-builder">
      <h4>Show this field when:</h4>

      <div className="form-group">
        <label>Field</label>
        <select
          value={rule.fieldId}
          onChange={(e) => setRule({ ...rule, fieldId: e.target.value })}
        >
          <option value="">Select a field</option>
          {targetFieldOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label || f.type}
            </option>
          ))}
        </select>
      </div>

      {rule.fieldId && (
        <>
          <div className="form-group">
            <label>Operator</label>
            <select
              value={rule.operator}
              onChange={(e) =>
                setRule({
                  ...rule,
                  operator: e.target.value as ConditionalLogicRule['operator'],
                })
              }
            >
              <option value="equals">Equals</option>
              <option value="notEquals">Not Equals</option>
              <option value="contains">Contains</option>
            </select>
          </div>

          <div className="form-group">
            {targetField?.type === 'checkbox' ? (
              <label>
                Value
                <select
                  value={rule.value}
                  onChange={(e) => setRule({ ...rule, value: e.target.value })}
                >
                  <option value="">Select value</option>
                  {targetField.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>Value</label>
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => setRule({ ...rule, value: e.target.value })}
                  placeholder="Enter comparison value"
                />
              </>
            )}
          </div>

          <div className="conditional-logic-actions">
            <button className="btn-secondary" onClick={handleRemove}>
              Remove Rule
            </button>
            <button className="btn-primary" onClick={handleApply}>
              Apply Rule
            </button>
          </div>
        </>
      )}
    </div>
  );
};

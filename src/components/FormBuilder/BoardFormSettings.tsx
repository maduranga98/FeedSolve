import React, { useEffect, useState } from 'react';
import { FormBuilder, FormTemplateManager } from './index';
import { CustomForm, Subscription } from '../../types';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import { getFormTierLimits } from '../../lib/form-tier-limits';

interface BoardFormSettingsProps {
  boardId: string;
  companyId: string;
  subscription: Subscription;
  userId: string;
  onClose: () => void;
}

export const BoardFormSettings: React.FC<BoardFormSettingsProps> = ({
  boardId,
  companyId,
  subscription,
  userId,
  onClose,
}) => {
  const { form, loading, error, loadForm, saveForm } = useFormBuilder({
    boardId,
    companyId,
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const tierLimits = getFormTierLimits(subscription);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSaveForm = async (newForm: CustomForm) => {
    try {
      await saveForm(newForm);
      setShowBuilder(false);
    } catch (err) {
      console.error('Failed to save form:', err);
    }
  };

  const handleApplyTemplate = (template: CustomForm) => {
    handleSaveForm(template);
    setShowTemplates(false);
  };

  if (loading) {
    return <div className="board-form-settings loading">Loading...</div>;
  }

  return (
    <div className="board-form-settings">
      <div className="board-form-settings-header">
        <h2>Custom Form Settings</h2>
        <button className="btn-secondary" onClick={onClose}>
          ✕
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showBuilder ? (
        <FormBuilder
          initialForm={form || undefined}
          onSave={handleSaveForm}
          onCancel={() => setShowBuilder(false)}
          maxFields={tierLimits.maxFormFields}
        />
      ) : showTemplates ? (
        <FormTemplateManager
          boardId={boardId}
          companyId={companyId}
          onApplyTemplate={handleApplyTemplate}
          onCancel={() => setShowTemplates(false)}
          userId={userId}
        />
      ) : (
        <div className="board-form-settings-content">
          <div className="form-status">
            {form && form.fields.length > 0 ? (
              <div className="form-enabled">
                <h3>✓ Custom Form Enabled</h3>
                <p>{form.fields.length} fields configured</p>
              </div>
            ) : (
              <div className="form-disabled">
                <h3>Custom Form</h3>
                <p>No custom form configured yet</p>
              </div>
            )}
          </div>

          <div className="form-settings-tier">
            <h4>Plan Limits</h4>
            <div className="tier-info">
              <p>
                <strong>Max Fields:</strong> {tierLimits.maxFormFields === Infinity ? 'Unlimited' : tierLimits.maxFormFields}
              </p>
              <p>
                <strong>Conditional Logic:</strong>{' '}
                {tierLimits.conditionalLogicEnabled ? '✓ Enabled' : '✗ Not included'}
              </p>
              <p>
                <strong>Multi-step Forms:</strong>{' '}
                {tierLimits.multiStepFormsEnabled ? '✓ Enabled' : '✗ Not included'}
              </p>
              <p>
                <strong>Templates:</strong> Up to {tierLimits.maxTemplates === Infinity ? 'unlimited' : tierLimits.maxTemplates}
              </p>
            </div>
          </div>

          <div className="form-settings-actions">
            <button
              className="btn-primary"
              onClick={() => setShowBuilder(true)}
            >
              {form && form.fields.length > 0 ? 'Edit Form' : 'Create Custom Form'}
            </button>
            {tierLimits.maxTemplates > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setShowTemplates(true)}
              >
                Use Template
              </button>
            )}
          </div>

          {form && form.fields.length > 0 && (
            <div className="form-fields-preview">
              <h4>Current Fields</h4>
              <ul>
                {form.fields.map((field) => (
                  <li key={field.id}>
                    <span className="field-icon">
                      {field.type === 'text' && '📝'}
                      {field.type === 'longtext' && '📄'}
                      {field.type === 'email' && '✉️'}
                      {field.type === 'select' && '▼'}
                      {field.type === 'checkbox' && '☑️'}
                      {field.type === 'radio' && '◉'}
                      {field.type === 'date' && '📅'}
                      {field.type === 'file' && '📎'}
                      {field.type === 'rating' && '⭐'}
                    </span>
                    <span className="field-label">
                      {field.label} {field.required && '*'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

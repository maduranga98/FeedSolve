import React, { useState } from 'react';
import { FormField, CustomForm, FormFieldType } from '../../types';
import { FieldPalette } from './FieldPalette';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';
import { validateFormSchema } from '../../lib/form-validation';
import './FormBuilder.css';

interface FormBuilderProps {
  initialForm?: CustomForm;
  onSave: (form: CustomForm) => Promise<void>;
  onCancel: () => void;
  maxFields: number;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  initialForm,
  onSave,
  onCancel,
  maxFields,
}) => {
  const [fields, setFields] = useState<FormField[]>(initialForm?.fields || []);
  const [draggedField, setDraggedField] = useState<FormField | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddField = (type: FormFieldType) => {
    if (fields.length >= maxFields) {
      setError(`Maximum of ${maxFields} fields allowed`);
      return;
    }

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: '',
      required: false,
      order: fields.length,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? [] : undefined,
    };

    setFields([...fields, newField]);
    setEditingField(newField);
  };

  const handleUpdateField = (updatedField: FormField) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleDuplicateField = (field: FormField) => {
    const duplicate: FormField = {
      ...field,
      id: `field-${Date.now()}`,
      order: fields.length,
    };
    setFields([...fields, duplicate]);
  };

  const handleDragStart = (field: FormField) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedField) return;

    const newFields = [...fields];
    const draggedIndex = newFields.findIndex(f => f.id === draggedField.id);

    if (draggedIndex !== index && draggedIndex !== -1) {
      const temp = newFields[draggedIndex];
      newFields[draggedIndex] = newFields[index];
      newFields[index] = temp;

      newFields.forEach((f, i) => {
        f.order = i;
      });

      setFields(newFields);
    }
  };

  const handleSaveForm = async () => {
    const validation = validateFormSchema(fields);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsSaving(true);
    try {
      const form: CustomForm = {
        enabled: true,
        fields,
        createdAt: initialForm?.createdAt || new Date() as any,
        updatedAt: new Date() as any,
      };
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="form-builder">
      <div className="form-builder-header">
        <h2>Custom Form Builder</h2>
        <div className="form-builder-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSaveForm}
            disabled={isSaving || fields.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-builder-content">
        {showPreview ? (
          <div className="form-builder-preview-section">
            <FormPreview fields={fields} />
          </div>
        ) : (
          <>
            <div className="form-builder-palette">
              <FieldPalette onAddField={handleAddField} />
            </div>

            <div className="form-builder-editor">
              {editingField && (
                <FieldEditor
                  field={editingField}
                  onUpdate={handleUpdateField}
                  onCancel={() => setEditingField(null)}
                  maxLength={50}
                  availableFields={fields}
                />
              )}
            </div>

            <div className="form-builder-canvas">
              <div className="field-count">
                {fields.length} / {maxFields} fields
              </div>
              {fields.length === 0 ? (
                <div className="empty-state">
                  <p>No fields yet. Add your first field from the palette.</p>
                </div>
              ) : (
                <div className="fields-list">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="field-item"
                      draggable
                      onDragStart={() => handleDragStart(field)}
                      onDragOver={(e) => handleDragOver(e, index)}
                    >
                      <div className="field-handle">::</div>
                      <div className="field-content">
                        <div className="field-info">
                          <span className="field-label">{field.label || `${field.type} field`}</span>
                          <span className="field-type">{field.type}</span>
                          {field.required && <span className="field-required">*</span>}
                        </div>
                      </div>
                      <div className="field-actions">
                        <button
                          className="btn-icon"
                          onClick={() => setEditingField(field)}
                          title="Edit field"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDuplicateField(field)}
                          title="Duplicate field"
                        >
                          ⧉
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteField(field.id)}
                          title="Delete field"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

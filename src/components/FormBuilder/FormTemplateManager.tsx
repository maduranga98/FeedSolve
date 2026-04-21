import React, { useEffect, useState } from 'react';
import { FormTemplate, CustomForm } from '../../types';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import './FormTemplateManager.css';

interface FormTemplateManagerProps {
  boardId: string;
  companyId: string;
  onApplyTemplate: (form: CustomForm) => void;
  onCancel: () => void;
  userId: string;
}

export const FormTemplateManager: React.FC<FormTemplateManagerProps> = ({
  boardId,
  companyId,
  onApplyTemplate,
  onCancel,
  userId,
}) => {
  const {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    removeTemplate,
    applyTemplate,
  } = useFormBuilder({ boardId, companyId });

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleApplyTemplate = async (template: FormTemplate) => {
    try {
      await applyTemplate(template.id);
      onApplyTemplate(template.form);
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await removeTemplate(templateId);
      } catch (err) {
        console.error('Failed to delete template:', err);
      }
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      alert('Template name is required');
      return;
    }

    try {
      await createTemplate(
        newTemplate.name,
        newTemplate.description,
        { enabled: true, fields: [], createdAt: new Date() as any, updatedAt: new Date() as any },
        false
      );
      setNewTemplate({ name: '', description: '' });
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  };

  return (
    <div className="form-template-manager">
      <div className="template-manager-header">
        <h3>Form Templates</h3>
        <button className="btn-secondary" onClick={onCancel}>
          ✕ Close
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="template-manager-content">
        {loading ? (
          <div className="loading">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <p>No templates yet. Create your first template to save time.</p>
          </div>
        ) : (
          <div className="templates-list">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-info">
                  <h4>{template.name}</h4>
                  {template.description && <p>{template.description}</p>}
                  <small>
                    {template.usageCount} usage{template.usageCount !== 1 ? 's' : ''}
                  </small>
                </div>
                <div className="template-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    Use Template
                  </button>
                  {template.createdBy === userId && (
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="template-manager-footer">
        {!isCreating ? (
          <button
            className="btn-secondary"
            onClick={() => setIsCreating(true)}
          >
            + Create New Template
          </button>
        ) : (
          <div className="create-template-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Template description (optional)"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, description: e.target.value })
                }
              />
            </div>
            <div className="create-template-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsCreating(false);
                  setNewTemplate({ name: '', description: '' });
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateTemplate}
              >
                Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

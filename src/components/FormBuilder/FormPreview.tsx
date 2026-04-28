import React, { useState } from 'react';
import type { FormField, FormSubmissionData } from '../../types';
import { evaluateConditionalLogic } from '../../lib/form-validation';

interface FormPreviewProps {
  fields: FormField[];
}

export const FormPreview: React.FC<FormPreviewProps> = ({ fields }) => {
  const [formData, setFormData] = useState<FormSubmissionData>({});
  const [submitted, setSubmitted] = useState(false);

  const visibleFields = fields.filter(field => {
    if (!field.conditionalLogic) return true;
    return evaluateConditionalLogic(field.conditionalLogic, formData);
  });

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = () => {
    const errors = visibleFields
      .filter(f => f.required && !formData[f.id])
      .map(f => `${f.label} is required`);

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="form-preview">
      <div className="form-preview-header">
        <h3>Form Preview</h3>
        <p>This is how your form will appear to users</p>
      </div>

      {submitted && <div className="success-message">Form submitted successfully!</div>}

      <div className="form-preview-content">
        {fields.length === 0 ? (
          <div className="empty-state">
            <p>No fields to preview</p>
          </div>
        ) : (
          <>
            {visibleFields.map((field) => (
              <div key={field.id} className="form-field">
                <label>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>

                {field.helpText && <small className="help-text">{field.helpText}</small>}

                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                )}

                {field.type === 'longtext' && (
                  <textarea
                    placeholder={field.placeholder}
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    rows={4}
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    placeholder={field.placeholder || 'name@example.com'}
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && (
                  <div className="radio-group">
                    {field.options?.map((opt) => (
                      <label key={opt} className="radio-label">
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          checked={formData[field.id] === opt}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div className="checkbox-group">
                    {field.options?.map((opt) => (
                      <label key={opt} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={(formData[field.id] as string[])?.includes(opt) || false}
                          onChange={(e) => {
                            const current = (formData[field.id] as string[]) || [];
                            if (e.target.checked) {
                              handleInputChange(field.id, [...current, opt]);
                            } else {
                              handleInputChange(
                                field.id,
                                current.filter(v => v !== opt)
                              );
                            }
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                )}

                {field.type === 'file' && (
                  <input
                    type="file"
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.files?.[0]?.name || '')
                    }
                  />
                )}

                {field.type === 'rating' && (
                  <div className="rating-group">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`rating-star ${
                          (formData[field.id] as number) >= star ? 'active' : ''
                        }`}
                        onClick={() => handleInputChange(field.id, star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button className="btn-primary" onClick={handleSubmit}>
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
};

import type { ReactNode } from 'react';
import type { SubmissionCustomFieldValueType, SubmissionField } from '../../types';
import { Input, Select } from '../Shared';
import {
  MAX_SUBMISSION_TEXTAREA_LENGTH,
  MAX_SUBMISSION_TEXT_LENGTH,
  getInputFields,
} from '../../lib/submission-fields';
import type { SubmissionAnswers } from '../../lib/submission-fields';

interface CustomFieldsFormProps {
  fields: SubmissionField[];
  answers: SubmissionAnswers;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: SubmissionCustomFieldValueType) => void;
  disabled?: boolean;
  /** Keeps element ids unique when the form is rendered inside a modal over another form. */
  idPrefix?: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-[var(--c-tc0392b)]">{message}</p>;
}

function FieldLabel({ id, field, children }: { id: string; field: SubmissionField; children?: ReactNode }) {
  return (
    <label id={`${id}-label`} htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--c-t1c1917)]">
      {field.label}
      {field.required && <span className="ml-0.5 text-[var(--c-tc0392b)]">*</span>}
      {children}
    </label>
  );
}

/**
 * Renders a board's user-entered submission fields (auto-source fields are skipped: they are
 * filled from the submission itself on write). Used by both the internal Add Submission modal
 * and the public board form, mirroring the field switch in components/public/FeedbackForm.tsx.
 */
export function CustomFieldsForm({
  fields,
  answers,
  errors,
  onChange,
  disabled = false,
  idPrefix = 'custom-field',
}: CustomFieldsFormProps) {
  const renderInput = (field: SubmissionField, id: string) => {
    const value = answers[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div>
            <Input
              id={id}
              value={typeof value === 'string' ? value : ''}
              maxLength={MAX_SUBMISSION_TEXT_LENGTH}
              onChange={(e) => onChange(field.id, e.target.value)}
              error={error}
              disabled={disabled}
            />
          </div>
        );
      case 'textarea':
        return (
          <>
            <textarea
              id={id}
              value={typeof value === 'string' ? value : ''}
              maxLength={MAX_SUBMISSION_TEXTAREA_LENGTH}
              onChange={(e) => onChange(field.id, e.target.value)}
              rows={4}
              disabled={disabled}
              className={`w-full resize-none rounded-lg border bg-[var(--c-sffffff)] px-3.5 py-2.5 text-sm text-[var(--c-t1c1917)] placeholder:text-[var(--c-t8f8680)] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[var(--c-sf5f0ec)] ${
                error
                  ? 'border-[var(--c-bc0392b)] focus:ring-[var(--c-bc0392b)]/30'
                  : 'border-[var(--c-bd6cabf)] focus:border-[var(--c-bc0694a)] focus:ring-[var(--c-bc0694a)]/30'
              }`}
            />
            <FieldError message={error} />
          </>
        );
      case 'dropdown':
        return (
          <Select
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
            placeholder="Select an option"
            error={error}
            disabled={disabled}
          />
        );
      case 'date':
        return (
          <Input
            id={id}
            type="date"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            error={error}
            disabled={disabled}
          />
        );
      case 'checkbox':
        return (
          <>
            <label
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] px-3.5 py-2.5 text-sm text-[var(--c-t1c1917)]"
            >
              <input
                id={id}
                type="checkbox"
                checked={value === true}
                onChange={(e) => onChange(field.id, e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-[var(--c-sc0694a)]"
              />
              Yes
            </label>
            <FieldError message={error} />
          </>
        );
      case 'multiselect': {
        const selected = Array.isArray(value) ? value : [];
        return (
          <>
            <div
              role="group"
              aria-labelledby={`${id}-label`}
              className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-3 sm:grid-cols-2"
            >
              {(field.options ?? []).map((option) => {
                const checked = selected.includes(option);
                return (
                  <label key={option} className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--c-t1c1917)]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onChange(
                          field.id,
                          checked ? selected.filter((item) => item !== option) : [...selected, option]
                        )
                      }
                      disabled={disabled}
                      className="h-4 w-4 accent-[var(--c-sc0694a)]"
                    />
                    <span className="min-w-0 break-words">{option}</span>
                  </label>
                );
              })}
            </div>
            <FieldError message={error} />
          </>
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {getInputFields(fields).map((field) => {
        const id = `${idPrefix}-${field.id}`;
        return (
          <div key={field.id}>
            <FieldLabel id={id} field={field} />
            {renderInput(field, id)}
          </div>
        );
      })}
    </div>
  );
}

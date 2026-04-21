import { FormField, ConditionalLogicRule, FormSubmissionData } from '../types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateFormSchema = (fields: FormField[]): ValidationResult => {
  const errors: string[] = [];

  if (fields.length === 0) {
    errors.push('Form must have at least one field');
  }

  fields.forEach((field, index) => {
    if (!field.label || field.label.trim() === '') {
      errors.push(`Field ${index + 1}: Label is required`);
    }

    if (field.label && field.label.length > 100) {
      errors.push(`Field ${index + 1}: Label must be 100 characters or less`);
    }

    const fieldTypesWithOptions = ['select', 'radio', 'checkbox'];
    if (fieldTypesWithOptions.includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        errors.push(`Field ${index + 1} (${field.type}): Must have at least one option`);
      }

      if (field.options && field.options.some(opt => !opt.trim())) {
        errors.push(`Field ${index + 1}: Options cannot be empty`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateSubmission = (
  data: FormSubmissionData,
  fields: FormField[]
): ValidationResult => {
  const errors: string[] = [];

  fields.forEach((field) => {
    if (field.required) {
      const value = data[field.id];

      if (value === undefined || value === null || value === '') {
        errors.push(`${field.label} is required`);
      }

      if (Array.isArray(value) && value.length === 0) {
        errors.push(`${field.label} is required`);
      }
    }

    if (field.type === 'email' && data[field.id]) {
      const email = String(data[field.id]);
      if (!isValidEmail(email)) {
        errors.push(`${field.label}: Invalid email address`);
      }
    }

    if (field.type === 'date' && data[field.id]) {
      const date = String(data[field.id]);
      if (!isValidDate(date)) {
        errors.push(`${field.label}: Invalid date`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};

export const evaluateConditionalLogic = (
  rule: ConditionalLogicRule,
  formData: FormSubmissionData
): boolean => {
  const fieldValue = formData[rule.fieldId];

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  const stringValue = String(fieldValue).toLowerCase();
  const compareValue = rule.value.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return stringValue === compareValue;
    case 'notEquals':
      return stringValue !== compareValue;
    case 'contains':
      return stringValue.includes(compareValue);
    default:
      return true;
  }
};

export const getFieldsToShow = (
  fields: FormField[],
  formData: FormSubmissionData
): FormField[] => {
  return fields.filter((field) => {
    if (!field.conditionalLogic) return true;
    return evaluateConditionalLogic(field.conditionalLogic, formData);
  });
};

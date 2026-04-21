import { Subscription } from '../types';

export interface FormTierLimits {
  maxFormFields: number;
  maxTemplates: number;
  conditionalLogicEnabled: boolean;
  multiStepFormsEnabled: boolean;
  advancedValidationEnabled: boolean;
}

export const getFormTierLimits = (subscription: Subscription): FormTierLimits => {
  const tier = subscription.tier;

  const limits: Record<string, FormTierLimits> = {
    free: {
      maxFormFields: 5,
      maxTemplates: 0,
      conditionalLogicEnabled: false,
      multiStepFormsEnabled: false,
      advancedValidationEnabled: false,
    },
    starter: {
      maxFormFields: 10,
      maxTemplates: 3,
      conditionalLogicEnabled: true,
      multiStepFormsEnabled: false,
      advancedValidationEnabled: false,
    },
    growth: {
      maxFormFields: 20,
      maxTemplates: 10,
      conditionalLogicEnabled: true,
      multiStepFormsEnabled: true,
      advancedValidationEnabled: true,
    },
    business: {
      maxFormFields: Infinity,
      maxTemplates: Infinity,
      conditionalLogicEnabled: true,
      multiStepFormsEnabled: true,
      advancedValidationEnabled: true,
    },
  };

  return limits[tier] || limits.free;
};

export const canAddMoreFields = (
  currentFieldCount: number,
  limits: FormTierLimits
): boolean => {
  return currentFieldCount < limits.maxFormFields;
};

export const canCreateTemplate = (
  currentTemplateCount: number,
  limits: FormTierLimits
): boolean => {
  return currentTemplateCount < limits.maxTemplates;
};

export const formatFieldLimit = (tier: string, maxFields: number): string => {
  if (maxFields === Infinity) {
    return 'Unlimited';
  }
  return `${maxFields}`;
};

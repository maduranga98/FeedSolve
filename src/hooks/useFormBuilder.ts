import { useState, useCallback } from 'react';
import {
  saveFormToBoard,
  getFormFromBoard,
  saveFormTemplate,
  getFormTemplate,
  listFormTemplates,
  deleteFormTemplate,
  updateFormTemplate,
} from '../lib/form-storage';
import type { CustomForm, FormTemplate } from '../types';

interface UseFormBuilderOptions {
  boardId: string;
  companyId: string;
}

export const useFormBuilder = ({ boardId, companyId }: UseFormBuilderOptions) => {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedForm = await getFormFromBoard(boardId, companyId);
      setForm(loadedForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [boardId, companyId]);

  const saveForm = useCallback(
    async (customForm: CustomForm) => {
      setLoading(true);
      setError(null);
      try {
        await saveFormToBoard(boardId, companyId, customForm);
        setForm(customForm);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save form');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, companyId]
  );

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedTemplates = await listFormTemplates(companyId);
      setTemplates(loadedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const createTemplate = useCallback(
    async (
      name: string,
      description: string,
      formData: CustomForm,
      isPublic: boolean = false
    ) => {
      setLoading(true);
      setError(null);
      try {
        const templateId = await saveFormTemplate(companyId, {
          companyId,
          name,
          description,
          form: formData,
          usageCount: 0,
          createdBy: '', // Should be set by caller
          updatedAt: new Date() as any,
          isPublic,
        });
        await loadTemplates();
        return templateId;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create template');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [companyId, loadTemplates]
  );

  const applyTemplate = useCallback(
    async (templateId: string) => {
      setLoading(true);
      setError(null);
      try {
        const template = await getFormTemplate(companyId, templateId);
        if (!template) {
          throw new Error('Template not found');
        }
        setForm(template.form);

        // Increment usage count
        await updateFormTemplate(companyId, templateId, {
          usageCount: (template.usageCount || 0) + 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply template');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [companyId]
  );

  const removeTemplate = useCallback(
    async (templateId: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteFormTemplate(companyId, templateId);
        await loadTemplates();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete template');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [companyId, loadTemplates]
  );

  return {
    form,
    templates,
    loading,
    error,
    loadForm,
    saveForm,
    loadTemplates,
    createTemplate,
    applyTemplate,
    removeTemplate,
  };
};

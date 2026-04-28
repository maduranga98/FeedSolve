import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CustomForm, FormTemplate, Board } from '../types';

export const saveFormToBoard = async (
  boardId: string,
  companyId: string,
  form: CustomForm
): Promise<void> => {
  try {
    const boardRef = doc(db, 'companies', companyId, 'boards', boardId);
    await updateDoc(boardRef, {
      customForm: form,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to save form to board: ${error}`);
  }
};

export const getFormFromBoard = async (
  boardId: string,
  companyId: string
): Promise<CustomForm | null> => {
  try {
    const boardRef = doc(db, 'companies', companyId, 'boards', boardId);
    const boardSnap = await getDoc(boardRef);

    if (!boardSnap.exists()) {
      throw new Error('Board not found');
    }

    const boardData = boardSnap.data() as Board;
    return boardData.customForm || null;
  } catch (error) {
    throw new Error(`Failed to get form from board: ${error}`);
  }
};

export const saveFormTemplate = async (
  companyId: string,
  template: Omit<FormTemplate, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const templateId = `template-${Date.now()}`;
    const templateRef = doc(db, 'companies', companyId, 'formTemplates', templateId);

    const templateData: FormTemplate = {
      ...template,
      id: templateId,
      createdAt: Timestamp.now(),
    };

    await setDoc(templateRef, templateData);
    return templateId;
  } catch (error) {
    throw new Error(`Failed to save form template: ${error}`);
  }
};

export const getFormTemplate = async (
  companyId: string,
  templateId: string
): Promise<FormTemplate | null> => {
  try {
    const templateRef = doc(db, 'companies', companyId, 'formTemplates', templateId);
    const templateSnap = await getDoc(templateRef);

    return templateSnap.exists() ? (templateSnap.data() as FormTemplate) : null;
  } catch (error) {
    throw new Error(`Failed to get form template: ${error}`);
  }
};

export const listFormTemplates = async (
  companyId: string,
  isPublic?: boolean
): Promise<FormTemplate[]> => {
  try {
    const templatesRef = collection(db, 'companies', companyId, 'formTemplates');
    const constraints = isPublic !== undefined ? [where('isPublic', '==', isPublic)] : [];
    const q = query(templatesRef, ...constraints);
    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => doc.data() as FormTemplate);
  } catch (error) {
    throw new Error(`Failed to list form templates: ${error}`);
  }
};

export const updateFormTemplate = async (
  companyId: string,
  templateId: string,
  updates: Partial<FormTemplate>
): Promise<void> => {
  try {
    const templateRef = doc(db, 'companies', companyId, 'formTemplates', templateId);
    await updateDoc(templateRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to update form template: ${error}`);
  }
};

export const deleteFormTemplate = async (
  companyId: string,
  templateId: string
): Promise<void> => {
  try {
    const templateRef = doc(db, 'companies', companyId, 'formTemplates', templateId);
    await deleteDoc(templateRef);
  } catch (error) {
    throw new Error(`Failed to delete form template: ${error}`);
  }
};

export const saveFormSubmission = async (
  companyId: string,
  _boardId: string,
  submissionId: string,
  formData: Record<string, any>
): Promise<void> => {
  try {
    const submissionRef = doc(
      db,
      'companies',
      companyId,
      'submissions',
      submissionId
    );
    await updateDoc(submissionRef, {
      formData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to save form submission: ${error}`);
  }
};

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  setDoc,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import type {
  User,
  Company,
  CompanyBranding,
  Board,
  Submission,
  BoardFormInput,
  SubmissionFormInput,
  TeamInvitation,
  TeamMember,
  InternalNote,
  BoardTemplate,
} from '../types';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { generateTrackingCode, generateBoardSlug } from './utils';
import { v4 as uuidv4 } from 'uuid';

// User operations
export async function createUser(
  id: string,
  email: string,
  name: string,
  companyId: string,
  role: 'admin' | 'member' = 'admin'
): Promise<User> {
  const userRef = doc(db, 'users', id);
  const newUser: User = {
    id,
    email,
    name,
    companyId,
    role,
    createdAt: Timestamp.now(),
  };
  await setDoc(userRef, newUser);
  return newUser;
}

export async function getUser(id: string): Promise<User | null> {
  const userRef = doc(db, 'users', id);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? (snapshot.data() as User) : null;
}

// Company operations
export async function createCompany(
  id: string,
  name: string,
  email: string
): Promise<Company> {
  const companyRef = doc(db, 'companies', id);
  const now = Timestamp.now();
  const newCompany: Company = {
    id,
    name,
    email,
    billingEmail: email,
    subscription: {
      tier: 'free',
      billing: 'monthly',
      status: 'active',
    },
    usage: {
      submissionsThisMonth: 0,
      boardsCreated: 0,
      teamMembersAdded: 0,
      lastResetAt: now,
    },
    monthlySubmissionLimit: 100,
    boardCount: 0,
    webhooks: {
      enabled: false,
    },
    webhookStats: {
      totalSent: 0,
      failureCount: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(companyRef, newCompany);
  return newCompany;
}

export async function getCompany(id: string): Promise<Company | null> {
  const companyRef = doc(db, 'companies', id);
  const snapshot = await getDoc(companyRef);
  return snapshot.exists() ? (snapshot.data() as Company) : null;
}

// Board operations
export async function createBoard(
  companyId: string,
  input: BoardFormInput
): Promise<Board> {
  const slug = generateBoardSlug(input.name);
  const boardsRef = collection(db, 'boards');

  const newBoard: Omit<Board, 'id'> = {
    companyId,
    name: input.name,
    description: input.description,
    slug,
    categories: input.categories,
    isAnonymousAllowed: input.isAnonymousAllowed,
    qrCodeUrl: `${import.meta.env.VITE_APP_URL}/submit/${slug}`,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    submissionCount: 0,
  };

  const docRef = await addDoc(boardsRef, newBoard);
  return { ...newBoard, id: docRef.id } as Board;
}

export async function getBoardBySlug(slug: string): Promise<Board | null> {
  const boardsRef = collection(db, 'boards');
  const q = query(boardsRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Board;
}

export async function getCompanyBoards(companyId: string): Promise<Board[]> {
  const boardsRef = collection(db, 'boards');
  const q = query(boardsRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Board));
}

export async function getBoard(id: string): Promise<Board | null> {
  const boardRef = doc(db, 'boards', id);
  const snapshot = await getDoc(boardRef);
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Board : null;
}

// Submission operations
export async function createSubmission(
  boardId: string,
  companyId: string,
  input: SubmissionFormInput
): Promise<{ trackingCode: string; submissionId: string }> {
  const trackingCode = generateTrackingCode();
  const submissionsRef = collection(db, 'submissions');

  const newSubmission: Omit<Submission, 'id'> = {
    boardId,
    companyId,
    trackingCode,
    category: input.category,
    subject: input.subject,
    description: input.description,
    submitterEmail: input.email,
    isAnonymous: input.isAnonymous,
    status: 'received',
    priority: 'medium',
    internalNotes: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(submissionsRef, newSubmission);

  // Increment board submission count
  const boardRef = doc(db, 'boards', boardId);
  const boardData = await getDoc(boardRef);
  if (boardData.exists()) {
    const currentCount = (boardData.data() as Board).submissionCount || 0;
    await updateDoc(boardRef, { submissionCount: currentCount + 1 });
  }

  return { trackingCode, submissionId: docRef.id };
}

export async function getSubmissionByTrackingCode(
  code: string
): Promise<Submission | null> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('trackingCode', '==', code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id } as Submission;
}

export async function getCompanySubmissions(companyId: string, limitCount: number = 500): Promise<Submission[]> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(
    submissionsRef,
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Submission));
}

export async function getBoardSubmissions(boardId: string, limitCount: number = 500): Promise<Submission[]> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(
    submissionsRef,
    where('boardId', '==', boardId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Submission));
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: Submission['status']
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (status === 'resolved' || status === 'closed') {
    updateData.resolvedAt = Timestamp.now();
  }
  await updateDoc(submissionRef, updateData);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const submissionRef = doc(db, 'submissions', id);
  const snapshot = await getDoc(submissionRef);
  return snapshot.exists()
    ? ({ ...snapshot.data(), id: snapshot.id } as Submission)
    : null;
}

// Team management operations
export async function inviteTeamMember(
  companyId: string,
  email: string,
  role: 'admin' | 'member',
  invitedBy: string
): Promise<TeamInvitation> {
  const inviteCode = generateTrackingCode();
  const invitationsRef = collection(db, 'teamInvitations');

  const newInvitation: Omit<TeamInvitation, 'id'> = {
    companyId,
    email,
    role,
    invitedBy,
    inviteCode,
    status: 'pending',
    createdAt: Timestamp.now(),
    expiresAt: new Timestamp(
      Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      0
    ),
  };

  const docRef = await addDoc(invitationsRef, newInvitation);
  return { ...newInvitation, id: docRef.id } as TeamInvitation;
}

export async function getInvitationByCode(
  code: string
): Promise<TeamInvitation | null> {
  const invitationsRef = collection(db, 'teamInvitations');
  const q = query(invitationsRef, where('inviteCode', '==', code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id } as TeamInvitation;
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const invitationRef = doc(db, 'teamInvitations', invitationId);
  await updateDoc(invitationRef, { status: 'accepted' });
}

export async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => {
      const user = doc.data() as User;
      return {
        userId: user.id || doc.id,
        email: user.email,
        name: user.name,
        role: user.role,
        joinedAt: user.createdAt,
        status: user.status || 'active',
      } as TeamMember & { status: string };
    })
    .filter((member) => member.status !== 'inactive');
}

export async function updateMemberRole(
  userId: string,
  newRole: 'admin' | 'member'
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: newRole });
}

export async function removeTeamMember(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { status: 'inactive' });
}

export async function getCompanyInvitations(
  companyId: string
): Promise<TeamInvitation[]> {
  const invitationsRef = collection(db, 'teamInvitations');
  const q = query(
    invitationsRef,
    where('companyId', '==', companyId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as TeamInvitation));
}

// Submission editing operations
export async function updateSubmissionPriority(
  submissionId: string,
  priority: Submission['priority']
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, { priority, updatedAt: Timestamp.now() });
}

export async function updateSubmissionAssignment(
  submissionId: string,
  assignedTo?: string
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, { assignedTo, updatedAt: Timestamp.now() });
}

// Team Member operations (Day 1)
export async function getCompanyMembers(companyId: string): Promise<User[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as User));
}

export async function assignSubmission(
  submissionId: string,
  assignedToUserId: string
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    assignedTo: assignedToUserId,
    updatedAt: Timestamp.now(),
  });
}

export async function unassignSubmission(submissionId: string): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    assignedTo: undefined,
    updatedAt: Timestamp.now(),
  });
}

export async function getSubmissionsByAssignee(
  companyId: string,
  userId: string
): Promise<Submission[]> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(
    submissionsRef,
    where('companyId', '==', companyId),
    where('assignedTo', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Submission));
}

// Internal Notes operations (Day 2)
export async function addInternalNote(
  submissionId: string,
  text: string,
  createdBy: string
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  const submission = await getSubmission(submissionId);
  if (!submission) throw new Error('Submission not found');

  const newNote: InternalNote = {
    id: uuidv4(),
    text,
    createdBy,
    createdAt: Timestamp.now(),
  };

  await updateDoc(submissionRef, {
    internalNotes: arrayUnion(newNote),
    updatedAt: Timestamp.now(),
  });
}

export async function updateSubmissionPublicReply(
  submissionId: string,
  reply: string
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, { publicReply: reply, updatedAt: Timestamp.now() });
}

export async function addPublicReply(
  submissionId: string,
  reply: string,
  replyBy: string
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    publicReply: reply,
    publicReplyAt: Timestamp.now(),
    publicReplyBy: replyBy,
    updatedAt: Timestamp.now(),
  });
}

// Analytics operations (Day 4)
export interface CompanyStats {
  totalSubmissions: number;
  receivedCount: number;
  inReviewCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  resolutionRate: number;
  avgResolutionDays: number;
  submissionsByBoard: Record<string, { name: string; count: number }>;
  submissionsByCategory: Record<string, number>;
  submissionsByPriority: Record<string, number>;
  submissionsByAssignee: Record<string, { name: string; count: number }>;
}

export async function getCompanyStats(companyId: string): Promise<CompanyStats> {
  const [submissions, boards, members] = await Promise.all([
    getCompanySubmissions(companyId),
    getCompanyBoards(companyId),
    getCompanyMembers(companyId),
  ]);

  const stats: CompanyStats = {
    totalSubmissions: submissions.length,
    receivedCount: 0,
    inReviewCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    closedCount: 0,
    resolutionRate: 0,
    avgResolutionDays: 0,
    submissionsByBoard: {},
    submissionsByCategory: {},
    submissionsByPriority: {},
    submissionsByAssignee: {},
  };

  let totalResolutionTime = 0;
  let resolvedSubmissionCount = 0;

  const boardMap = new Map(boards.map((b) => [b.id, b.name]));
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  submissions.forEach((sub) => {
    // Count by status
    if (sub.status === 'received') stats.receivedCount++;
    else if (sub.status === 'in_review') stats.inReviewCount++;
    else if (sub.status === 'in_progress') stats.inProgressCount++;
    else if (sub.status === 'resolved') stats.resolvedCount++;
    else if (sub.status === 'closed') stats.closedCount++;

    // Resolution time
    if (
      (sub.status === 'resolved' || sub.status === 'closed') &&
      sub.resolvedAt &&
      sub.createdAt
    ) {
      const resTime =
        sub.resolvedAt.toDate().getTime() - sub.createdAt.toDate().getTime();
      totalResolutionTime += resTime;
      resolvedSubmissionCount++;
    }

    // By board
    const boardName = boardMap.get(sub.boardId) || 'Unknown';
    if (!stats.submissionsByBoard[sub.boardId]) {
      stats.submissionsByBoard[sub.boardId] = { name: boardName, count: 0 };
    }
    stats.submissionsByBoard[sub.boardId].count++;

    // By category
    stats.submissionsByCategory[sub.category] =
      (stats.submissionsByCategory[sub.category] || 0) + 1;

    // By priority
    stats.submissionsByPriority[sub.priority] =
      (stats.submissionsByPriority[sub.priority] || 0) + 1;

    // By assignee
    if (sub.assignedTo) {
      const assigneeName = memberMap.get(sub.assignedTo) || 'Unknown';
      if (!stats.submissionsByAssignee[sub.assignedTo]) {
        stats.submissionsByAssignee[sub.assignedTo] = {
          name: assigneeName,
          count: 0,
        };
      }
      stats.submissionsByAssignee[sub.assignedTo].count++;
    }
  });

  // Calculate rates
  const resolvedTotal = stats.resolvedCount + stats.closedCount;
  stats.resolutionRate =
    stats.totalSubmissions > 0
      ? (resolvedTotal / stats.totalSubmissions) * 100
      : 0;
  stats.avgResolutionDays =
    resolvedSubmissionCount > 0
      ? totalResolutionTime / resolvedSubmissionCount / 86400000
      : 0;

  return stats;
}

// Subscription operations
export async function updateCompanySubscription(
  companyId: string,
  updates: Partial<any>
): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  const subscriptionUpdates: Record<string, any> = {};
  Object.keys(updates).forEach((key) => {
    subscriptionUpdates[`subscription.${key}`] = updates[key];
  });
  subscriptionUpdates['updatedAt'] = Timestamp.now();
  await updateDoc(companyRef, subscriptionUpdates);
}

// Branding operations
export async function updateCompanyBranding(
  companyId: string,
  branding: Partial<CompanyBranding>
): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  const brandingUpdates: Record<string, unknown> = {};
  Object.entries(branding).forEach(([key, value]) => {
    brandingUpdates[`branding.${key}`] = value ?? deleteField();
  });
  brandingUpdates['updatedAt'] = Timestamp.now();
  await updateDoc(companyRef, brandingUpdates);
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
  oldStoragePath?: string
): Promise<{ url: string; storagePath: string }> {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 2MB.');
  }

  if (oldStoragePath) {
    try {
      const oldRef = ref(storage, oldStoragePath);
      await deleteObject(oldRef);
    } catch {
      // Old file may not exist
    }
  }

  const fileExtension = file.name.split('.').pop() || 'png';
  const storagePath = `logos/${companyId}/logo.${fileExtension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { companyId },
  });

  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

// Usage tracking
export async function incrementSubmissionUsage(companyId: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  const companyData = (await getDoc(companyRef)).data();
  const currentSubmissions = companyData?.usage?.submissionsThisMonth || 0;
  await updateDoc(companyRef, {
    'usage.submissionsThisMonth': currentSubmissions + 1,
    updatedAt: Timestamp.now(),
  });
}

export async function incrementBoardUsage(companyId: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  const companyData = (await getDoc(companyRef)).data();
  const currentBoards = companyData?.usage?.boardsCreated || 0;
  await updateDoc(companyRef, {
    'usage.boardsCreated': currentBoards + 1,
    updatedAt: Timestamp.now(),
  });
}

export async function incrementTeamMemberUsage(companyId: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  const companyData = (await getDoc(companyRef)).data();
  const currentMembers = companyData?.usage?.teamMembersAdded || 0;
  await updateDoc(companyRef, {
    'usage.teamMembersAdded': currentMembers + 1,
    updatedAt: Timestamp.now(),
  });
}

export async function resetMonthlyUsage(companyId: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, {
    'usage.submissionsThisMonth': 0,
    'usage.boardsCreated': 0,
    'usage.teamMembersAdded': 0,
    'usage.lastResetAt': Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

// Board template operations
export async function getTemplates(): Promise<BoardTemplate[]> {
  const q = query(collection(db, 'board_templates'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as BoardTemplate[];
}

export async function getTemplate(templateId: string): Promise<BoardTemplate | null> {
  const docRef = doc(db, 'board_templates', templateId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as BoardTemplate) : null;
}

export async function seedTemplates(): Promise<void> {
  const templates: BoardTemplate[] = [
    {
      id: 'template_customer_feedback',
      name: 'Customer Feedback',
      description: 'Collect feedback from customers about your products and services',
      industry: 'retail',
      icon: '🎯',
      categories: ['Bug Report', 'Feature Request', 'Complaint', 'Compliment'],
      color: '#2E86AB',
      featured: true,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Customer Feedback',
          description: 'Collect feedback from customers about your products and services',
          categories: ['Bug Report', 'Feature Request', 'Complaint', 'Compliment'],
        },
      },
    },
    {
      id: 'template_supplier_issues',
      name: 'Supplier Issues',
      description: 'Track quality, delivery, and pricing issues from suppliers',
      industry: 'manufacturing',
      icon: '🏭',
      categories: ['Quality Issue', 'Delivery Problem', 'Pricing'],
      color: '#A23B72',
      featured: true,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Supplier Issues',
          description: 'Track quality, delivery, and pricing issues from suppliers',
          categories: ['Quality Issue', 'Delivery Problem', 'Pricing'],
        },
      },
    },
    {
      id: 'template_distributor_feedback',
      name: 'Distributor Feedback',
      description: 'Manage complaints and concerns from your distributors',
      industry: 'distribution',
      icon: '📦',
      categories: ['Stock Issue', 'Price Concern', 'Support'],
      color: '#F18F01',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Distributor Feedback',
          description: 'Manage complaints and concerns from your distributors',
          categories: ['Stock Issue', 'Price Concern', 'Support'],
        },
      },
    },
    {
      id: 'template_restaurant_feedback',
      name: 'Restaurant Feedback',
      description: 'Collect feedback about food quality, service, and cleanliness',
      industry: 'food_beverage',
      icon: '🍽️',
      categories: ['Food Quality', 'Service', 'Cleanliness'],
      color: '#C73E1D',
      featured: true,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Restaurant Feedback',
          description: 'Collect feedback about food quality, service, and cleanliness',
          categories: ['Food Quality', 'Service', 'Cleanliness'],
        },
      },
    },
    {
      id: 'template_delivery_feedback',
      name: 'Delivery Feedback',
      description: 'Track late deliveries, damage, and driver behavior issues',
      industry: 'logistics',
      icon: '🚚',
      categories: ['Late Delivery', 'Damage', 'Driver Behavior'],
      color: '#6A994E',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Delivery Feedback',
          description: 'Track late deliveries, damage, and driver behavior issues',
          categories: ['Late Delivery', 'Damage', 'Driver Behavior'],
        },
      },
    },
    {
      id: 'template_tenant_requests',
      name: 'Tenant Requests',
      description: 'Manage maintenance requests and complaints from tenants',
      industry: 'real_estate',
      icon: '🏢',
      categories: ['Maintenance', 'Amenities', 'Complaint'],
      color: '#BC4749',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Tenant Requests',
          description: 'Manage maintenance requests and complaints from tenants',
          categories: ['Maintenance', 'Amenities', 'Complaint'],
        },
      },
    },
    {
      id: 'template_patient_feedback',
      name: 'Patient Feedback',
      description: 'Collect feedback about doctors, staff, facilities, and billing',
      industry: 'healthcare',
      icon: '🏥',
      categories: ['Doctor', 'Staff', 'Facilities', 'Billing'],
      color: '#EF476F',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Patient Feedback',
          description: 'Collect feedback about doctors, staff, facilities, and billing',
          categories: ['Doctor', 'Staff', 'Facilities', 'Billing'],
        },
      },
    },
    {
      id: 'template_employee_feedback',
      name: 'Employee Feedback',
      description: 'Gather feedback about careers, salary, culture, and benefits',
      industry: 'human_resources',
      icon: '👥',
      categories: ['Career', 'Salary', 'Culture', 'Benefits'],
      color: '#118AB2',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Employee Feedback',
          description: 'Gather feedback about careers, salary, culture, and benefits',
          categories: ['Career', 'Salary', 'Culture', 'Benefits'],
        },
      },
    },
    {
      id: 'template_support_tickets',
      name: 'Support Tickets',
      description: 'Manage technical support requests and feature requests',
      industry: 'technology',
      icon: '🔧',
      categories: ['Bug Report', 'Feature Request', 'How-To', 'Account'],
      color: '#073B4C',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Support Tickets',
          description: 'Manage technical support requests and feature requests',
          categories: ['Bug Report', 'Feature Request', 'How-To', 'Account'],
        },
      },
    },
    {
      id: 'template_event_feedback',
      name: 'Event Feedback',
      description: 'Collect feedback about venues, organization, content, and speakers',
      industry: 'events',
      icon: '🎤',
      categories: ['Venue', 'Organization', 'Content', 'Speakers'],
      color: '#FF006E',
      featured: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      translations: {
        en: {
          name: 'Event Feedback',
          description: 'Collect feedback about venues, organization, content, and speakers',
          categories: ['Venue', 'Organization', 'Content', 'Speakers'],
        },
      },
    },
  ];

  for (const template of templates) {
    const docRef = doc(db, 'board_templates', template.id);
    await setDoc(docRef, template);
  }
}

// Attachment operations
export async function uploadAttachment(
  submissionId: string,
  file: File
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Read file as base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Call the Cloud Function
    const response = await fetch(
      `/api/submissions/${submissionId}/attachments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          filetype: file.type,
          filesize: file.size,
          base64data: base64,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Upload failed',
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

export async function downloadAttachment(
  submissionId: string,
  attachmentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const response = await fetch(
      `/api/submissions/${submissionId}/attachments/${attachmentId}/download`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Download failed',
      };
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Download failed',
    };
  }
}

export async function deleteAttachment(
  submissionId: string,
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `/api/submissions/${submissionId}/attachments/${attachmentId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Delete failed',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Delete failed',
    };
  }
}

export async function getStorageUsage(companyId: string): Promise<any> {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const snapshot = await getDoc(companyRef);

    if (!snapshot.exists()) {
      return null;
    }

    const company = snapshot.data() as Company;
    return company.usage?.storage || { totalBytes: 0, usedBytes: 0 };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
}

// Comment operations
export async function addComment(
  submissionId: string,
  companyId: string,
  content: string,
  author: { id: string; name: string; email: string; avatar?: string },
  mentions: string[] = [],
  parentCommentId?: string
): Promise<string> {
  const commentsRef = collection(
    db,
    'submissions',
    submissionId,
    'comments'
  );
  const newComment = {
    submissionId,
    companyId,
    content,
    author,
    mentions,
    reactions: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    isEdited: false,
    ...(parentCommentId && { parentCommentId }),
  };
  const docRef = await addDoc(commentsRef, newComment);
  return docRef.id;
}

export async function getComments(
  submissionId: string
): Promise<any[]> {
  const commentsRef = collection(
    db,
    'submissions',
    submissionId,
    'comments'
  );
  const q = query(
    commentsRef,
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function updateComment(
  submissionId: string,
  commentId: string,
  content: string
): Promise<void> {
  const commentRef = doc(
    db,
    'submissions',
    submissionId,
    'comments',
    commentId
  );
  await updateDoc(commentRef, {
    content,
    updatedAt: Timestamp.now(),
    isEdited: true,
  });
}

export async function deleteComment(
  submissionId: string,
  commentId: string
): Promise<void> {
  const commentRef = doc(
    db,
    'submissions',
    submissionId,
    'comments',
    commentId
  );
  await updateDoc(commentRef, {
    content: '[deleted]',
    updatedAt: Timestamp.now(),
  });
}

export async function addReaction(
  submissionId: string,
  commentId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const commentRef = doc(
    db,
    'submissions',
    submissionId,
    'comments',
    commentId
  );
  const snapshot = await getDoc(commentRef);
  const comment = snapshot.data();
  const reactions = comment?.reactions || [];
  const existingReaction = reactions.find((r: any) => r.emoji === emoji);

  if (existingReaction) {
    if (!existingReaction.userIds.includes(userId)) {
      existingReaction.userIds.push(userId);
    }
  } else {
    reactions.push({ emoji, userIds: [userId] });
  }

  await updateDoc(commentRef, { reactions });
}

export async function removeReaction(
  submissionId: string,
  commentId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const commentRef = doc(
    db,
    'submissions',
    submissionId,
    'comments',
    commentId
  );
  const snapshot = await getDoc(commentRef);
  const comment = snapshot.data();
  const reactions = comment?.reactions || [];

  const reactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
  if (reactionIndex !== -1) {
    reactions[reactionIndex].userIds = reactions[reactionIndex].userIds.filter(
      (id: string) => id !== userId
    );
    if (reactions[reactionIndex].userIds.length === 0) {
      reactions.splice(reactionIndex, 1);
    }
  }

  await updateDoc(commentRef, { reactions });
}

export async function getCommentCount(submissionId: string): Promise<number> {
  const commentsRef = collection(
    db,
    'submissions',
    submissionId,
    'comments'
  );
  const snapshot = await getDocs(commentsRef);
  return snapshot.size;
}

export async function createCommentNotification(
  companyId: string,
  userId: string,
  mentionedBy: string,
  submissionId: string,
  commentId: string
): Promise<string> {
  const notificationsRef = collection(
    db,
    'companies',
    companyId,
    'notifications'
  );
  const newNotification = {
    companyId,
    userId,
    mentionedBy,
    submissionId,
    commentId,
    isRead: false,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(notificationsRef, newNotification);
  return docRef.id;
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  setDoc,
  arrayUnion,
  deleteField,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseErrorMessage, isQuotaError } from './firebase-errors';

function wrapFirestoreError(error: unknown): never {
  if (isQuotaError(error)) {
    throw new Error(
      'Service is temporarily unavailable due to high demand. Please try again in a moment.'
    );
  }
  throw new Error(getFirebaseErrorMessage(error));
}
import type {
  User,
  UserRole,
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
  role: UserRole = 'admin'
): Promise<User> {
  try {
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
  } catch (error) {
    wrapFirestoreError(error);
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', id);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data() as User) : null;
  } catch (error) {
    wrapFirestoreError(error);
  }
}

// Company operations
export async function createCompany(
  id: string,
  name: string,
  email: string
): Promise<Company> {
  try {
    const companyRef = doc(db, 'companies', id);
    const now = Timestamp.now();
    const trialEndsAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);
    const newCompany: Company = {
      id,
      name,
      email,
      billingEmail: email,
      subscription: {
        tier: 'free',
        billing: 'monthly',
        status: 'active',
        trialEndsAt,
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
  } catch (error) {
    wrapFirestoreError(error);
  }
}

export async function getCompany(id: string): Promise<Company | null> {
  try {
    const companyRef = doc(db, 'companies', id);
    const snapshot = await getDoc(companyRef);
    return snapshot.exists() ? (snapshot.data() as Company) : null;
  } catch (error) {
    wrapFirestoreError(error);
  }
}

// Board operations
export async function createBoard(
  companyId: string,
  input: BoardFormInput
): Promise<Board> {
  try {
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
  } catch (error) {
    wrapFirestoreError(error);
  }
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
  try {
    const boardRef = doc(db, 'boards', id);
    const snapshot = await getDoc(boardRef);
    return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Board : null;
  } catch (error) {
    wrapFirestoreError(error);
  }
}

export async function updateBoard(
  boardId: string,
  data: Partial<Pick<Board, 'name' | 'description' | 'categories' | 'isAnonymousAllowed'>>
): Promise<void> {
  try {
    const boardRef = doc(db, 'boards', boardId);
    await updateDoc(boardRef, { ...data, updatedAt: Timestamp.now() });
  } catch (error) {
    wrapFirestoreError(error);
  }
}

export async function deleteBoard(boardId: string): Promise<void> {
  try {
    const boardRef = doc(db, 'boards', boardId);
    await deleteDoc(boardRef);
  } catch (error) {
    wrapFirestoreError(error);
  }
}

// Submission operations
export async function createSubmission(
  boardId: string,
  companyId: string,
  input: SubmissionFormInput
): Promise<{ trackingCode: string; submissionId: string }> {
  try {
    const trackingCode = generateTrackingCode();
    const submissionsRef = collection(db, 'submissions');

    const identityFields = input.isAnonymous
      ? {}
      : {
          ...(input.email?.trim() ? { submitterEmail: input.email.trim() } : {}),
          ...(input.submitterName?.trim() ? { submitterName: input.submitterName.trim() } : {}),
          ...(input.submitterMobile?.trim() ? { submitterMobile: input.submitterMobile.trim() } : {}),
        };

    const newSubmission = {
      boardId,
      companyId,
      trackingCode,
      category: input.category,
      subject: input.subject,
      description: input.description,
      ...identityFields,
      isAnonymous: input.isAnonymous,
      status: 'received' as const,
      priority: 'medium' as const,
      internalNotes: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(submissionsRef, newSubmission);

    const boardRef = doc(db, 'boards', boardId);
    const boardData = await getDoc(boardRef);
    if (boardData.exists()) {
      const currentCount = (boardData.data() as Board).submissionCount || 0;
      await updateDoc(boardRef, { submissionCount: currentCount + 1 });
    }

    return { trackingCode, submissionId: docRef.id };
  } catch (error) {
    wrapFirestoreError(error);
  }
}

export async function getSubmissionByTrackingCode(
  code: string
): Promise<Submission | null> {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('trackingCode', '==', code), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { ...doc.data(), id: doc.id } as Submission;
  } catch (error) {
    wrapFirestoreError(error);
  }
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

export interface SubmissionsPage {
  submissions: Submission[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export async function getCompanySubmissionsPage(
  companyId: string,
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot
): Promise<SubmissionsPage> {
  const submissionsRef = collection(db, 'submissions');
  const fetchSize = pageSize + 1;
  const constraints: Parameters<typeof query>[1][] = [
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc'),
    limit(fetchSize),
  ];
  if (startAfterDoc) {
    constraints.splice(2, 0, startAfter(startAfterDoc));
  }
  const q = query(submissionsRef, ...constraints);
  const snapshot = await getDocs(q);
  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
  return {
    submissions: docs.map((d) => ({ ...d.data(), id: d.id } as Submission)),
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
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
  role: UserRole,
  invitedBy: string
): Promise<TeamInvitation> {
  const inviteCode = generateTrackingCode();
  const invitationsRef = collection(db, 'teamInvitations');

  const newInvitation: Omit<TeamInvitation, 'id'> & {
    emailDelivery?: {
      from: string;
      smtpHost: string;
      smtpPort: number;
    };
  } = {
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
    emailDelivery: {
      from: 'hello@feedsolve.com',
      smtpHost: 'mail.spacemail.com',
      smtpPort: 465,
    },
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
  newRole: UserRole
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
  await updateDoc(submissionRef, {
    assignedTo: assignedTo ?? deleteField(),
    updatedAt: Timestamp.now(),
  });
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
    assignedTo: deleteField(),
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
        si: {
          name: 'ගනුදෙනුකරු ප්‍රතිපෝෂණ',
          description: 'ඔබේ නිෂ්පාදන සහ සේවා සম්බන්ධයෙන් ගනුදෙනුකරුවරුන්ගෙන් ප්‍රතිපෝෂණ එකතු කරන්න',
          categories: ['දෝෂ වාර්තා', 'ලක්ෂණ ඉල්ලීම', 'অভিযෝग', 'প্রশংসা'],
        },
        ta: {
          name: 'கிராहக பதிப்புரை',
          description: 'உங்கள் பொருட்கள் மற்றும் சேவைகள் பற்றிய கிராহக பதிப்புரை சேகரிக்கவும்',
          categories: ['பிழை அறிக்கை', 'அம்சம் கோரிக்கை', 'புகார்', 'புகழ்ச்சி'],
        },
        ar: {
          name: 'ملاحظات العملاء',
          description: 'اجمع ملاحظات العملاء حول منتجاتك وخدماتك',
          categories: ['تقرير خلل', 'طلب ميزة', 'شكوى', 'مديح'],
        },
        hi: {
          name: 'ग्राहक प्रतिक्रिया',
          description: 'अपने उत्पादों और सेवाओं के बारे में ग्राहक प्रतिक्रिया एकत्र करें',
          categories: ['बग रिपोर्ट', 'सुविधा अनुरोध', 'शिकायत', 'तारीफ'],
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
        si: {
          name: 'සরবරාහකරු ගැටළු',
          description: 'සරබරාහකරුවරුන්ගේ ගුණාත්මක, ඉවත් කිරීම් සහ මිල තීරණ ගැටළු ලුහුබඳු කරන්න',
          categories: ['ගුණාත්මක කරුණු', 'ඉවත් කිරීමේ সমস්যা', 'මිල තීරණ'],
        },
        ta: {
          name: 'சப்ளையர் சிக்கல்கள்',
          description: 'சப்ளையர்களிடமிருந்து தரம், விநியோகம் மற்றும் விலை சிக்கல்களைக் கண்காணிக்கவும்',
          categories: ['தரம் சிக்கல்', 'விநியோக சிக்கல்', 'விலை'],
        },
        ar: {
          name: 'مشاكل الموردين',
          description: 'تتبع مشاكل الجودة والتسليم والأسعار من الموردين',
          categories: ['مشكلة الجودة', 'مشكلة التسليم', 'التسعير'],
        },
        hi: {
          name: 'आपूर्तिकर्ता समस्याएं',
          description: 'आपूर्तिकर्ताओं से गुणवत्ता, वितरण और मूल्य निर्धारण समस्याओं को ट्रैक करें',
          categories: ['गुणवत्ता समस्या', 'वितरण समस्या', 'मूल्य निर्धारण'],
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
        si: {
          name: 'බෙදා හැරුවා ප්‍රතිපෝෂණ',
          description: 'ඔබේ බෙදා හරින්නන්ගෙන් පැමිණි ගැටළු සහ උහුදු පිළිසඳුවා ගන්න',
          categories: ['මුද්‍රණ කරුණු', 'මිල සම්බන්ධ සඳහා', 'සහය'],
        },
        ta: {
          name: 'விநியோگাளனர் பதிப்புரை',
          description: 'உங்கள் விநியோகஸ்தர்களிடமிருந்து புகார்கள் மற்றும் கவலைகளைக் நிர்வகிக்கவும்',
          categories: ['பங்கு சிக்கல்', 'விலை கவலை', 'ஆதரவு'],
        },
        ar: {
          name: 'ملاحظات الموزعين',
          description: 'إدارة الشكاوى والمخاوف من موزعيك',
          categories: ['مشكلة المخزون', 'قلق السعر', 'الدعم'],
        },
        hi: {
          name: 'वितरक प्रतिक्रिया',
          description: 'अपने वितरकों से शिकायतों और चिंताओं का प्रबंधन करें',
          categories: ['स्टॉक समस्या', 'मूल्य चिंता', 'सहायता'],
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
        si: {
          name: 'අවන්හල ප්‍රතිපෝෂණ',
          description: 'ආහාරයේ ගුණාත්මක, සේවා සහ පිරිසිදුකම පිළිබඳ ප්‍රතිපෝෂණ එකතු කරන්න',
          categories: ['ආහාර ගුණාත්මක', 'සේවා', 'පිරිසිදුකම'],
        },
        ta: {
          name: 'உணவகப் பதிப்புரை',
          description: 'உணவின் தரம், சேவை மற்றும் சுத்தத்தன்மை பற்றிய பதிப்புரை சேகரிக்கவும்',
          categories: ['உணவு தரம்', 'சேவை', 'சுத்தத்தன்மை'],
        },
        ar: {
          name: 'ملاحظات المطعم',
          description: 'اجمع الملاحظات حول جودة الطعام والخدمة والنظافة',
          categories: ['جودة الطعام', 'الخدمة', 'النظافة'],
        },
        hi: {
          name: 'रेस्तरां प्रतिक्रिया',
          description: 'खाद्य गुणवत्ता, सेवा और सफाई के बारे में प्रतिक्रिया एकत्र करें',
          categories: ['खाद्य गुणवत्ता', 'सेवा', 'सफाई'],
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
        si: {
          name: 'ඉවත් කිරීම් ප්‍රතිපෝෂණ',
          description: 'ප්‍රමාද ඉවත් කිරීම්, හානි සහ රියදුරු ගැටළු ලුහුබඳු කරන්න',
          categories: ['ප්‍රමාද ඉවත් කිරීම', 'හානි', 'රියදුරු ගැටළු'],
        },
        ta: {
          name: 'விநியோग பதிப்புரை',
          description: 'தாமதமான விநியோகம், சேதம் மற்றும் ড்রைவர் நடத்தை சிக்கல்களைக் கண்காணிக்கவும்',
          categories: ['தாமதமான விநியோগம்', 'சேதம்', 'ড்রைவர் நடத்தை'],
        },
        ar: {
          name: 'ملاحظات التسليم',
          description: 'تتبع التسليمات المتأخرة والضرر ومشاكل سلوك السائق',
          categories: ['التسليم المتأخر', 'الضرر', 'سلوك السائق'],
        },
        hi: {
          name: 'वितरण प्रतिक्रिया',
          description: 'देर से डिलीवरी, नुकसान और ड्राइवर व्यवहार समस्याओं को ट्रैक करें',
          categories: ['देरी से डिलीवरी', 'नुकसान', 'ड्राइवर व्यवहार'],
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
        si: {
          name: 'කුලී බදු ඉල්ලීම්',
          description: 'කුලී බදු සම්පූර්ණ සිට රැකවරණ ඉල්ලීම් සහ ගැටළු පිළිසඳුවා ගන්න',
          categories: ['රැකවරණ', 'සুවිධාන', 'ගැටළු'],
        },
        ta: {
          name: 'குத்தகையாளர் கோரிக்கைகள்',
          description: 'குத்தகையாளர்களிடமிருந்து பராமரிப்பு கோரிக்கைகள் மற்றும் புகார்களைக் நிர்வகிக்கவும்',
          categories: ['பராமரிப்பு', 'வசதிகள்', 'புகார்'],
        },
        ar: {
          name: 'طلبات المستأجرين',
          description: 'إدارة طلبات الصيانة والشكاوى من المستأجرين',
          categories: ['الصيانة', 'المرافق', 'الشكوى'],
        },
        hi: {
          name: 'किरायेदार अनुरोध',
          description: 'किरायेदारों से रखरखाव अनुरोध और शिकायतों का प्रबंधन करें',
          categories: ['रखरखाव', 'सुविधाएं', 'शिकायत'],
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
        si: {
          name: 'රෝගී ප්‍රතිපෝෂණ',
          description: 'වෛද්‍යවරුන්, කර්මිකයින්, පහසුකම් සහ බිල්පත් පිළිබඳ ප්‍රතිපෝෂණ එකතු කරන්න',
          categories: ['වෛද්‍යවරු', 'කර්මිකයින්', 'පහසුකම්', 'බිල්පත්'],
        },
        ta: {
          name: 'நோயாளி பதிப்புரை',
          description: 'வைத்தியர்கள், பணியாளர்கள், வசதிகள் மற்றும் பில்லிங் பற்றிய பதிப்புரை சேகரிக்கவும்',
          categories: ['வைத்தியர்', 'பணியாளர்கள்', 'வசதிகள்', 'பில்லிங்'],
        },
        ar: {
          name: 'ملاحظات المرضى',
          description: 'اجمع ملاحظات الأطباء والموظفين والمرافق والفواتير',
          categories: ['الطبيب', 'الموظفون', 'المرافق', 'الفواتير'],
        },
        hi: {
          name: 'रोगी प्रतिक्रिया',
          description: 'डॉक्टरों, कर्मचारियों, सुविधाओं और बिलिंग के बारे में प्रतिक्रिया एकत्र करें',
          categories: ['डॉक्टर', 'कर्मचारी', 'सुविधाएं', 'बिलिंग'],
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
        si: {
          name: 'සේවක ප්‍රතිපෝෂණ',
          description: 'සිකුරු, වැටුප්, සංස්කෘතිය සහ ප්‍රතිලාභ පිළිබඳ ප්‍රතිපෝෂණ එකතු කරන්න',
          categories: ['ආර්ජ', 'වැටුප්', 'සංස්කෘතිය', 'ප්‍රතිලාභ'],
        },
        ta: {
          name: 'কর্মচারী প্रতिक्रिया',
          description: 'தொழिल், சம்பளம், संस்कृति மற्றும் लाभों के बारे में प्रतिক्रिया एकत्र करें',
          categories: ['கார்', 'சம்பளம்', 'संस्कृति', 'लाभ'],
        },
        ar: {
          name: 'ملاحظات الموظفين',
          description: 'اجمع ملاحظات حول الوظائف والرواتب والثقافة والمزايا',
          categories: ['المسار الوظيفي', 'الراتب', 'الثقافة', 'المزايا'],
        },
        hi: {
          name: 'कर्मचारी प्रतिक्रिया',
          description: 'करियर, वेतन, संस्कृति और लाभों के बारे में प्रतिक्रिया एकत्र करें',
          categories: ['करियर', 'वेतन', 'संस्कृति', 'लाभ'],
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
        si: {
          name: 'සහාය ටිකට්පත්',
          description: 'තාක්ෂණික සහාය ඉල්ලීම් සහ ලක්ෂණ ඉල්ලීම් පිළිසඳුවා ගන්න',
          categories: ['දෝෂ වාර්තා', 'ලක්ෂණ ඉල්ලීම', 'ගිණුම්', 'ගිණුම්'],
        },
        ta: {
          name: 'ஆதரவு டிக்கெட்கள்',
          description: 'தொழில்நுட்ப ஆதரவு கோரிக்கைகள் மற்றும் அம்சம் கோரிக்கைகளைக் நிர்வகிக்கவும்',
          categories: ['பிழை அறிக்கை', 'அம்சம் கோரிக்கை', 'எப்படி', 'கணக்கு'],
        },
        ar: {
          name: 'تذاكر الدعم',
          description: 'إدارة طلبات الدعم الفني وطلبات الميزات',
          categories: ['تقرير خلل', 'طلب ميزة', 'الكيفية', 'الحساب'],
        },
        hi: {
          name: 'सहायता टिकट',
          description: 'तकनीकी सहायता अनुरोध और सुविधा अनुरोधों का प्रबंधन करें',
          categories: ['बग रिपोर्ट', 'सुविधा अनुरोध', 'कैसे करें', 'खाता'],
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
        si: {
          name: 'අවස්ථා ප්‍රතිපෝෂණ',
          description: 'ස්වාස්තිකයන්, සංවිධාතෑ, අන්තර්ගතය සහ කතිකාවරුන් පිළිබඳ ප්‍රතිපෝෂණ එකතු කරන්න',
          categories: ['ස්වාස්තිකය', 'සංවිධාතා', 'අන්තර්ගතය', 'කතිකාවරුන්'],
        },
        ta: {
          name: 'ஆयોজன பதிப்புரை',
          description: 'இடங்கள், அமைப்பு, உள்ளடக்கம் மற்றும் சொற்பொழிப்பாளர்கள் பற்றிய பதிப்புரை சேகரிக்கவும்',
          categories: ['இடம்', 'அமைப்பு', 'உள்ளடக்கம்', 'சொற்பொழிப்பாளர்கள்'],
        },
        ar: {
          name: 'ملاحظات الحدث',
          description: 'اجمع ملاحظات حول الأماكن والتنظيم والمحتوى والمتحدثين',
          categories: ['المكان', 'التنظيم', 'المحتوى', 'المتحدثون'],
        },
        hi: {
          name: 'कार्यक्रम प्रतिक्रिया',
          description: 'स्थान, संगठन, सामग्री और वक्ताओं के बारे में प्रतिक्रिया एकत्र करें',
          categories: ['स्थान', 'संगठन', 'सामग्री', 'वक्ता'],
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
    // Browser-compatible base64 encoding (no Node.js Buffer)
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    // Use the public endpoint (no API key required for public form submissions)
    const response = await fetch(
      `/public/submissions/${submissionId}/attachments`,
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
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  try {
    const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
    if (!submissionDoc.exists()) {
      return { success: false, error: 'Submission not found' };
    }
    const submissionData = submissionDoc.data() as Submission;
    const attachment = submissionData.attachments?.find((a: any) => a.id === attachmentId);
    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }
    const fileRef = ref(storage, attachment.storagePath);
    const url = await getDownloadURL(fileRef);
    return { success: true, url, filename: attachment.filename };
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

// Audit log operations
export async function addAuditLog(
  companyId: string,
  entry: {
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    resourceType: 'submission' | 'board' | 'team' | 'webhook' | 'billing';
    resourceId?: string;
    resourceName?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  const logsRef = collection(db, 'companies', companyId, 'audit_logs');
  await addDoc(logsRef, {
    companyId,
    ...entry,
    details: entry.details ?? {},
    createdAt: Timestamp.now(),
  });
}

export async function getAuditLogs(companyId: string, limitCount = 200): Promise<any[]> {
  const logsRef = collection(db, 'companies', companyId, 'audit_logs');
  const q = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

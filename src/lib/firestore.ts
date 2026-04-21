import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import type {
  User,
  Company,
  Board,
  Submission,
  BoardFormInput,
  SubmissionFormInput,
  TeamInvitation,
  TeamMember,
  InternalNote,
} from '../types';
import { db } from './firebase';
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
  const newCompany: Company = {
    id,
    name,
    email,
    subscription: 'free',
    monthlySubmissionLimit: 100,
    boardCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
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
  return snapshot.empty ? null : (snapshot.docs[0].data() as Board);
}

export async function getCompanyBoards(companyId: string): Promise<Board[]> {
  const boardsRef = collection(db, 'boards');
  const q = query(boardsRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Board);
}

export async function getBoard(id: string): Promise<Board | null> {
  const boardRef = doc(db, 'boards', id);
  const snapshot = await getDoc(boardRef);
  return snapshot.exists() ? (snapshot.data() as Board) : null;
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

export async function getCompanySubmissions(companyId: string): Promise<Submission[]> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Submission));
}

export async function getBoardSubmissions(boardId: string): Promise<Submission[]> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('boardId', '==', boardId));
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
  return snapshot.exists() ? (snapshot.data() as Submission) : null;
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
        userId: user.id,
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
  return snapshot.docs.map((doc) => doc.data() as User);
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

  const newNote = {
    id: Date.now().toString(),
  const newNote: InternalNote = {
    id: uuidv4(),
    text,
    createdBy,
    createdAt: Timestamp.now(),
  };

  await updateDoc(submissionRef, {
    internalNotes: [...submission.internalNotes, newNote],
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
export async function updateSubmissionPriority(
  submissionId: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    priority,
    updatedAt: Timestamp.now(),
  });
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

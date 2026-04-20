import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  createdAt: Timestamp;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscription: 'free' | 'starter' | 'growth' | 'business';
  subscriptionEndsAt?: Timestamp;
  monthlySubmissionLimit: number;
  boardCount: number;
}

export interface Board {
  id: string;
  companyId: string;
  name: string;
  description: string;
  slug: string;
  categories: string[];
  isAnonymousAllowed: boolean;
  qrCodeUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submissionCount: number;
}

export interface InternalNote {
  id: string;
  text: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Submission {
  id: string;
  boardId: string;
  companyId: string;
  trackingCode: string;
  category: string;
  subject: string;
  description: string;
  submitterEmail?: string;
  isAnonymous: boolean;
  status: 'received' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  internalNotes: InternalNote[];
  publicReply?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface SubmissionFormInput {
  category: string;
  subject: string;
  description: string;
  email?: string;
  isAnonymous: boolean;
}

export interface BoardFormInput {
  name: string;
  description: string;
  categories: string[];
  isAnonymousAllowed: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

import type { Timestamp } from "firebase/firestore";

export interface InternalComment {
  id: string;
  body: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: Timestamp;
  editedAt: Timestamp | null;
  isEdited: boolean;
  isDeleted: boolean;
  parentId: string | null;
}

export interface InternalCommentInput {
  body: string;
  parentId?: string | null;
}

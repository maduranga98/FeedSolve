import { Timestamp } from "firebase/firestore";
import type { InternalNote, Submission, User } from "../types";
import type { InternalComment } from "../types/comment";
import { createMigratedInternalComments } from "../hooks/useInternalComments";

function noteToComment(note: InternalNote, fallbackUser: User): InternalComment {
  const authorName = note.createdBy || fallbackUser.name || "Team member";
  return {
    id: note.id,
    body: note.text,
    authorId: note.createdBy === fallbackUser.id ? fallbackUser.id : `legacy-${note.id}`,
    authorName,
    authorAvatar: null,
    createdAt: note.createdAt,
    editedAt: null,
    isEdited: false,
    isDeleted: false,
    parentId: null,
  };
}

export async function migrateInternalNotesOnFirstLoad(
  submission: Submission,
  currentUser: User,
  existingCommentCount: number
): Promise<InternalComment[]> {
  const legacyNotes = submission.internalNotes ?? [];
  if (legacyNotes.length === 0 || existingCommentCount > 0) return [];

  const migratedComments = legacyNotes.map(note => noteToComment(note, currentUser));
  await createMigratedInternalComments(submission.id, migratedComments);
  return migratedComments.map(comment => ({
    ...comment,
    createdAt: comment.createdAt ?? Timestamp.now(),
  }));
}

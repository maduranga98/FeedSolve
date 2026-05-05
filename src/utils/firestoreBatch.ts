import { writeBatch } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface BatchUpdate {
  ref: DocumentReference;
  data: Record<string, unknown>;
}

export async function batchedFirestoreUpdate(updates: BatchUpdate[]): Promise<void> {
  if (updates.length === 0) return;
  const chunks = chunkArray(updates, 499);
  await Promise.all(
    chunks.map(async (chunk) => {
      const batch = writeBatch(db);
      for (const { ref, data } of chunk) {
        batch.update(ref, data);
      }
      await batch.commit();
    })
  );
}

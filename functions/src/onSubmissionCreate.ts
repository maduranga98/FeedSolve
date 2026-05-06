import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface SubmissionData {
  boardId?: string;
  cycleId?: string | null;
}

export const onSubmissionCreate = functions.firestore
  .document("submissions/{submissionId}")
  .onCreate(async (snapshot) => {
    const submission = snapshot.data() as SubmissionData;
    if (!submission.boardId || submission.cycleId) return;

    const boardDoc = await admin.firestore().collection("boards").doc(submission.boardId).get();
    const currentCycleId = boardDoc.get("currentCycleId") as string | undefined | null;
    if (!currentCycleId) return;

    await snapshot.ref.update({ cycleId: currentCycleId });
  });

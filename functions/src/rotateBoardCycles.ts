import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {renderBoardCycleEmail} from "./email-templates";

interface BoardData {
  companyId: string;
  name: string;
  recurringFrequency?: "monthly" | "quarterly" | "custom" | null;
  recurringCustomDays?: number | null;
  currentCycleId?: string | null;
}

interface CycleData {
  cycleNumber?: number;
}

interface SubmissionData {
  status?: string;
  createdAt?: FirebaseFirestore.Timestamp;
  resolvedAt?: FirebaseFirestore.Timestamp;
}

const emptyStats = {
  totalSubmissions: 0,
  resolvedSubmissions: 0,
  resolutionRate: 0,
  avgResolutionHours: 0,
};

const transporter = nodemailer.createTransport({
  host: "mail.spacemail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hello@feedsolve.com",
    pass: "2_qY5u9z",
  },
});

function addFrequencyDays(
  date: Date,
  frequency: BoardData["recurringFrequency"],
  customDays?: number | null,
) {
  const next = new Date(date);
  if (frequency === "quarterly") {
    next.setMonth(next.getMonth() + 3);
  } else if (frequency === "custom") {
    next.setDate(next.getDate() + Math.max(1, customDays ?? 30));
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  next.setHours(0, 0, 0, 0);
  return next;
}

function getCycleLabel(date: Date, frequency: BoardData["recurringFrequency"]) {
  if (frequency === "quarterly") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

async function calculateCycleStats(
  db: FirebaseFirestore.Firestore,
  boardId: string,
  cycleId: string,
) {
  const snapshot = await db
    .collection("submissions")
    .where("boardId", "==", boardId)
    .where("cycleId", "==", cycleId)
    .get();

  const submissions = snapshot.docs.map((doc) => doc.data() as SubmissionData);
  const resolved = submissions.filter(
    (submission) => submission.status === "resolved" || submission.status === "closed",
  );
  const resolutionHours = resolved
    .filter((submission) => submission.createdAt && submission.resolvedAt)
    .map((submission) => {
      const created = submission.createdAt!.toDate().getTime();
      const resolvedAt = submission.resolvedAt!.toDate().getTime();
      return Math.max(0, (resolvedAt - created) / (1000 * 60 * 60));
    });

  return {
    totalSubmissions: submissions.length,
    resolvedSubmissions: resolved.length,
    resolutionRate: submissions.length > 0 ? (resolved.length / submissions.length) * 100 : 0,
    avgResolutionHours:
      resolutionHours.length > 0
        ? resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length
        : 0,
  };
}

async function notifyBoardOwner(
  db: FirebaseFirestore.Firestore,
  board: BoardData,
) {
  const companyDoc = await db.collection("companies").doc(board.companyId).get();
  const companyEmail = companyDoc.get("billingEmail") || companyDoc.get("email");
  if (!companyEmail) return;

  try {
    const configuredUrl = process.env.APP_URL || "";
    const appUrl = /localhost/i.test(configuredUrl)
      ? "https://app.feedsolve.com"
      : configuredUrl || "https://app.feedsolve.com";
    const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;
    const email = renderBoardCycleEmail({boardName: board.name, dashboardUrl});
    await transporter.sendMail({
      from: '"FeedSolve" <hello@feedsolve.com>',
      to: companyEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    functions.logger.warn("Failed to send board cycle notification", {
      boardName: board.name,
      companyId: board.companyId,
      error,
    });
  }
}

export const rotateBoardCycles = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const db = admin.firestore();
    const nowDate = new Date();
    const now = admin.firestore.Timestamp.fromDate(nowDate);

    const boardsSnapshot = await db
      .collection("boards")
      .where("recurringEnabled", "==", true)
      .where("nextCycleDate", "<=", now)
      .get();

    for (const boardDoc of boardsSnapshot.docs) {
      const board = boardDoc.data() as BoardData;
      const currentCycleId = board.currentCycleId;
      let nextCycleNumber = 1;

      if (currentCycleId) {
        const currentCycleRef = db.collection("boardCycles").doc(currentCycleId);
        const currentCycleDoc = await currentCycleRef.get();
        const currentCycle = currentCycleDoc.data() as CycleData | undefined;
        nextCycleNumber = (currentCycle?.cycleNumber ?? 0) + 1;
        await currentCycleRef.update({
          isCurrent: false,
          endDate: now,
          stats: await calculateCycleStats(db, boardDoc.id, currentCycleId),
        });
      }

      const newCycleRef = db.collection("boardCycles").doc();
      const nextCycleDate = addFrequencyDays(
        nowDate,
        board.recurringFrequency,
        board.recurringCustomDays,
      );

      await newCycleRef.set({
        id: newCycleRef.id,
        boardId: boardDoc.id,
        companyId: board.companyId,
        cycleNumber: nextCycleNumber,
        label: getCycleLabel(nowDate, board.recurringFrequency),
        startDate: now,
        endDate: null,
        isCurrent: true,
        stats: emptyStats,
      });

      await boardDoc.ref.update({
        currentCycleId: newCycleRef.id,
        nextCycleDate: admin.firestore.Timestamp.fromDate(nextCycleDate),
        updatedAt: now,
      });

      await notifyBoardOwner(db, board);
    }
  });

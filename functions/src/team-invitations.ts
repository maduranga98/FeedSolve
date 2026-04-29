import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

interface TeamInvitation {
  companyId: string;
  email: string;
  role: string;
  invitedBy: string;
  inviteCode: string;
  status: "pending" | "accepted" | "expired";
}

const transporter = nodemailer.createTransport({
  host: "mail.spacemail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hello@feedsolve.com",
    pass: "2_qY5u9z",
  },
});

export const onTeamInvitationCreated = functions.firestore
  .document("teamInvitations/{invitationId}")
  .onCreate(async (snap) => {
    const invitation = snap.data() as TeamInvitation;

    if (!invitation || invitation.status !== "pending") {
      return;
    }

    const inviterDoc = await admin
      .firestore()
      .collection("users")
      .doc(invitation.invitedBy)
      .get();

    const inviterName = inviterDoc.exists
      ? (inviterDoc.data()?.name as string | undefined) || "Your teammate"
      : "Your teammate";

    const configuredUrl = process.env.APP_URL || "";
    const appUrl = /localhost/i.test(configuredUrl)
      ? "https://app.feedsolve.com"
      : configuredUrl || "https://app.feedsolve.com";
    const inviteLink = `${appUrl.replace(/\/$/, "")}/accept-invite?id=${snap.id}`;

    try {
      await transporter.sendMail({
        from: '"FeedSolve" <hello@feedsolve.com>',
        to: invitation.email,
        subject: "You are invited to join a team on FeedSolve",
        text: `${inviterName} invited you to join FeedSolve as ${invitation.role}.\n\nAccept invitation: ${inviteLink}\n\nIf you weren’t expecting this invitation, you can ignore this email.`,
        html: `<p>${inviterName} invited you to join FeedSolve as <strong>${invitation.role}</strong>.</p><p><a href="${inviteLink}">Accept invitation</a></p> <p style="color: #555; font-size: 14px;">This invitation is linked to your email. If you weren’t expecting it, you can safely ignore this message.</p><p style="margin-top: 32px;">—<br/>FeedSolve Team<br/><span style="color: #777; font-size: 13px;">Collect feedback. Resolve it fast.</span></p>`,
      });

      await snap.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailStatus: "sent",
      });
    } catch (error) {
      functions.logger.error("Failed to send invitation email", {
        error,
        invitationId: snap.id,
      });
      await snap.ref.update({
        emailStatus: "failed",
        emailError: error instanceof Error ? error.message : String(error),
      });
    }
  });

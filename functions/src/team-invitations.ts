import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {renderInvitationEmail} from "./email-templates";

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
      const email = renderInvitationEmail({
        inviterName,
        role: invitation.role,
        inviteUrl: inviteLink,
      });
      await transporter.sendMail({
        from: '"FeedSolve" <hello@feedsolve.com>',
        to: invitation.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
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

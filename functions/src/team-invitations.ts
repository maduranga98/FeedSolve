import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {renderInvitationEmail} from "./email-templates";
import {appUrl, sendMail} from "./mailer";

interface TeamInvitation {
  companyId: string;
  email: string;
  role: string;
  invitedBy: string;
  inviteCode: string;
  status: "pending" | "accepted" | "expired";
}

export const onTeamInvitationCreated = functions
  .runWith({ secrets: ["SMTP_PASS"] })
  .firestore.document("teamInvitations/{invitationId}")
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

    const inviteLink = `${appUrl()}/accept-invite?id=${snap.id}`;

    try {
      const email = renderInvitationEmail({
        inviterName,
        role: invitation.role,
        inviteUrl: inviteLink,
      });
      await sendMail({
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

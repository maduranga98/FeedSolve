import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

interface TeamInvitation {
  companyId: string;
  email: string;
  role: string;
  invitedBy: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'expired';
}

const transporter = nodemailer.createTransport({
  host: 'mail.spacemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'hello@feedsolve.com',
    pass: '2_qY5u9z',
  },
});

export const onTeamInvitationCreated = functions.firestore
  .document('teamInvitations/{invitationId}')
  .onCreate(async (snap) => {
    const invitation = snap.data() as TeamInvitation;

    if (!invitation || invitation.status !== 'pending') {
      return;
    }

    const inviterDoc = await admin
      .firestore()
      .collection('users')
      .doc(invitation.invitedBy)
      .get();

    const inviterName = inviterDoc.exists
      ? (inviterDoc.data()?.name as string | undefined) || 'Your teammate'
      : 'Your teammate';

    const appUrl = process.env.APP_URL || 'https://app.feedsolve.com';
    const inviteLink = `${appUrl.replace(/\/$/, '')}/accept-invite?code=${invitation.inviteCode}`;

    try {
      await transporter.sendMail({
        from: '"FeedSolve" <hello@feedsolve.com>',
        to: invitation.email,
        subject: 'You are invited to FeedSolve',
        text: `${inviterName} invited you to join FeedSolve as ${invitation.role}.\n\nAccept invitation: ${inviteLink}`,
        html: `<p>${inviterName} invited you to join FeedSolve as <strong>${invitation.role}</strong>.</p><p><a href="${inviteLink}">Accept invitation</a></p>`,
      });

      await snap.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailStatus: 'sent',
      });
    } catch (error) {
      functions.logger.error('Failed to send invitation email', { error, invitationId: snap.id });
      await snap.ref.update({
        emailStatus: 'failed',
        emailError: error instanceof Error ? error.message : String(error),
      });
    }
  });

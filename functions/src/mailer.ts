/**
 * Single shared SMTP transport for every FeedSolve transactional email.
 *
 * Credentials come from the runtime environment only (`SMTP_PASS`) — never from
 * source. Configure them before deploy with either:
 *   firebase functions:secrets:set SMTP_PASS
 *   (or a .env / functions config entry for the emulator)
 */
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "mail.spacemail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "hello@feedsolve.com";
const SMTP_PASS = process.env.SMTP_PASS || "";

/** Address every FeedSolve notification is sent from. */
export const MAIL_FROM = process.env.MAIL_FROM || `"FeedSolve" <${SMTP_USER}>`;
/** Address recipients can reply to / contact. */
export const SUPPORT_EMAIL = SMTP_USER;

let transporter: nodemailer.Transporter | null = null;

/** True when SMTP credentials are present in the environment. */
export function isMailConfigured(): boolean {
  return SMTP_PASS.length > 0;
}

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
    });
  }
  return transporter;
}

export interface MailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Recipients are hidden from each other when true (default for multi-recipient mail). */
  bcc?: boolean;
}

/** Normalise, de-duplicate and validate a recipient list. */
export function normaliseRecipients(recipients: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  for (const raw of recipients) {
    // Accept both arrays and legacy "a@x.com, b@y.com" strings.
    for (const part of (raw || "").split(/[,;]/)) {
      const value = part.trim().toLowerCase();
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) continue;
      seen.add(value);
    }
  }
  return [...seen];
}

/**
 * Send one email. Throws on delivery failure so callers can log/retry;
 * resolves to `false` when mail is not configured (nothing was sent).
 */
export async function sendMail(payload: MailPayload): Promise<boolean> {
  const recipients = normaliseRecipients(
    Array.isArray(payload.to) ? payload.to : [payload.to],
  );
  if (!recipients.length) return false;

  if (!isMailConfigured()) {
    functions.logger.error(
      "SMTP_PASS is not configured — skipping email", { subject: payload.subject },
    );
    return false;
  }

  const hideRecipients = payload.bcc ?? recipients.length > 1;

  await getTransporter().sendMail({
    from: MAIL_FROM,
    to: hideRecipients ? MAIL_FROM : recipients[0],
    bcc: hideRecipients ? recipients : undefined,
    replyTo: payload.replyTo,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  return true;
}

/** Public app URL, ignoring localhost values left over from local development. */
export function appUrl(): string {
  const configured = process.env.APP_URL || "";
  const url = /localhost/i.test(configured) ? "" : configured;
  return (url || "https://app.feedsolve.com").replace(/\/$/, "");
}

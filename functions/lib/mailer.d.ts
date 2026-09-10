/** Address every FeedSolve notification is sent from. */
export declare const MAIL_FROM: string;
/** Address recipients can reply to / contact. */
export declare const SUPPORT_EMAIL: string;
/** True when SMTP credentials are present in the environment. */
export declare function isMailConfigured(): boolean;
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
export declare function normaliseRecipients(recipients: Array<string | undefined | null>): string[];
/**
 * Send one email. Throws on delivery failure so callers can log/retry;
 * resolves to `false` when mail is not configured (nothing was sent).
 */
export declare function sendMail(payload: MailPayload): Promise<boolean>;
/** Public app URL, ignoring localhost values left over from local development. */
export declare function appUrl(): string;
//# sourceMappingURL=mailer.d.ts.map
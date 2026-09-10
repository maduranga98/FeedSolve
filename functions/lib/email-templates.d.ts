/**
 * Branded HTML email templates for FeedSolve transactional emails.
 *
 * All templates share a single shell so the look stays consistent across
 * invitations, board notifications, and any future transactional email.
 */
interface EmailLayoutOptions {
    preheader?: string;
    title: string;
    intro: string;
    ctaLabel?: string;
    ctaUrl?: string;
    fallbackLinkLabel?: string;
    body?: string;
    footerNote?: string;
}
/** Render the shared FeedSolve email shell. */
export declare function renderBrandedEmail(opts: EmailLayoutOptions): string;
/** Team invitation email. */
export declare function renderInvitationEmail(args: {
    inviterName: string;
    role: string;
    inviteUrl: string;
}): {
    subject: string;
    html: string;
    text: string;
};
/** Board cycle rotation notification. */
export declare function renderBoardCycleEmail(args: {
    boardName: string;
    dashboardUrl?: string;
}): {
    subject: string;
    html: string;
    text: string;
};
export interface SubmissionEmailData {
    trackingCode: string;
    subject: string;
    description?: string;
    category?: string;
    status?: string;
    priority?: string;
    boardName?: string;
}
/** Internal notification sent to the team addresses configured for a company. */
export declare function renderSubmissionAlertEmail(args: {
    eventType: string;
    submission: SubmissionEmailData;
    submissionUrl?: string;
    settingsUrl?: string;
}): {
    subject: string;
    html: string;
    text: string;
};
/** Confirmation sent to the person who submitted the feedback. */
export declare function renderSubmissionReceiptEmail(args: {
    submission: SubmissionEmailData;
    trackingUrl: string;
    companyName?: string;
}): {
    subject: string;
    html: string;
    text: string;
};
/** Follow-up to the submitter when their feedback gets a reply or is resolved. */
export declare function renderSubmissionUpdateEmail(args: {
    submission: SubmissionEmailData;
    trackingUrl: string;
    companyName?: string;
    reply?: string;
    resolved?: boolean;
}): {
    subject: string;
    html: string;
    text: string;
};
/** Daily or weekly roll-up of submission activity for the team. */
export declare function renderDigestEmail(args: {
    period: "daily" | "weekly";
    items: Array<{
        eventType: string;
        submission: SubmissionEmailData;
    }>;
    dashboardUrl: string;
    settingsUrl?: string;
}): {
    subject: string;
    html: string;
    text: string;
};
export {};
//# sourceMappingURL=email-templates.d.ts.map
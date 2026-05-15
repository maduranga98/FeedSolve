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
export {};
//# sourceMappingURL=email-templates.d.ts.map
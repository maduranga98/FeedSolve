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
  body?: string; // additional HTML between intro and CTA
  footerNote?: string;
}

const BRAND_PRIMARY = "#2E86AB";
const BRAND_SECONDARY = "#1E3A5F";
const BRAND_ACCENT_BG = "#EBF5FB";
const TEXT_BODY = "#3B4A5A";
const TEXT_MUTED = "#7A8896";
const SURFACE = "#FFFFFF";
const PAGE_BG = "#F1F5F8";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Render the shared FeedSolve email shell. */
export function renderBrandedEmail(opts: EmailLayoutOptions): string {
  const preheader = opts.preheader || opts.intro.replace(/<[^>]+>/g, "").slice(0, 140);
  const cta = opts.ctaUrl && opts.ctaLabel
    ? `
      <tr>
        <td align="center" style="padding: 8px 0 4px;">
          <a href="${opts.ctaUrl}"
             style="display:inline-block;background:linear-gradient(135deg,${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:14px 28px;border-radius:10px;box-shadow:0 6px 18px rgba(46,134,171,0.28);">
            ${opts.ctaLabel}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 0 0;font-size:12px;color:${TEXT_MUTED};line-height:1.5;">
          ${opts.fallbackLinkLabel || "If the button doesn't work, copy and paste this link into your browser:"}<br/>
          <a href="${opts.ctaUrl}" style="color:${BRAND_PRIMARY};word-break:break-all;">${opts.ctaUrl}</a>
        </td>
      </tr>
    `
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT_BODY};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${SURFACE};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(30,58,95,0.08);border:1px solid #E3EDF4;">
          <!-- Brand bar -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 100%);padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.3px;color:#ffffff;">
                    FeedSolve
                  </td>
                  <td align="right" style="font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;font-weight:600;">
                    Collect. Resolve. Grow.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND_SECONDARY};">
                ${opts.title}
              </h1>
              <div style="font-size:15px;line-height:1.6;color:${TEXT_BODY};margin-bottom:24px;">
                ${opts.intro}
              </div>
              ${opts.body || ""}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${cta}
              </table>
            </td>
          </tr>

          ${opts.footerNote ? `
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:${BRAND_ACCENT_BG};border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.5;color:${TEXT_BODY};">
                ${opts.footerNote}
              </div>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid #EEF3F7;text-align:center;">
              <div style="font-size:13px;font-weight:700;color:${BRAND_SECONDARY};margin-bottom:4px;">FeedSolve</div>
              <div style="font-size:12px;color:${TEXT_MUTED};line-height:1.5;">
                Collect feedback. Resolve it fast.<br/>
                <a href="https://feedsolve.com" style="color:${BRAND_PRIMARY};text-decoration:none;">feedsolve.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:hello@feedsolve.com" style="color:${BRAND_PRIMARY};text-decoration:none;">hello@feedsolve.com</a>
              </div>
            </td>
          </tr>
        </table>
        <div style="max-width:560px;margin:14px auto 0;font-size:11px;color:${TEXT_MUTED};text-align:center;line-height:1.5;">
          You're receiving this email because of activity on your FeedSolve account.<br/>
          © ${new Date().getFullYear()} FeedSolve. All rights reserved.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Team invitation email. */
export function renderInvitationEmail(args: {
  inviterName: string;
  role: string;
  inviteUrl: string;
}): { subject: string; html: string; text: string } {
  const safeInviter = escapeHtml(args.inviterName);
  const safeRole = escapeHtml(args.role);
  const subject = `${args.inviterName} invited you to join FeedSolve`;
  const intro = `<strong>${safeInviter}</strong> has invited you to join their team on <strong>FeedSolve</strong> as <strong>${safeRole}</strong>.`;
  const body = `
    <div style="background:#F8FAFB;border:1px solid #E3EDF4;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:${BRAND_PRIMARY};margin-bottom:6px;">Your role</div>
      <div style="font-size:16px;font-weight:600;color:${BRAND_SECONDARY};">${safeRole}</div>
    </div>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${TEXT_BODY};">
      FeedSolve helps your team capture, triage, and respond to feedback from customers and employees — all in one place.
    </p>
  `;
  const html = renderBrandedEmail({
    preheader: `${args.inviterName} invited you to join FeedSolve as ${args.role}.`,
    title: "You're invited to join FeedSolve",
    intro,
    body,
    ctaLabel: "Accept Invitation",
    ctaUrl: args.inviteUrl,
    footerNote: "This invitation is linked to your email and expires in 7 days. If you weren't expecting it, you can safely ignore this message.",
  });
  const text =
    `${args.inviterName} invited you to join FeedSolve as ${args.role}.\n\n` +
    `Accept your invitation: ${args.inviteUrl}\n\n` +
    `This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.\n\n` +
    `— FeedSolve · Collect feedback. Resolve it fast.`;
  return { subject, html, text };
}

/** Board cycle rotation notification. */
export function renderBoardCycleEmail(args: {
  boardName: string;
  dashboardUrl?: string;
}): { subject: string; html: string; text: string } {
  const safeBoard = escapeHtml(args.boardName);
  const subject = `Your board "${args.boardName}" started a new cycle`;
  const intro = `Your board <strong>${safeBoard}</strong> has just rolled into a new cycle on FeedSolve.`;
  const body = `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${TEXT_BODY};">
      Previous submissions remain safely archived and are still viewable from your dashboard.
      Fresh submissions will now be grouped into the new cycle so you can compare performance over time.
    </p>
  `;
  const html = renderBrandedEmail({
    preheader: `Board "${args.boardName}" rolled into a new cycle.`,
    title: "A new cycle has started",
    intro,
    body,
    ctaLabel: args.dashboardUrl ? "Open Dashboard" : undefined,
    ctaUrl: args.dashboardUrl,
    footerNote: "You're receiving this because you own a board with automatic cycle rotation enabled. You can change this in board settings.",
  });
  const text =
    `Your board "${args.boardName}" started a new cycle on FeedSolve.\n\n` +
    `Previous submissions remain archived and viewable from your dashboard.\n` +
    (args.dashboardUrl ? `Open your dashboard: ${args.dashboardUrl}\n\n` : "\n") +
    `— FeedSolve · Collect feedback. Resolve it fast.`;
  return { subject, html, text };
}

/** Compact label helpers shared by the submission emails. */
function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const EVENT_TITLES: Record<string, string> = {
  "submission.created": "New feedback submitted",
  "submission.updated": "Feedback updated",
  "submission.assigned": "Feedback assigned",
  "submission.reply_added": "Reply added",
  "submission.resolved": "Feedback resolved",
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

/** Detail card used inside staff and submitter emails. */
function submissionCard(submission: SubmissionEmailData): string {
  const rows: Array<[string, string]> = [];
  if (submission.status) rows.push(["Status", titleCase(submission.status)]);
  if (submission.priority) rows.push(["Priority", titleCase(submission.priority)]);
  if (submission.category) rows.push(["Category", submission.category]);

  const cells = rows
    .map(
      ([label, value]) => `
        <td width="33%" style="padding-top:10px;vertical-align:top;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:${TEXT_MUTED};margin-bottom:3px;">${escapeHtml(label)}</div>
          <div style="font-size:13px;font-weight:600;color:${BRAND_SECONDARY};">${escapeHtml(value)}</div>
        </td>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFB;border:1px solid #E3EDF4;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
      <tr><td>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:${BRAND_PRIMARY};margin-bottom:4px;">Submission</div>
        <div style="font-size:15px;font-weight:600;color:${BRAND_SECONDARY};">${escapeHtml(submission.subject)}</div>
        <div style="font-size:12px;color:${TEXT_MUTED};margin-top:2px;">#${escapeHtml(submission.trackingCode)}${submission.boardName ? ` · ${escapeHtml(submission.boardName)}` : ""}</div>
      </td></tr>
      ${cells ? `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table></td></tr>` : ""}
    </table>
  `;
}

function submissionText(submission: SubmissionEmailData): string {
  return (
    `Submission: ${submission.subject} (#${submission.trackingCode})\n` +
    (submission.boardName ? `Board: ${submission.boardName}\n` : "") +
    (submission.status ? `Status: ${titleCase(submission.status)}\n` : "") +
    (submission.priority ? `Priority: ${titleCase(submission.priority)}\n` : "") +
    (submission.category ? `Category: ${submission.category}\n` : "")
  );
}

/** Internal notification sent to the team addresses configured for a company. */
export function renderSubmissionAlertEmail(args: {
  eventType: string;
  submission: SubmissionEmailData;
  submissionUrl?: string;
  settingsUrl?: string;
}): { subject: string; html: string; text: string } {
  const title = EVENT_TITLES[args.eventType] || "Feedback update";
  const subject = `[FeedSolve] ${title} — ${args.submission.subject}`;
  const html = renderBrandedEmail({
    preheader: `${title}: ${args.submission.subject}`,
    title,
    intro: `A submission on your FeedSolve board needs your attention.`,
    body: submissionCard(args.submission),
    ctaLabel: args.submissionUrl ? "Open Submission" : undefined,
    ctaUrl: args.submissionUrl,
    footerNote: args.settingsUrl
      ? `You're receiving this because your address is on this company's notification list. Manage recipients at ${args.settingsUrl}`
      : undefined,
  });
  const text =
    `FeedSolve — ${title}\n\n` +
    submissionText(args.submission) +
    (args.submissionUrl ? `\nOpen submission: ${args.submissionUrl}\n` : "") +
    (args.settingsUrl ? `\nManage notification recipients: ${args.settingsUrl}\n` : "") +
    `\n— FeedSolve · Collect feedback. Resolve it fast.`;
  return { subject, html, text };
}

/** Confirmation sent to the person who submitted the feedback. */
export function renderSubmissionReceiptEmail(args: {
  submission: SubmissionEmailData;
  trackingUrl: string;
  companyName?: string;
}): { subject: string; html: string; text: string } {
  const org = args.companyName ? escapeHtml(args.companyName) : "the team";
  const subject = `We received your feedback — #${args.submission.trackingCode}`;
  const body = `${submissionCard(args.submission)}
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${TEXT_BODY};">
      Keep your tracking code <strong>#${escapeHtml(args.submission.trackingCode)}</strong> — you can check the status of your submission at any time, and you'll hear from us when there's an update.
    </p>`;
  const html = renderBrandedEmail({
    preheader: `Your feedback reached ${args.companyName || "the team"} — tracking code #${args.submission.trackingCode}.`,
    title: "Thanks — we've got your feedback",
    intro: `Your submission has been received by <strong>${org}</strong> and is now in the queue.`,
    body,
    ctaLabel: "Track Your Submission",
    ctaUrl: args.trackingUrl,
    footerNote: "This is a one-time confirmation for feedback you submitted. No account or action is required.",
  });
  const text =
    `Thanks — we've got your feedback.\n\n` +
    `Your submission has been received by ${args.companyName || "the team"}.\n\n` +
    submissionText(args.submission) +
    `\nTrack your submission: ${args.trackingUrl}\n\n` +
    `— FeedSolve · Collect feedback. Resolve it fast.`;
  return { subject, html, text };
}

/** Follow-up to the submitter when their feedback gets a reply or is resolved. */
export function renderSubmissionUpdateEmail(args: {
  submission: SubmissionEmailData;
  trackingUrl: string;
  companyName?: string;
  reply?: string;
  resolved?: boolean;
}): { subject: string; html: string; text: string } {
  const org = args.companyName ? escapeHtml(args.companyName) : "The team";
  const title = args.resolved ? "Your feedback has been resolved" : "You have a reply";
  const subject = `${title} — #${args.submission.trackingCode}`;
  const replyBlock = args.reply
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_ACCENT_BG};border-radius:12px;padding:16px 18px;margin-bottom:24px;">
         <tr><td>
           <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:${BRAND_PRIMARY};margin-bottom:6px;">Reply from ${org}</div>
           <div style="font-size:14px;line-height:1.6;color:${TEXT_BODY};">${escapeHtml(args.reply)}</div>
         </td></tr>
       </table>`
    : "";
  const html = renderBrandedEmail({
    preheader: `${title} on submission #${args.submission.trackingCode}.`,
    title,
    intro: args.resolved
      ? `<strong>${org}</strong> marked your submission as resolved.`
      : `<strong>${org}</strong> responded to the feedback you submitted.`,
    body: `${replyBlock}${submissionCard(args.submission)}`,
    ctaLabel: "View Full Update",
    ctaUrl: args.trackingUrl,
    footerNote: "You're receiving this because you left your email address with this submission.",
  });
  const text =
    `${title}\n\n` +
    (args.reply ? `Reply from ${args.companyName || "the team"}:\n${args.reply}\n\n` : "") +
    submissionText(args.submission) +
    `\nView the update: ${args.trackingUrl}\n\n` +
    `— FeedSolve · Collect feedback. Resolve it fast.`;
  return { subject, html, text };
}

/** Daily or weekly roll-up of submission activity for the team. */
export function renderDigestEmail(args: {
  period: "daily" | "weekly";
  items: Array<{ eventType: string; submission: SubmissionEmailData }>;
  dashboardUrl: string;
  settingsUrl?: string;
}): { subject: string; html: string; text: string } {
  const label = args.period === "daily" ? "Daily" : "Weekly";
  const count = args.items.length;
  const subject = `[FeedSolve] ${label} digest — ${count} update${count === 1 ? "" : "s"}`;

  const rows = args.items
    .map((item) => {
      const title = EVENT_TITLES[item.eventType] || "Feedback update";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #EEF3F7;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:${BRAND_PRIMARY};margin-bottom:3px;">${escapeHtml(title)}</div>
            <div style="font-size:14px;font-weight:600;color:${BRAND_SECONDARY};">${escapeHtml(item.submission.subject)}</div>
            <div style="font-size:12px;color:${TEXT_MUTED};margin-top:2px;">#${escapeHtml(item.submission.trackingCode)}${item.submission.boardName ? ` · ${escapeHtml(item.submission.boardName)}` : ""}${item.submission.status ? ` · ${escapeHtml(titleCase(item.submission.status))}` : ""}</div>
          </td>
        </tr>`;
    })
    .join("");

  const html = renderBrandedEmail({
    preheader: `${count} feedback update${count === 1 ? "" : "s"} in your ${label.toLowerCase()} digest.`,
    title: `${label} feedback digest`,
    intro: `Here ${count === 1 ? "is" : "are"} the <strong>${count}</strong> update${count === 1 ? "" : "s"} from your FeedSolve boards.`,
    body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">${rows}</table>`,
    ctaLabel: "Open Dashboard",
    ctaUrl: args.dashboardUrl,
    footerNote: args.settingsUrl
      ? `You chose the ${label.toLowerCase()} digest for these notifications. Change the frequency at ${args.settingsUrl}`
      : undefined,
  });

  const text =
    `FeedSolve — ${label} feedback digest (${count} update${count === 1 ? "" : "s"})\n\n` +
    args.items
      .map(
        (item) =>
          `• ${EVENT_TITLES[item.eventType] || "Feedback update"}: ${item.submission.subject} (#${item.submission.trackingCode})`,
      )
      .join("\n") +
    `\n\nOpen your dashboard: ${args.dashboardUrl}\n` +
    (args.settingsUrl ? `Change digest frequency: ${args.settingsUrl}\n` : "") +
    `\n— FeedSolve · Collect feedback. Resolve it fast.`;
  return { subject, html, text };
}

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

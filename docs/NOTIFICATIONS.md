# Notification System

Email is the only notification channel. Slack and custom webhooks were removed.

## What happens when a submission is received

`onSubmissionNotification` (`functions/src/submission-notifications.ts`) fires on every
write to `submissions/{id}`, classifies the change, and emails the configured recipients
from **hello@feedsolve.com**.

| Event | Fired when |
| --- | --- |
| `submission.created` | the document is created |
| `submission.updated` | status changed (to anything but `resolved`) |
| `submission.resolved` | status changed to `resolved` |
| `submission.assigned` | `assignedTo` changed |
| `submission.reply_added` | a public reply was added |

## Who receives it

Recipients are resolved per submission, in this order:

1. **Roles** — every team member in `users` whose `role` is one of the selected roles
   (admin / manager / viewer; accounts are created as `admin`, there is no owner role).
   Staff changes need no config change.
2. **Extra addresses** — anything typed in manually: a shared inbox, someone off-team.
3. **Board recipients** — extra addresses for one board. With `replaceCompany: true` they
   are used *instead of* 1 and 2 for that board.

Addresses are normalised, de-duplicated, and sent on BCC so recipients don't see each
other.

## Delivery frequency

`instant` sends immediately. `daily_digest` and `weekly_digest` queue the event to
`notification_digests/{companyId}/events`; `sendDailyDigests` (08:00 UTC daily) and
`sendWeeklyDigests` (Mondays 08:00 UTC) drain the queue, group by recipient set, send one
roll-up per group, and delete what they sent. A failed send leaves events queued for the
next run. Test sends always deliver instantly.

## Where settings live

`companies/{companyId}/private/notifications` — readable and writable by owners and
admins only:

```jsonc
{
  "email": {
    "enabled": true,
    "roles": ["admin"],
    "recipients": ["ops@acme.com"],
    "events": ["submission.created"],
    "frequency": "instant"
  },
  "boardRecipients": {
    "<boardId>": { "recipients": ["hr@acme.com"], "replaceCompany": false }
  }
}
```

This used to live on `companies/{companyId}.webhooks`, which is **publicly readable** (the
public submit and tracking pages read branding from it), so recipient addresses were being
served to anyone. The old location is still read as a fallback and migrated to the private
document the first time settings are saved, at which point the legacy field is deleted.

Delivery attempts are written to `notification_logs/{companyId}/logs`.

## UI

`/notifications` (owner/admin, in the sidebar; `/integrations` redirects there):

- **Email notifications** — on/off, role checkboxes with a live headcount, extra
  addresses, event selection, delivery frequency, and a **Send test** button. A test
  sends to the *saved* recipients, so it refuses to run while there are unsaved edits.
- **Board-specific recipients** — per-board list plus "only notify these".
- **Delivery history** — filterable by sent / queued / failed.

## SMTP configuration

All mail goes through `functions/src/mailer.ts` — one pooled transport shared by
notifications, digests, team invitations, escalation rules and cycle rotation.

| Variable | Default | Notes |
| --- | --- | --- |
| `SMTP_PASS` | — | **Required.** No fallback: without it nothing is sent and the failure is logged. |
| `SMTP_HOST` | `mail.spacemail.com` | |
| `SMTP_PORT` | `465` | TLS is implied for 465. |
| `SMTP_USER` | `hello@feedsolve.com` | Also the From and Reply-To address. |
| `MAIL_FROM` | `"FeedSolve" <hello@feedsolve.com>` | |
| `APP_URL` | `https://app.feedsolve.com` | Used for links; localhost values are ignored. |

```bash
firebase functions:secrets:set SMTP_PASS
```

> The SMTP password was previously hardcoded in four function files and is therefore in
> git history. **Rotate it** and set the new one as a secret.

## Deploying

The old functions `handleSubmissionEvent` and `testWebhook` no longer exist. Delete them
when the CLI offers, or run:

```bash
firebase functions:delete handleSubmissionEvent testWebhook
```

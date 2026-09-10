# Notification System

Everything that leaves FeedSolve as email, Slack or a webhook call, and the UI that
configures it.

## What happens when a submission is received

`handleSubmissionEvent` (`functions/src/webhooks.ts`) fires on every write to
`submissions/{id}`, classifies the change into an event type, and fans it out:

| Event | Fired when |
| --- | --- |
| `submission.created` | the document is created |
| `submission.updated` | status changed (to anything but `resolved`) |
| `submission.resolved` | status changed to `resolved` |
| `submission.assigned` | `assignedTo` changed |
| `submission.reply_added` | a public reply was added |

Each enabled channel that subscribes to the event receives it. Email goes to the
company-wide recipients plus any board-specific ones, from **hello@feedsolve.com**.

`notifySubmitter` (`functions/src/submitter-notifications.ts`) handles the other
direction — emails to the person who submitted the feedback:

- **Receipt** on create: tracking code plus a link to `/track/:code`.
- **Update** when a public reply is added or the submission is resolved.

Both are per-company toggles that default to on, and neither ever fires for
anonymous submissions or submissions without an email address.

## Delivery frequency

`instant` sends immediately. `daily_digest` and `weekly_digest` queue the event to
`notification_digests/{companyId}/events` instead; the scheduled functions
`sendDailyDigests` (08:00 UTC daily) and `sendWeeklyDigests` (Mondays 08:00 UTC) drain
the queue, group events by recipient set, send one roll-up email per group, and delete
what they sent. A failed send leaves the events queued for the next run.

Test sends from the UI always deliver instantly, whatever the frequency.

## Where settings live

`companies/{companyId}/private/notifications` — readable and writable by owners and
admins only:

```jsonc
{
  "email":  { "enabled": true, "recipients": ["ops@acme.com"],
              "events": ["submission.created"], "frequency": "instant" },
  "slack":  { "enabled": true, "webhookUrl": "…", "events": [...] },
  "custom": { "enabled": true, "url": "…", "secret": "…", "events": [...] },
  "boardRecipients": {
    "<boardId>": { "recipients": ["hr@acme.com"], "replaceCompany": false }
  },
  "submitter": { "ack": true, "updates": true }
}
```

This used to live on `companies/{companyId}.webhooks`, which is **publicly readable**
(the public submit and tracking pages read branding from it) — so recipient addresses,
Slack URLs and webhook secrets were being served to anyone. Existing configs are read
from the old location as a fallback and migrated to the private document the first time
settings are saved from the UI, at which point the legacy field is deleted.

`boardRecipients` entries extend the company list by default; `replaceCompany: true`
sends that board's notifications *only* to its own addresses.

## UI

`/notifications` (owner/admin, in the sidebar; `/integrations` redirects there):

- Channel cards with pause / test / edit / remove.
- **Email**: recipient chips, event checkboxes, delivery frequency.
- **Emails to the submitter**: the two toggles above.
- **Board-specific recipients**: per-board list plus the "only notify these" option.
- **Delivery history**: `webhook_logs/{companyId}/logs`, filterable by status
  (`success` / `queued` / `failed`).

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

Multi-recipient mail is sent with the recipients on BCC so addresses are not disclosed
between recipients.

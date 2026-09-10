# FeedSolve Cloud Functions

Firestore triggers, scheduled jobs and callables backing FeedSolve.

## Notification functions

| Function | Kind | What it does |
| --- | --- | --- |
| `onSubmissionNotification` | Firestore `onWrite` on `submissions/{id}` | Emails the configured roles and addresses when a submission is created, updated, assigned, replied to or resolved. |
| `sendDailyDigests` | Scheduled, 08:00 UTC | Sends the daily roll-up for companies on the daily digest. |
| `sendWeeklyDigests` | Scheduled, Mondays 08:00 UTC | Same, weekly. |
| `sendTestNotification` | Callable (owner/admin) | Sends a sample notification to the configured recipients, ignoring the digest schedule. |

All email goes through `src/mailer.ts` — one pooled SMTP transport sending as
`hello@feedsolve.com`. Templates live in `src/email-templates.ts`, and configuration
resolution (roles → addresses, per-board overrides) in `src/notification-settings.ts`.

See [`../docs/NOTIFICATIONS.md`](../docs/NOTIFICATIONS.md) for the settings shape,
recipient resolution rules and delivery history.

## Other functions

- `api` — Express app exposing the public REST API (`src/api.ts`, `src/routes/`).
- `onTeamInvitationCreated` — emails team invitations.
- `evaluateEscalationRules` — escalates stale submissions and notifies the rule's recipients.
- `rotateBoardCycles` — rotates recurring board cycles and notifies the owner.
- `computeAnalyticsSnapshots`, `cleanupAttachments`, `dataCleanup` — scheduled maintenance.
- `stripe-billing` — checkout, portal and Stripe webhook handling.
- `onSubmissionCreate` — stamps new submissions with the board's current cycle.

## Environment

Set before deploying (see `../docs/NOTIFICATIONS.md` for the full table):

```bash
firebase functions:secrets:set SMTP_PASS
# optional: SMTP_HOST, SMTP_PORT, SMTP_USER, MAIL_FROM, APP_URL
```

## Development

```bash
npm run build      # tsc
npm run watch      # tsc --watch
npm run serve      # firebase emulators:start --only functions
npm run deploy     # firebase deploy --only functions
npm run logs       # firebase functions:log
```

## Monitoring

Watch execution count, error rate and P95 latency in the Firebase Console. Notification
delivery attempts are also recorded per company in
`notification_logs/{companyId}/logs` and surfaced in the app at **Notifications →
Delivery history**.

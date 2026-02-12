Notifications Overview

- Channels: WhatsApp (WA) and Email
- Templates: stored in DB with token replacement using {{var}} syntax
- Outbox: queued messages with PENDING/SENT/FAILED/CANCELLED statuses
- Sending: manual route or cron runner triggers senders; exponential backoff included
- Webhook: (optional) inbound callback endpoint to update delivery status asynchronously

Environment

- WA_PROVIDER: dummy (default)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM: for Email provider
- WEBHOOK_SECRET: if set, `/api/public/*/webhook` requires header `X-WEBHOOK-KEY: $WEBHOOK_SECRET`

Admin APIs

- WA: GET /api/admin/wa/outbox, POST /api/admin/wa/outbox/send, POST /api/admin/wa/outbox/:id/retry, :id/cancel
- WA Templates: GET/POST /api/admin/wa/templates, PUT/DELETE /api/admin/wa/templates/:id
- Email: GET /api/admin/email/outbox, POST /api/admin/email/outbox/send, POST /api/admin/email/outbox/:id/retry, :id/cancel
- Email Templates: GET/POST /api/admin/email/templates, PUT/DELETE /api/admin/email/templates/:id
- Cron tick: POST /api/admin/cron/tick (triggers both senders)

Webhooks (public, optional)

- WA: POST /api/public/wa/webhook
- Email: POST /api/public/email/webhook

Payload (JSON)

- providerMsgId: string (required)
- status: "pending" | "sent" | "delivered" | "failed" | "cancelled" (optional; default "delivered")

Cron setup (examples)

- GitHub Actions (every 5 minutes): use `.github/workflows/cron-tick.yml` to `curl` POST to `/api/admin/cron/tick` with header `X-CRON-KEY: ${{ secrets.CRON_SECRET }}`.
- Systemd timer / crontab: curl -H "X-CRON-KEY: $CRON_SECRET" -X POST https://your-app/api/admin/cron/tick

Security

- Protect the cron tick endpoint with `CRON_SECRET` via `X-CRON-KEY` header; optionally add IP allowlist or basic auth.
- For webhook endpoints, set `WEBHOOK_SECRET` and validate `X-WEBHOOK-KEY`.

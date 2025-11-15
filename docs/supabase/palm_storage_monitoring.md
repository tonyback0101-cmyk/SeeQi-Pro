# Supabase Palm Storage & Monitoring Plan

## Storage Bucket RBAC
- Bucket `palmprints` kept private (`public = false`).
- Policies enforce owner-only access for read/write operations.
- Ensure every upload request includes `contentType` metadata for audit.

## Logging Table `public.palm_upload_logs`
- Captures `upload`, `offline_queue`, `sync_success`, `sync_failure` actions.
- Store diagnostic info in `details` jsonb (e.g. file size, offline queue id, error message).

## Logging Strategy
1. API layer (`/api/palmprints/upload`) insert `upload` events with `file.size`, `handType`, `palmRegion`.
2. Offline sync (`syncOfflineUploads`) writes `sync_success` or `sync_failure` events.
3. Batch uploads record per-file `upload`/`offline_queue` status from UI.

## Monitoring Hooks
- Supabase Logs: enable Storage access logs for bucket activity.
- Scheduled Job: weekly Supabase function scanning `palm_upload_logs` for failures.
- Alerts: integrate with Slack/webhook when consecutive `sync_failure` or upload errors exceed threshold.

## Operational Checklist
- [ ] Create policies & migrations (`supabase/policies/palm_prints_policies.sql`).
- [ ] Update API handlers to write log events.
- [ ] Implement periodic review dashboard (Supabase SQL or BI tool).
- [ ] Document incident response playbook.

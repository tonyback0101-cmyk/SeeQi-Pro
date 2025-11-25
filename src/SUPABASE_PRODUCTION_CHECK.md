# Supabase Production Checklist

## Storage Buckets
- palmprints (public)
- tongue (public)

## Authentication URL Configuration
- Site URL: https://www.seeqicloud.com
- Redirect URLs:
  - https://www.seeqicloud.com/api/auth/callback
  - https://www.seeqicloud.com/api/auth/callback/google

## Email Templates
- Magic Link: enabled (SeeQi branding)
- Reset Password: enabled

## RLS Expectations (reference `migrations/v2_enable_rls_for_all_tables.sql`)
- `report_v2`: RLS enabled; owner read + service role insert/update.
- `orders`, `report_access`, `subscriptions`, `user_profiles`: RLS enabled; service role bypass for API/webhook, user policies limited到 self-owned rows.
# Supabase Production Checklist

## Storage Buckets
- palmprints (public)
- tongue (public)

## Authentication URL Configuration
- Site URL: https://www.seeqicloud.com
- Redirect URLs:
  - https://www.seeqicloud.com/api/auth/callback
  - https://www.seeqicloud.com/api/auth/callback/google

## Email Templates
- Magic Link: enabled (SeeQi branding)
- Reset Password: enabled

## RLS Expectations (no schema changes)
- report_v2: RLS enabled; policies allow owner read + service role insert/update.
- orders / report_access / subscriptions / user_profiles: RLS enabled; service role bypass (webhook + server APIs), user policies limited to own rows.

Configuration mirrors migrations/v2_enable_rls_for_all_tables.sql.
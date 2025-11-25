# Production Environment Variables

## Required URLs (all set to https://www.seeqicloud.com)
- NEXTAUTH_URL
- NEXTAUTH_URL_INTERNAL
- NEXT_PUBLIC_APP_URL

lib/env/urls.ts exports getPublicAppUrl/getNextAuthUrl/getInternalAppUrl so all APIs (Stripe checkout, affiliate share links, LLM proxy, etc.) resolve URLs via these envs. No APP_URL fallback.

## Supabase
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server)
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (client)

## Stripe
- STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
- STRIPE_FULL_REPORT_PRICE_ID / STRIPE_PRICE_SUB_MONTH_USD / STRIPE_PRICE_SUB_YEAR_USD

## OAuth & LLM
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- OPENAI_API_KEY (optional PENAI_BASE_URL or OPENAI_BASE_URL)

All server routes read from env (no hard-coded domains). Google OAuth callback uses /api/auth/callback/google.
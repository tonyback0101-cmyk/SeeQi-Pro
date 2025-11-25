# Deploy - SeeQi V2 Production (www.seeqicloud.com)

## 1. Branch & Build
- Branch: production-v2 (no pending lint issues)
- npm install && npm run lint && npm run build (local check)

## 2. Environment Variables (Vercel Production)
- NEXTAUTH_URL = https://www.seeqicloud.com
- NEXTAUTH_URL_INTERNAL = https://www.seeqicloud.com
- NEXT_PUBLIC_APP_URL = https://www.seeqicloud.com
- SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (provided)
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
- STRIPE_FULL_REPORT_PRICE_ID / STRIPE_PRICE_SUB_MONTH_USD / STRIPE_PRICE_SUB_YEAR_USD
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- OPENAI_API_KEY (+ optional PENAI_BASE_URL / OPENAI_BASE_URL)

## 3. Deployment Steps
1. Push production-v2 to remote main (or create release tag).
2. In Vercel dashboard: Deploy -> Production (www.seeqicloud.com).
3. Monitor build logs (no SWC plugin errors).
4. After deploy success, run smoke tests:
   - https://www.seeqicloud.com
   - https://www.seeqicloud.com/zh/v2/analyze
   - Upload demo assets -> confirm preview renders.
   - Trigger Stripe Checkout -> pay -> redirect back -> full access.
   - Already-paid account loads full report without paywall.

## 4. Post-Deploy Validation
- Supabase logs show new orders/report_access entries.
- Stripe dashboard receives webhook events (success + cancel).
- Edge route /api/llm/chat healthy (Vercel logs).
- Service worker + PWA manifest reachable.

## 5. Rollback Plan
- Use Vercel Deployments -> Promote previous successful build.
- Revert production-v2 branch to last stable commit if necessary.
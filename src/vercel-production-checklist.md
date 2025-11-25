# Vercel Production Checklist - SeeQi V2

## Before Deploy
- [ ] Ensure production env vars match deploy-production.md
- [ ] NEXTAUTH_URL / NEXT_PUBLIC_APP_URL resolved to https://www.seeqicloud.com
- [ ] Stripe webhook secret set and tested (Manage Webhooks page)
- [ ] Supabase service role key stored in Vercel env
- [ ] OpenAI / proxy base URL configured
- [ ] Git branch production-v2 up to date with main

## Deploy Steps
- [ ] Trigger Vercel Production Deploy
- [ ] Watch build log (no SWC plugin errors, no lint failures)
- [ ] Confirm edge function /api/llm/chat deployed (Vercel Functions tab)

## Post-Deploy Smoke Test
- [ ] Homepage loads + PWA assets OK
- [ ] /zh/v2/analyze accessible, camera prompt works
- [ ] /zh/v2/analysis-result preview renders (use ?reportId=demo)
- [ ] Stripe Checkout success/cancel flows return to /v2/analysis-result
- [ ] Already-paid user sees full content w/out paywall

## Monitoring
- [ ] Supabase logs show new orders/report_access entries
- [ ] Stripe dashboard shows webhook 200 responses
- [ ] Vercel Analytics / Logs clean (no 5xx bursts)

## Rollback
- [ ] Previous deployment ready for promote if needed
- [ ] Stripe webhook secret unchanged
- [ ] Notify team via Slack once verified
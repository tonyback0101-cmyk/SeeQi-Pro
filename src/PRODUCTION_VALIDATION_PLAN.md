# Production Validation Plan

1. Homepage: https://www.seeqicloud.com (check hero, PWA assets, service worker log).
2. Upload flow: https://www.seeqicloud.com/zh/v2/analyze (camera + file upload).
3. Preview report: use ?reportId=<demo> to confirm paywall + sections render.
4. Stripe Checkout: trigger from preview, complete payment (test card) and confirm success redirect.
5. Post-payment: confirm report auto-refreshes with full content, `report_access` row inserted.
6. Returning Pro user: login with subscription account → `/zh/v2/analysis-result` shows full detail.
7. Webhook: verify Vercel logs show 200 for `checkout.session.completed` / invoice events.
8. LLM proxy: POST https://www.seeqicloud.com/api/llm/chat with sample payload (expect 200 OK).

Document each step with screenshots during go-live.
# Production Validation Plan

1. Homepage: https://www.seeqicloud.com (check hero, PWA assets, service worker log).
2. Upload flow: https://www.seeqicloud.com/zh/v2/analyze (camera + file upload).
3. Preview report: use ?reportId=<demo> to confirm paywall + sections render.
4. Stripe Checkout: trigger from preview, complete payment (test card) and confirm success redirect.
5. Post-payment: confirm report auto-refreshes with full content, report_access row inserted.
6. Returning Pro user: log in with subscription account -> /zh/v2/analysis-result auto shows full detail.
7. Webhook: verify Vercel logs show 200 for checkout.session.completed and invoice events.
8. LLM proxy: POST https://www.seeqicloud.com/api/llm/chat with sample payload (200 OK).

Document each step with screenshots/notes during go-live.
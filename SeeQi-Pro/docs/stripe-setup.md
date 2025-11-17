# Stripe & Supabase Setup Checklist

## 1. 数据库迁移
1. 登录 Supabase 控制台，打开 SQL Editor。
2. 复制粘贴 `supabase/migrations/20251110_affiliate_wallet.sql` 全文。
3. 在 `public` schema 执行脚本，确保以下对象创建成功：
   - `user_profiles`, `orders`, `commission_records`, `wallet_transactions`, `payout_requests`, `assessment_records`
   - 函数 `fn_create_user_profile`, `fn_increment_wallet_balance`, `fn_adjust_wallet_pending`
4. 在 SQL 编辑器运行 `select count(*) from user_profiles;` 验证触发器可自动建档。

## 2. 环境变量
在 `.env.local`（及生产环境变量）中新增：

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://app.seeqi.com
```

可选：
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 3. Stripe Webhook
1. 在 Stripe Dashboard → Developers → Webhooks 新建端点：
   - URL: `<NEXT_PUBLIC_APP_URL>/api/stripe/webhook`
   - 事件：`checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
2. 保存生成的 `Signing secret`，填入 `STRIPE_WEBHOOK_SECRET`。
3. 本地调试可使用：
   ```bash
   stripe listen --events checkout.session.completed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.deleted \
     --forward-to https://localhost:3000/api/stripe/webhook
   ```
4. 确保 Stripe 产品价格 ID 与 `STRIPE_PRO_PRICE_ID` 对应。

## 4. 测试建议
- 下单/续费后，在 Supabase `orders`、`commission_records`、`wallet_transactions` 中验证写入。
- 手动触发退款或模拟 `invoice.payment_failed`，确认返佣自动逆转。
- 登录真实账户，打开 `/zh/affiliate` 和 `/zh/wallet` 验证数据连通。

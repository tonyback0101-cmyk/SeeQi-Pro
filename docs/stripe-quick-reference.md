# Stripe 配置快速参考

## 🚀 快速配置清单

### 在 Stripe Dashboard 中创建（Live 模式）

1. **创建 3 个产品价格**：
   - 月度订阅（Recurring, Monthly）
   - 年度订阅（Recurring, Yearly）
   - 单次报告（One-time）

2. **获取 API 密钥**：
   - Secret Key: `sk_live_...`
   - Publishable Key: `pk_live_...`

3. **配置 Webhook**：
   - URL: `https://seeqipro.vercel.app/api/stripe/webhook`
   - 获取 Secret: `whsec_...`

### 在 Vercel 中配置环境变量（Production）

```env
# 必需变量
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_FULL_REPORT_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRICE_SUB_MONTH_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_SUB_YEAR_USD=price_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 📋 变量说明

| 变量名 | 用途 | 获取位置 |
|--------|------|----------|
| `STRIPE_SECRET_KEY` | 服务器端 API 调用 | Developers → API keys → Secret key |
| `STRIPE_PUBLISHABLE_KEY` | 客户端支付（可选） | Developers → API keys → Publishable key |
| `STRIPE_FULL_REPORT_PRICE_ID` | 单次报告价格 | Products → 单次报告产品 → 价格 ID |
| `STRIPE_PRICE_SUB_MONTH_USD` | 月度订阅价格 | Products → 月度订阅产品 → 价格 ID |
| `STRIPE_PRICE_SUB_YEAR_USD` | 年度订阅价格 | Products → 年度订阅产品 → 价格 ID |
| `STRIPE_WEBHOOK_SECRET` | Webhook 验证 | Developers → Webhooks → Signing secret |

## ⚠️ 重要提示

1. **确保使用 Live 模式**：所有配置必须在 Live 模式下进行
2. **价格 ID 格式**：`price_` + 24 个字符
3. **货币一致性**：所有价格使用相同的货币（建议 USD）
4. **Webhook URL**：必须是完整的 HTTPS URL
5. **环境变量**：所有变量必须添加到 Production 环境

## 🔗 相关链接

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [完整配置指南](./stripe-production-setup.md)


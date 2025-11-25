# Stripe Webhook 和支付配置总结

## 📋 快速回答

### 1. Webhook 是否能在 Vercel 生产正确接收事件？

**答案**: ✅ **配置正确，但需要验证**

#### Webhook Handler 配置
- **路由**: `/api/stripe/webhook`
- **Runtime**: `nodejs`（支持长时间运行）
- **Dynamic**: `force-dynamic`（确保每次请求都处理）
- **状态**: ✅ **配置正确**

#### 支持的事件
- ✅ `checkout.session.completed` - 支付成功
- ✅ `customer.subscription.updated` - 订阅更新
- ✅ `customer.subscription.deleted` - 订阅取消/过期
- ✅ `invoice.payment_succeeded` - 订阅续费成功
- ✅ `invoice.payment_failed` - 支付失败

#### Vercel 部署要求
1. **Webhook URL**: `https://seeqi.app/api/stripe/webhook`
2. **HTTP Method**: `POST`
3. **Content-Type**: `application/json`

**建议**:
- 在 Stripe Dashboard 中配置 Webhook endpoint
- 确保 Webhook URL 指向生产域名
- 测试 Webhook 事件接收

### 2. Webhook secret 是否已复制到生产？

**答案**: ⚠️ **代码有检查，但需要确认环境变量**

#### Webhook Secret 配置
**位置**: `app/api/stripe/webhook/route.ts:22, 648-649`

```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "placeholder-webhook-secret";

export async function POST(req: Request) {
  // 运行时检查：如果使用占位值，说明环境变量未配置
  if (webhookSecret === "placeholder-webhook-secret") {
    return new Response("STRIPE_WEBHOOK_SECRET 未配置", { status: 500 });
  }
  // ...
}
```

**状态**: ✅ **有检查机制**
- ✅ 检查是否为占位值
- ✅ 如果未配置，返回明确的错误信息
- ✅ 使用 Stripe SDK 验证签名

**要求**:
- ⚠️ 必须在 Vercel 环境变量中设置 `STRIPE_WEBHOOK_SECRET`
- ⚠️ 必须从 Stripe Dashboard 获取正确的 Webhook secret
- ⚠️ 每个 Webhook endpoint 有唯一的 secret

**获取 Webhook Secret 步骤**:
1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 选择或创建 Webhook endpoint
4. 点击 endpoint，查看 **Signing secret**
5. 复制 secret 到 Vercel 环境变量

### 3. Price ID 是否和 Stripe 控制台一致？

**答案**: ⚠️ **需要验证环境变量与 Stripe 控制台一致**

#### Price ID 环境变量

| 用途 | 环境变量 | 位置 |
|------|---------|------|
| 单次报告购买 | `STRIPE_FULL_REPORT_PRICE_ID` | `app/api/pay/checkout/route.ts` |
| 月订阅 | `STRIPE_PRICE_SUB_MONTH_USD` | `app/api/v2/pay/checkout/route.ts` |
| 年订阅 | `STRIPE_PRICE_SUB_YEAR_USD` | `app/api/v2/pay/checkout/route.ts` |

#### Price ID 验证
**位置**: `lib/env/stripePrices.ts`

**功能**:
- ✅ 自动检查环境变量是否配置
- ✅ 输出详细的错误日志
- ✅ 提供统一的获取函数

**要求**:
- ⚠️ 环境变量中的 Price ID 必须与 Stripe Dashboard 中的 Price ID 完全一致
- ⚠️ Price ID 格式：`price_xxxxxxxxxxxxx`
- ⚠️ 确保使用生产环境的 Price ID（不是测试环境的）

**验证步骤**:
1. 在 Stripe Dashboard → **Products** → 查看每个产品的 Price ID
2. 对比环境变量中的 Price ID
3. 确保使用生产环境的 Price ID

### 4. 是否测试过成功、取消、失败、订阅过期？

**答案**: ⚠️ **代码已实现，但需要实际测试**

#### 支付成功处理 ✅
**事件**: `checkout.session.completed`

**处理逻辑**:
1. ✅ 更新 `orders` 表状态为 `paid`
2. ✅ 根据 `mode` 分流处理：
   - `single`: 创建 `report_access` 记录
   - `sub_month` / `sub_year`: 创建 `subscriptions` 记录，更新 `user_profiles.is_pro`
3. ✅ 记录日志

**位置**: `app/api/stripe/webhook/route.ts:182-336`

#### 订阅取消/过期处理 ✅
**事件**: `customer.subscription.deleted`

**处理逻辑**:
1. ✅ 更新 `subscriptions` 表状态为 `canceled`
2. ✅ 检查用户是否还有其他 active 订阅
3. ✅ 如果没有，更新 `user_profiles.is_pro = false` 和 `pro_plan = 'none'`
4. ✅ 记录日志

**位置**: `app/api/stripe/webhook/route.ts:577-643`

#### 订阅更新处理 ✅
**事件**: `customer.subscription.updated`

**处理逻辑**:
1. ✅ 更新 `subscriptions` 表状态
2. ✅ 更新 `current_period_end`
3. ✅ 如果状态为 `canceled`、`past_due` 或 `unpaid`，检查并更新 Pro 状态
4. ✅ 记录日志

**位置**: `app/api/stripe/webhook/route.ts:577-643`

#### 支付失败处理 ✅
**事件**: `invoice.payment_failed`

**处理逻辑**:
1. ✅ 查找对应的订单（通过 `payment_intent_id`）
2. ✅ 更新订单状态为 `failed`
3. ✅ 撤销联盟佣金（`reverseCommissionsForOrder`）
4. ✅ 记录日志

**位置**: `app/api/stripe/webhook/route.ts:549-570`

#### 订阅续费处理 ✅
**事件**: `invoice.payment_succeeded`（订阅续费）

**处理逻辑**:
1. ✅ 创建续费订单记录
2. ✅ 更新 `subscriptions` 表状态为 `active`
3. ✅ 更新 `user_profiles.is_pro = true`
4. ✅ 分发联盟佣金
5. ✅ 记录日志

**位置**: `app/api/stripe/webhook/route.ts:338-547`

## 📊 配置总结

| 配置项 | 状态 | 问题 | 建议 |
|--------|------|------|------|
| **Webhook 路由** | ✅ | 配置正确 | 在 Stripe Dashboard 配置 endpoint |
| **Webhook Secret** | ⚠️ | 需要确认环境变量 | 从 Stripe Dashboard 复制 secret |
| **Price ID** | ⚠️ | 需要验证一致性 | 对比环境变量与 Stripe Dashboard |
| **支付成功** | ✅ | 已实现 | 需要实际测试 |
| **订阅取消/过期** | ✅ | 已实现 | 需要实际测试 |
| **订阅更新** | ✅ | 已实现 | 需要实际测试 |
| **支付失败** | ✅ | 已实现 | 需要实际测试 |
| **订阅续费** | ✅ | 已实现 | 需要实际测试 |

## ✅ 结论

### 代码实现状态
- ✅ **所有支付场景都已实现**
- ✅ **Webhook handler 配置正确**
- ✅ **Price ID 验证机制完善**

### 需要执行的操作
1. **高优先级**: 在 Stripe Dashboard 配置 Webhook endpoint
2. **高优先级**: 在 Vercel 环境变量中设置 `STRIPE_WEBHOOK_SECRET`
3. **高优先级**: 验证 Price ID 与 Stripe Dashboard 一致
4. **高优先级**: 测试所有支付场景（成功、取消、失败、过期、续费）

## 🔧 生产环境检查清单

### Webhook 配置
- [ ] 在 Stripe Dashboard 创建 Webhook endpoint
- [ ] Webhook URL: `https://seeqi.app/api/stripe/webhook`
- [ ] 选择需要的事件类型：
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] 复制 Webhook secret 到 Vercel 环境变量 `STRIPE_WEBHOOK_SECRET`

### Price ID 配置
- [ ] 在 Stripe Dashboard 查看所有 Price ID
- [ ] 在 Vercel 环境变量中设置：
  - `STRIPE_FULL_REPORT_PRICE_ID`
  - `STRIPE_PRICE_SUB_MONTH_USD`
  - `STRIPE_PRICE_SUB_YEAR_USD`
- [ ] 验证环境变量与 Stripe Dashboard 一致

### 测试场景
- [ ] 测试单次报告购买成功
- [ ] 测试订阅购买成功
- [ ] 测试订阅取消
- [ ] 测试订阅过期
- [ ] 测试支付失败
- [ ] 测试订阅续费


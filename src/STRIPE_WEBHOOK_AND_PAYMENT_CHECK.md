# Stripe Webhook 和支付配置检查报告

## 🔍 检查结果

### 1. Webhook 是否能在 Vercel 生产正确接收事件？

**答案**: ✅ **配置正确，但需要验证**

#### Webhook Handler 配置
**位置**: `app/api/stripe/webhook/route.ts`

**关键配置**:
```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

**路由**: `/api/stripe/webhook`

**状态**: ✅ **配置正确**
- ✅ 使用 Node.js runtime（支持长时间运行）
- ✅ 使用 `force-dynamic`（确保每次请求都处理）
- ✅ 路由路径正确：`/api/stripe/webhook`

#### Webhook 事件处理
**位置**: `app/api/stripe/webhook/route.ts:673-678`

**支持的事件**:
- ✅ `checkout.session.completed` - 支付成功
- ✅ `customer.subscription.updated` - 订阅更新
- ✅ `customer.subscription.deleted` - 订阅取消/过期

**状态**: ✅ **已实现核心事件处理**

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

#### Webhook Secret 验证
**位置**: `app/api/stripe/webhook/route.ts:664`

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret,
);
```

**状态**: ✅ **使用 Stripe SDK 验证签名**

**要求**:
- ⚠️ 必须在 Vercel 环境变量中设置 `STRIPE_WEBHOOK_SECRET`
- ⚠️ 必须从 Stripe Dashboard 获取正确的 Webhook secret
- ⚠️ 每个 Webhook endpoint 有唯一的 secret

**建议**:
1. 在 Stripe Dashboard → Webhooks → 选择 endpoint
2. 复制 "Signing secret"
3. 在 Vercel 环境变量中设置 `STRIPE_WEBHOOK_SECRET`

### 3. Price ID 是否和 Stripe 控制台一致？

**答案**: ⚠️ **需要验证环境变量与 Stripe 控制台一致**

#### Price ID 配置位置

##### 1. 单次报告购买
**位置**: `app/api/pay/checkout/route.ts:42, 84-95`
```typescript
const priceId = requireEnv("STRIPE_FULL_REPORT_PRICE_ID");
```

**环境变量**: `STRIPE_FULL_REPORT_PRICE_ID`

##### 2. 订阅购买（V2）
**位置**: `app/api/v2/pay/checkout/route.ts:89-95`
```typescript
const priceId =
  mode === "single"
    ? requireEnv("STRIPE_FULL_REPORT_PRICE_ID")
    : mode === "sub_month"
    ? requireEnv("STRIPE_PRICE_SUB_MONTH_USD")
    : requireEnv("STRIPE_PRICE_SUB_YEAR_USD");
```

**环境变量**:
- `STRIPE_FULL_REPORT_PRICE_ID` - 单次报告
- `STRIPE_PRICE_SUB_MONTH_USD` - 月订阅
- `STRIPE_PRICE_SUB_YEAR_USD` - 年订阅

##### 3. 订阅购买（V2 Subscription）
**位置**: `app/api/v2/subscription/checkout/route.ts:61-91`
```typescript
if (!selectedPlan || !selectedPlan.stripePriceId) {
  // 错误处理
}
// ...
price: selectedPlan.stripePriceId,
```

**状态**: ✅ **使用配置的 Price ID**

#### Price ID 验证
**位置**: `lib/env/stripePrices.ts`（如果存在）

**状态**: ⚠️ **需要检查文件是否存在**

**要求**:
- ⚠️ 环境变量中的 Price ID 必须与 Stripe Dashboard 中的 Price ID 完全一致
- ⚠️ Price ID 格式：`price_xxxxxxxxxxxxx`
- ⚠️ 确保使用正确的货币（USD）

**建议**:
1. 在 Stripe Dashboard → Products → 查看每个产品的 Price ID
2. 验证环境变量中的 Price ID 与 Dashboard 一致
3. 确保使用生产环境的 Price ID（不是测试环境的）

### 4. 是否测试过成功、取消、失败、订阅过期？

**答案**: ⚠️ **代码已实现，但需要实际测试**

#### 支付成功处理
**位置**: `app/api/stripe/webhook/route.ts:182-336`

**事件**: `checkout.session.completed`

**处理逻辑**:
1. ✅ 更新 `orders` 表状态为 `paid`
2. ✅ 根据 `mode` 分流处理：
   - `single`: 创建 `report_access` 记录
   - `sub_month` / `sub_year`: 创建 `subscriptions` 记录，更新 `user_profiles.is_pro`
3. ✅ 记录日志

**状态**: ✅ **已实现**

#### 订阅取消/过期处理
**位置**: `app/api/stripe/webhook/route.ts:573-620`

**事件**: `customer.subscription.deleted`

**处理逻辑**:
1. ✅ 更新 `subscriptions` 表状态为 `canceled`
2. ✅ 更新 `user_profiles.is_pro = false`
3. ✅ 更新 `user_profiles.pro_plan = 'none'`
4. ✅ 记录日志

**状态**: ✅ **已实现**

#### 订阅更新处理
**位置**: `app/api/stripe/webhook/route.ts:573-620`

**事件**: `customer.subscription.updated`

**处理逻辑**:
1. ✅ 更新 `subscriptions` 表状态
2. ✅ 更新 `user_profiles.is_pro` 和 `pro_plan`
3. ✅ 更新 `current_period_end`
4. ✅ 记录日志

**状态**: ✅ **已实现**

#### 支付失败处理
**位置**: 未找到明确的失败处理逻辑

**状态**: ⚠️ **需要检查**

**建议**:
- 检查 Stripe Dashboard 中的失败事件
- 考虑添加 `payment_intent.payment_failed` 事件处理
- 考虑添加 `invoice.payment_failed` 事件处理

#### 订阅续费处理
**位置**: `app/api/stripe/webhook/route.ts:338-547`

**事件**: `invoice.paid`（订阅续费）

**处理逻辑**:
1. ✅ 创建续费订单记录
2. ✅ 更新 `subscriptions` 表状态为 `active`
3. ✅ 更新 `user_profiles.is_pro = true`
4. ✅ 分发联盟佣金
5. ✅ 记录日志

**状态**: ✅ **已实现**

## 📊 配置总结

| 配置项 | 状态 | 问题 | 建议 |
|--------|------|------|------|
| **Webhook 路由** | ✅ | 配置正确 | 在 Stripe Dashboard 配置 endpoint |
| **Webhook Secret** | ⚠️ | 需要确认环境变量 | 从 Stripe Dashboard 复制 secret |
| **Price ID** | ⚠️ | 需要验证一致性 | 对比环境变量与 Stripe Dashboard |
| **支付成功** | ✅ | 已实现 | 需要实际测试 |
| **订阅取消/过期** | ✅ | 已实现 | 需要实际测试 |
| **订阅更新** | ✅ | 已实现 | 需要实际测试 |
| **支付失败** | ⚠️ | 未找到明确处理 | 考虑添加失败事件处理 |
| **订阅续费** | ✅ | 已实现 | 需要实际测试 |

## 🔧 建议的修复和测试

### 1. 验证 Webhook Secret（高优先级）
- [ ] 在 Stripe Dashboard 获取 Webhook secret
- [ ] 在 Vercel 环境变量中设置 `STRIPE_WEBHOOK_SECRET`
- [ ] 测试 Webhook 事件接收

### 2. 验证 Price ID（高优先级）
- [ ] 在 Stripe Dashboard 查看所有 Price ID
- [ ] 对比环境变量中的 Price ID
- [ ] 确保使用生产环境的 Price ID

### 3. 测试支付场景（高优先级）
- [ ] 测试单次报告购买成功
- [ ] 测试订阅购买成功
- [ ] 测试订阅取消
- [ ] 测试订阅过期
- [ ] 测试支付失败（如果可能）
- [ ] 测试订阅续费

### 4. 添加支付失败处理（中优先级）
考虑添加以下事件处理：
- `payment_intent.payment_failed`
- `invoice.payment_failed`


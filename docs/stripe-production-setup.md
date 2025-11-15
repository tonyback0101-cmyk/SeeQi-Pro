# Stripe 生产环境配置完整指南

## 📋 概述

本指南将帮助你在生产环境（https://seeqipro.vercel.app/）中完整配置 Stripe 支付系统。

## 🎯 需要配置的内容

### 1. Stripe 产品和价格
- **月度订阅**（Monthly Subscription）
- **年度订阅**（Yearly Subscription）
- **单次报告**（One-time Report / Lifetime）

### 2. Stripe API 密钥
- **Secret Key**（服务器端）
- **Publishable Key**（客户端）

### 3. Webhook 配置
- **Webhook Endpoint**
- **Webhook Secret**

---

## 📝 第一步：在 Stripe Dashboard 中创建产品和价格

### 1.1 登录 Stripe Dashboard

1. 访问 [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. 确保切换到 **Live 模式**（右上角切换开关）
3. 进入 **Products** 页面

### 1.2 创建产品：SeeQi Pro 订阅

#### 产品 1：SeeQi Pro 月度订阅

1. 点击 **"Add product"** 或 **"创建产品"**
2. 填写产品信息：
   - **Name（名称）**: `SeeQi Pro - Monthly`
   - **Description（描述）**: `SeeQi Pro 月度会员订阅`
   - **Pricing model（定价模式）**: 选择 **"Recurring"（定期）**
   - **Price（价格）**: 输入你的月度价格（例如：`$9.99` 或 `¥68`）
   - **Billing period（计费周期）**: 选择 **"Monthly"（月度）**
   - **Currency（货币）**: 选择 `USD` 或 `CNY`（建议使用 `USD`）
3. 点击 **"Save product"**
4. **复制价格 ID**（格式：`price_xxxxxxxxxxxxx`）→ 这是 `STRIPE_PRICE_SUB_MONTH_USD`

#### 产品 2：SeeQi Pro 年度订阅

1. 再次点击 **"Add product"**
2. 填写产品信息：
   - **Name（名称）**: `SeeQi Pro - Yearly`
   - **Description（描述）**: `SeeQi Pro 年度会员订阅`
   - **Pricing model（定价模式）**: 选择 **"Recurring"（定期）**
   - **Price（价格）**: 输入你的年度价格（例如：`$99.99` 或 `¥688`）
   - **Billing period（计费周期）**: 选择 **"Yearly"（年度）**
   - **Currency（货币）**: 选择 `USD` 或 `CNY`（与月度订阅保持一致）
3. 点击 **"Save product"**
4. **复制价格 ID** → 这是 `STRIPE_PRICE_SUB_YEAR_USD`

#### 产品 3：SeeQi 单次报告

1. 再次点击 **"Add product"**
2. 填写产品信息：
   - **Name（名称）**: `SeeQi Full Report`
   - **Description（描述）**: `SeeQi 完整分析报告（一次性）`
   - **Pricing model（定价模式）**: 选择 **"One time"（一次性）**
   - **Price（价格）**: 输入你的单次报告价格（例如：`$4.99` 或 `¥35`）
   - **Currency（货币）**: 选择 `USD` 或 `CNY`（与其他产品保持一致）
3. 点击 **"Save product"**
4. **复制价格 ID** → 这是 `STRIPE_FULL_REPORT_PRICE_ID`

### 1.3 记录所有价格 ID

创建完成后，你应该有 3 个价格 ID：

```
月度订阅: price_xxxxxxxxxxxxx  → STRIPE_PRICE_SUB_MONTH_USD
年度订阅: price_xxxxxxxxxxxxx  → STRIPE_PRICE_SUB_YEAR_USD
单次报告: price_xxxxxxxxxxxxx  → STRIPE_FULL_REPORT_PRICE_ID
```

**⚠️ 重要提示**：
- 确保所有价格使用相同的货币（建议 `USD`）
- 价格 ID 格式：`price_` + 24 个字符
- 每个价格 ID 都是唯一的，不要混淆

---

## 🔑 第二步：获取 Stripe API 密钥

### 2.1 获取 Secret Key

1. 在 Stripe Dashboard 中，点击左侧菜单 **"Developers"** → **"API keys"**
2. 确保在 **Live 模式**（右上角显示 "Live mode"）
3. 找到 **"Secret key"** 部分
4. 点击 **"Reveal test key"** 或 **"Reveal live key"**（如果是第一次）
5. **复制 Secret key**（格式：`sk_live_xxxxxxxxxxxxx`）→ 这是 `STRIPE_SECRET_KEY`

### 2.2 获取 Publishable Key

1. 在同一页面，找到 **"Publishable key"** 部分
2. **复制 Publishable key**（格式：`pk_live_xxxxxxxxxxxxx`）→ 这是 `STRIPE_PUBLISHABLE_KEY`

**⚠️ 安全提示**：
- Secret Key 必须保密，只能用于服务器端
- Publishable Key 可以用于客户端（前端）
- 不要将 Secret Key 提交到 Git 仓库

---

## 🔔 第三步：配置 Webhook

### 3.1 创建 Webhook Endpoint

1. 在 Stripe Dashboard 中，点击左侧菜单 **"Developers"** → **"Webhooks"**
2. 点击 **"Add endpoint"** 或 **"添加端点"**
3. 填写 Webhook 信息：
   - **Endpoint URL**: `https://seeqipro.vercel.app/api/stripe/webhook`
   - **Description（描述）**: `SeeQi Production Webhook`
   - **Events to send（要发送的事件）**: 点击 **"Select events"**，选择以下事件：
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
4. 点击 **"Add endpoint"**

### 3.2 获取 Webhook Secret

1. 创建 Webhook 后，点击新创建的 Webhook endpoint
2. 在 **"Signing secret"** 部分，点击 **"Reveal"** 或 **"显示"**
3. **复制 Signing secret**（格式：`whsec_xxxxxxxxxxxxx`）→ 这是 `STRIPE_WEBHOOK_SECRET`

**⚠️ 重要提示**：
- Webhook Secret 用于验证来自 Stripe 的请求
- 每个 Webhook endpoint 都有唯一的 Secret
- 如果重新创建 Webhook，Secret 会改变，需要更新环境变量

---

## ⚙️ 第四步：在 Vercel 中配置环境变量

### 4.1 进入 Vercel 项目设置

1. 访问 [https://vercel.com](https://vercel.com)
2. 登录并选择你的项目 `seeqipro`
3. 进入 **"Settings"** → **"Environment Variables"**

### 4.2 配置必需的环境变量

在 **"Environment Variables"** 页面，为 **Production** 环境添加以下变量：

#### 4.2.1 Stripe API 密钥

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `STRIPE_SECRET_KEY` | `sk_live_xxxxxxxxxxxxx` | Stripe Secret Key（从第二步获取） |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxxx` | Stripe Publishable Key（从第二步获取） |

#### 4.2.2 价格 ID

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `STRIPE_FULL_REPORT_PRICE_ID` | `price_xxxxxxxxxxxxx` | 单次报告价格 ID（从第一步获取） |
| `STRIPE_PRICE_SUB_MONTH_USD` | `price_xxxxxxxxxxxxx` | 月度订阅价格 ID（从第一步获取） |
| `STRIPE_PRICE_SUB_YEAR_USD` | `price_xxxxxxxxxxxxx` | 年度订阅价格 ID（从第一步获取） |

#### 4.2.3 Webhook Secret

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxxxxxxxxxx` | Webhook Signing Secret（从第三步获取） |

### 4.3 可选变量（备用）

如果需要客户端直接访问价格信息，可以添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_STRIPE_PRICE_ONE` | `price_xxxxxxxxxxxxx` | 与 `STRIPE_FULL_REPORT_PRICE_ID` 相同（可选） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxxx` | 与 `STRIPE_PUBLISHABLE_KEY` 相同（可选） |

### 4.4 配置步骤

1. 点击 **"Add New"** 或 **"添加新变量"**
2. 输入 **Key**（变量名）
3. 输入 **Value**（变量值）
4. 选择 **Environment**：
   - ✅ **Production**（必须）
   - ✅ **Preview**（可选，用于预览环境）
   - ✅ **Development**（可选，用于本地开发）
5. 点击 **"Save"**

**⚠️ 重要提示**：
- 确保所有变量都添加到 **Production** 环境
- 变量名必须完全匹配（区分大小写）
- 值不要包含多余的空格或换行符

---

## ✅ 第五步：验证配置

### 5.1 检查环境变量

在 Vercel Dashboard 中，确认所有变量都已正确配置：

- [ ] `STRIPE_SECRET_KEY` 已设置（格式：`sk_live_...`）
- [ ] `STRIPE_PUBLISHABLE_KEY` 已设置（格式：`pk_live_...`）
- [ ] `STRIPE_FULL_REPORT_PRICE_ID` 已设置（格式：`price_...`）
- [ ] `STRIPE_PRICE_SUB_MONTH_USD` 已设置（格式：`price_...`）
- [ ] `STRIPE_PRICE_SUB_YEAR_USD` 已设置（格式：`price_...`）
- [ ] `STRIPE_WEBHOOK_SECRET` 已设置（格式：`whsec_...`）

### 5.2 触发重新部署

1. 在 Vercel Dashboard 中，进入 **"Deployments"**
2. 点击最新的部署，选择 **"Redeploy"**
3. 或者推送一个小的代码更改到 GitHub 以触发自动部署

### 5.3 测试支付流程

#### 测试 1：单次报告支付

1. 访问 `https://seeqipro.vercel.app/`
2. 创建一个分析报告
3. 尝试购买完整报告
4. 使用 Stripe 测试卡号：`4242 4242 4242 4242`
5. 验证支付是否成功

#### 测试 2：订阅支付

1. 访问定价页面或订阅按钮
2. 选择月度或年度订阅
3. 使用测试卡号完成支付
4. 验证订阅是否创建成功

#### 测试 3：Webhook 验证

1. 在 Stripe Dashboard 中，进入 **"Developers"** → **"Webhooks"**
2. 点击你的 Webhook endpoint
3. 查看 **"Recent events"**，确认事件已成功发送
4. 检查是否有错误日志

---

## 🔍 故障排查

### 问题 1：支付失败

**可能原因**：
- Stripe Secret Key 配置错误
- 价格 ID 不存在或格式错误
- 货币不匹配

**解决方法**：
1. 检查 Vercel 环境变量是否正确
2. 在 Stripe Dashboard 中验证价格 ID 是否存在
3. 确认所有价格使用相同的货币

### 问题 2：Webhook 未收到事件

**可能原因**：
- Webhook URL 配置错误
- Webhook Secret 不匹配
- Vercel 部署未完成

**解决方法**：
1. 检查 Webhook URL 是否为：`https://seeqipro.vercel.app/api/stripe/webhook`
2. 在 Stripe Dashboard 中测试 Webhook，查看错误信息
3. 确认 Vercel 部署已完成

### 问题 3：订阅状态未更新

**可能原因**：
- Webhook 事件未正确处理
- 数据库连接问题
- 订单状态同步失败

**解决方法**：
1. 检查 Vercel 函数日志
2. 查看 Stripe Dashboard 中的 Webhook 事件日志
3. 确认 Supabase 数据库连接正常

---

## 📊 环境变量完整清单

### 必需变量（Production）

```env
# Stripe API 密钥
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# 价格 ID
STRIPE_FULL_REPORT_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRICE_SUB_MONTH_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_SUB_YEAR_USD=price_xxxxxxxxxxxxx

# Webhook
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 可选变量

```env
# 客户端访问（如果需要）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ONE=price_xxxxxxxxxxxxx
```

---

## 🎯 验收标准

配置完成后，以下功能应该正常工作：

- [ ] ✅ 用户可以购买单次报告
- [ ] ✅ 用户可以订阅月度会员
- [ ] ✅ 用户可以订阅年度会员
- [ ] ✅ 支付成功后，报告自动解锁
- [ ] ✅ 订阅成功后，用户获得 Pro 权限
- [ ] ✅ Webhook 事件正常接收和处理
- [ ] ✅ 订单状态正确同步到数据库
- [ ] ✅ 订阅取消和更新正常工作

---

## 📞 需要帮助？

如果遇到问题：

1. **检查 Stripe Dashboard**：查看支付和 Webhook 事件日志
2. **检查 Vercel 日志**：查看函数执行日志和错误信息
3. **验证环境变量**：确认所有变量都已正确配置
4. **测试 Webhook**：在 Stripe Dashboard 中手动触发测试事件

---

## 🔄 更新配置

如果需要更新价格或添加新产品：

1. 在 Stripe Dashboard 中创建新的价格
2. 复制新的价格 ID
3. 在 Vercel 中更新对应的环境变量
4. 触发重新部署

---

**配置完成后，你的生产环境 Stripe 支付系统应该可以正常工作了！** 🎉


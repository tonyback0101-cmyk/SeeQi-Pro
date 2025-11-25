# SeeQi V2 付费/权限体系实现文档

## 概述

V2 付费/权限体系实现了三种付费路径和统一的权限判定机制，确保测试 → 报告 → 解锁 → Webhook → 权限的完整闭环。

## 三种付费路径

1. **单次解锁本报告**：`STRIPE_FULL_REPORT_PRICE_ID`
2. **月订阅**：`STRIPE_PRICE_SUB_MONTH_USD`
3. **年订阅**：`STRIPE_PRICE_SUB_YEAR_USD`

## 权限判定来源

### 单次报告权限
- **主要来源**：`report_access` 表（`user_id` + `report_id`）
- **备选来源**：`orders` 表（`kind = 'single'` 且 `status = 'paid'` 且 `report_id` 匹配）

### 订阅权限
- **主要来源**：`subscriptions` 表（`status = 'active'`）
- **兼容来源**：`user_profiles.is_pro` + `user_profiles.pro_plan`（值为 `'none' | 'sub_month' | 'sub_year'`）

## 访问级别（AccessLevel）

统一收敛为 5 种访问级别：

- `guest_free`：未登录用户
- `user_free`：已登录但既没有当前 report 的单次权限，也没有有效订阅
- `single_paid`：已登录 + 当前 report 单次已解锁
- `sub_month`：已登录 + 有有效月订阅
- `sub_year`：已登录 + 有有效年订阅

## 核心文件

### 1. 权限判定逻辑
- **文件**：`lib/v2/accessLevel.ts`
- **函数**：
  - `hasSingleReportAccess(userId, reportId)`：检查单次购买权限
  - `calculateAccessLevel(isLoggedIn, userId, reportId, proStatus)`：计算访问级别
  - `canViewFullContent(accessLevel)`：判断是否可以查看完整内容

### 2. 支付 API
- **文件**：`app/api/v2/pay/checkout/route.ts`
- **功能**：创建 Stripe Checkout Session，支持三种付费模式
- **Metadata**：
  - `reportId`：报告 ID
  - `userId`：用户 ID
  - `paymentType`：付费类型（`single` | `month` | `year`）
  - `planId`：计划 ID（`single` | `monthly` | `yearly`）
  - `version: "v2"`：标记为 V2 支付

### 3. Webhook 处理
- **文件**：`app/api/stripe/webhook/route.ts`
- **功能**：处理支付成功事件，更新权限状态
- **处理逻辑**：
  - **单次购买**：
    - 写入 `orders` 表（`kind = 'single'`, `report_id` 必填）
    - 写入 `report_access` 表（`user_id` + `report_id`）
  - **订阅**：
    - 写入 `orders` 表（`kind = 'sub_month'` 或 `'sub_year'`）
    - 更新 `user_profiles.is_pro = true` 和 `pro_plan = 'sub_month'/'sub_year'`
    - 写入 `subscriptions` 表（`status = 'active'`）
    - 更新 `user_profiles.stripe_customer_id`

### 4. 结果页渲染
- **文件**：`app/[locale]/v2/analysis-result/V2AnalysisResultClient.tsx`
- **功能**：根据 `accessLevel` 渲染免费内容和加锁内容
- **解锁按钮**：点击后弹出支付 Modal，显示三种付费选项

## 数据库迁移脚本

### 1. user_profiles 表
- **文件**：`migrations/v2_ensure_user_profiles_fields.sql`
- **功能**：确保 `user_profiles` 表包含必要字段
- **字段**：
  - `is_pro` boolean default false
  - `pro_plan` text: 'none' | 'sub_month' | 'sub_year'
  - `stripe_customer_id` text

### 2. orders 表
- **文件**：`migrations/v2_ensure_orders_table.sql`
- **功能**：确保 `orders` 表包含必要字段（统一记账）
- **字段**：
  - `stripe_checkout_session_id` text
  - `stripe_payment_intent_id` text
  - `amount` integer（金额，分）
  - `currency` text default 'usd'
  - `kind` text: 'single' | 'sub_month' | 'sub_year'
  - `report_id` uuid（kind='single' 时必填）
  - `status` text: 'pending' | 'paid' | 'failed' | 'refunded'

### 3. report_access 表
- **文件**：`migrations/v2_ensure_report_access_user_id.sql`
- **功能**：确保 `report_access` 表支持 `user_id` 字段（V2 使用）
- **约束**：部分唯一索引 `(report_id, user_id) WHERE user_id IS NOT NULL`

### 4. subscriptions 表
- **文件**：`migrations/v2_ensure_subscriptions_table.sql`
- **功能**：确保 `subscriptions` 表存在并包含必要字段
- **字段**：`user_id`, `provider_subscription_id`, `status`, `plan_id`, `created_at`, `updated_at`

## 测试流程

### 完整闭环测试

1. **测试 → 报告**
   - 访问 `/zh/v2/analyze`
   - 上传掌纹、舌苔图片，填写梦境
   - 提交分析（支持匿名用户）
   - 获取 `reportId` 并跳转到结果页

2. **报告 → 解锁**
   - 访问 `/zh/v2/analysis-result?reportId=xxx`
   - 查看免费内容（体质类型、气运指数概览、精简建议）
   - 点击"解锁完整报告"按钮
   - 选择付费方式（单次/月订阅/年订阅）

3. **解锁 → Webhook**
   - 完成 Stripe 支付
   - Stripe 发送 `checkout.session.completed` 事件
   - Webhook 处理：
     - 单次购买：写入 `report_access` 表
     - 订阅：更新 `user_profiles` 和 `subscriptions` 表

4. **Webhook → 权限**
   - 用户返回结果页
   - `calculateAccessLevel` 函数查询权限状态
   - 根据 `accessLevel` 渲染完整内容

## 注意事项

1. **数据库兼容性**：所有迁移脚本使用 `IF NOT EXISTS` 和 `ADD COLUMN IF NOT EXISTS`，不会破坏历史数据
2. **权限判定优先级**：年订阅 > 月订阅 > 单次购买 > 免费用户
3. **错误处理**：所有数据库操作都有 try/catch，失败时不影响主流程
4. **备选方案**：如果 `report_access` 表不存在，权限判定会从 `orders` 表查询

## 环境变量

确保以下环境变量已配置：

- `STRIPE_FULL_REPORT_PRICE_ID`：单次解锁价格 ID
- `STRIPE_PRICE_SUB_MONTH_USD`：月订阅价格 ID
- `STRIPE_PRICE_SUB_YEAR_USD`：年订阅价格 ID
- `STRIPE_SECRET_KEY`：Stripe 密钥
- `STRIPE_WEBHOOK_SECRET`：Webhook 密钥


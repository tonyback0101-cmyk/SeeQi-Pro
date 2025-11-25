# V2 付费/权限体系实现检查清单

## ✅ 已完成的核心功能

### 1. 数据库表结构
- [x] `user_profiles` 表：`is_pro`, `pro_plan`, `stripe_customer_id`
- [x] `orders` 表：`stripe_checkout_session_id`, `stripe_payment_intent_id`, `kind`, `report_id`, `status`
- [x] `subscriptions` 表：`stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_end`
- [x] `report_access` 表：`user_id`, `report_id`（用于单次购买权限）

### 2. API 路由
- [x] `/api/v2/pay/checkout` - 创建 Stripe Checkout Session
  - [x] 支持 `mode`: `single` | `sub_month` | `sub_year`
  - [x] 生成/复用 `stripe_customer_id`
  - [x] 创建 `pending` 订单
  - [x] 统一 metadata 格式：`user_id`, `mode`, `report_id`
  - [x] 统一 success_url 和 cancel_url

- [x] `/api/stripe/webhook` - 处理 Stripe 事件
  - [x] `checkout.session.completed` - 处理支付成功
  - [x] `customer.subscription.updated/deleted` - 处理订阅状态变更
  - [x] `invoice.payment_succeeded` - 处理订阅续费（可选）
  - [x] `invoice.payment_failed` - 处理支付失败（可选）

### 3. 访问控制
- [x] `hasSingleReportAccess` - 查询 `orders` 表（`kind='single'`, `status='paid'`）
- [x] `getActiveSubscription` - 查询 `subscriptions` 表（`status='active'`, `current_period_end >= now`）
- [x] `computeV2Access` - 计算访问级别
  - [x] `guest_free` - 未登录
  - [x] `user_free` - 已登录但无付费权限
  - [x] `single_paid` - 单次购买
  - [x] `sub_month` - 月订阅
  - [x] `sub_year` - 年订阅

### 4. 前端页面
- [x] `/[locale]/v2/analysis-result` - 结果页
  - [x] Server 端获取 report 和计算 access
  - [x] Client 端根据 `access.hasFullAccess` 渲染内容
  - [x] 免费部分永远展示
  - [x] 加锁部分使用 `LockedSection` 组件
  - [x] 解锁按钮：未登录触发 `signIn`，已登录打开 `UnlockModal`

- [x] `UnlockModal` 组件
  - [x] 三种付费选项：`single`, `sub_month`, `sub_year`
  - [x] 调用 `/api/v2/pay/checkout` 接口

- [x] `LockedSection` 组件
  - [x] 显示锁定提示

### 5. 数据流
- [x] `/api/v2/analyze` - 分析接口
  - [x] 支持匿名用户（`user_id` 可为 `null`）
  - [x] 保存到 `report_v2` 表

- [x] `/api/v2/result/[reportId]` - 获取报告接口
  - [x] 从 `report_v2` 表读取

## 🔍 测试检查点

### 1. 匿名用户流程
- [ ] 匿名用户上传并生成报告
- [ ] 报告页显示免费内容
- [ ] 点击"解锁完整报告" → 跳转登录
- [ ] 登录后返回报告页

### 2. 单次购买流程
- [ ] 已登录用户点击"解锁完整报告"
- [ ] 选择"单次解锁本份报告"
- [ ] 跳转到 Stripe Checkout
- [ ] 支付成功后返回报告页
- [ ] 报告页显示完整内容
- [ ] 检查 `orders` 表：`kind='single'`, `status='paid'`
- [ ] 检查 `report_access` 表：`user_id`, `report_id`

### 3. 订阅流程
- [ ] 已登录用户选择"月度会员"或"年度会员"
- [ ] 跳转到 Stripe Checkout
- [ ] 支付成功后返回报告页
- [ ] 报告页显示完整内容
- [ ] 检查 `subscriptions` 表：`status='active'`, `plan` 正确
- [ ] 检查 `user_profiles` 表：`is_pro=true`, `pro_plan` 正确

### 4. Webhook 处理
- [ ] `checkout.session.completed` 事件处理
  - [ ] 更新 `orders` 表为 `paid`
  - [ ] 单次购买：写入 `report_access`
  - [ ] 订阅：写入 `subscriptions`，更新 `user_profiles`
- [ ] `customer.subscription.updated` 事件处理
  - [ ] 更新 `subscriptions.status`
  - [ ] 如果没有 active 订阅，取消 Pro 状态
- [ ] `invoice.payment_succeeded` 事件处理（续费）
  - [ ] 更新 `subscriptions.current_period_end`
  - [ ] 保持 Pro 状态

### 5. 访问控制
- [ ] `computeV2Access` 正确计算访问级别
- [ ] 免费用户只能看到免费内容
- [ ] 付费用户可以看到完整内容
- [ ] 订阅过期后自动降级为免费用户

## 📝 环境变量检查

确保 `.env.local` 包含：
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [x] `STRIPE_FULL_REPORT_PRICE_ID`
- [x] `STRIPE_PRICE_SUB_MONTH_USD`
- [x] `STRIPE_PRICE_SUB_YEAR_USD`

## 🗄️ 数据库迁移

确保执行以下迁移脚本：
- [x] `migrations/v2_ensure_user_profiles_fields.sql`
- [x] `migrations/v2_ensure_orders_table.sql`
- [x] `migrations/v2_ensure_subscriptions_table.sql`
- [x] `migrations/v2_ensure_report_access_user_id.sql`

## 🚀 准备测试

所有核心功能已实现，可以开始测试完整流程。


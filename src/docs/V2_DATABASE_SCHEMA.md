# V2 数据库表结构规范

## user_profiles（用户画像 / 权益标记）

### 已约定字段

- `is_pro` boolean default false —— 是否任一 Pro 订阅中
- `pro_plan` text —— 当前 Pro 计划：'none' | 'sub_month' | 'sub_year'
- `stripe_customer_id` text —— 绑定到 Stripe Customer

### 迁移脚本

执行 `migrations/v2_ensure_user_profiles_fields.sql` 确保字段存在。

## orders（所有付费记录）

用于统一记账（单次 + 订阅首付 + 续费都可记录）。

### 字段结构

```sql
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount integer not null,               -- 金额（分）
  currency text not null default 'usd',
  kind text not null,                    -- 'single' | 'sub_month' | 'sub_year'
  report_id uuid null,                   -- kind='single' 时必填
  status text not null,                  -- 'pending' | 'paid' | 'failed' | 'refunded'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 约束

- `kind` CHECK: 'single' | 'sub_month' | 'sub_year'
- `status` CHECK: 'pending' | 'paid' | 'failed' | 'refunded'

### 迁移脚本

执行 `migrations/v2_ensure_orders_table.sql` 确保字段存在。

## report_access（单次报告访问权限）

### 字段结构

- `id` uuid primary key
- `report_id` uuid not null
- `user_id` uuid（V2 使用，可为 null 以兼容旧数据）
- `session_id` uuid（兼容旧版）
- `tier` text default 'full'
- `created_at` timestamptz default now()

### 约束

- 部分唯一索引：`(report_id, user_id) WHERE user_id IS NOT NULL`

### 迁移脚本

执行 `migrations/v2_ensure_report_access_user_id.sql` 确保字段存在。

## subscriptions（订阅记录）

### 字段结构

```sql
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  plan text not null,             -- 'sub_month' | 'sub_year'
  status text not null,           -- 'active' | 'canceled' | 'past_due' | 'incomplete'...
  current_period_end timestamptz, -- 订阅到期时间
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 约束

- `plan` CHECK: 'sub_month' | 'sub_year'
- `stripe_subscription_id` UNIQUE

### 迁移脚本

执行 `migrations/v2_ensure_subscriptions_table.sql` 确保字段存在。

## 字段映射关系

### Webhook 处理时的字段映射

- Stripe Checkout Session → orders 表：
  - `session.id` → `stripe_checkout_session_id`
  - `session.payment_intent` → `stripe_payment_intent_id`
  - `session.amount_total` → `amount`（分）
  - `session.currency` → `currency`（小写）
  - `metadata.paymentType` → `kind`（'single' → 'single', 'month' → 'sub_month', 'year' → 'sub_year'）
  - `metadata.reportId` → `report_id`
  - `session.customer` → `user_profiles.stripe_customer_id`

### 权限判定时的字段映射

- `user_profiles.pro_plan` → `planId`：
  - 'sub_month' → 'monthly'
  - 'sub_year' → 'yearly'
  - 'none' → undefined


# Stripe 价格配置指南

## 环境变量配置

在 Vercel 环境变量或 `.env.local` 中设置以下变量：

```bash
NEXT_PUBLIC_STRIPE_PRICE_SINGLE=price_xxx_single_1_99
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_xxx_month_9_99
NEXT_PUBLIC_STRIPE_PRICE_YEARLY=price_xxx_year_99
```

## 在 Stripe Dashboard 创建价格

### 1. 单次解锁（SINGLE）
- **类型**: One-time payment
- **金额**: $1.99 USD
- **产品名称**: SeeQi Pro - Single Unlock
- **描述**: One-time payment to unlock reports
- 创建后复制 Price ID 到 `NEXT_PUBLIC_STRIPE_PRICE_SINGLE`

### 2. 月订阅（MONTHLY）
- **类型**: Recurring subscription
- **计费周期**: Monthly
- **金额**: $9.99 USD
- **产品名称**: SeeQi Pro - Monthly
- **描述**: Monthly subscription, cancel anytime
- 创建后复制 Price ID 到 `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY`

### 3. 年订阅（YEARLY）
- **类型**: Recurring subscription
- **计费周期**: Yearly
- **金额**: $99.00 USD
- **产品名称**: SeeQi Pro - Yearly
- **描述**: Yearly subscription with annual perks
- 创建后复制 Price ID 到 `NEXT_PUBLIC_STRIPE_PRICE_YEARLY`

## 创建步骤

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Products** → **Add product**
3. 为每个方案创建产品并设置价格
4. 复制每个价格的 Price ID（格式：`price_xxxxx`）
5. 将 Price ID 填入对应的环境变量

## 注意事项

- 所有价格使用 USD 货币
- 单次解锁使用 `payment` 模式
- 订阅使用 `subscription` 模式
- 确保在 Stripe Dashboard 中启用 Webhook 以处理订阅事件


## 环境变量配置

在 Vercel 环境变量或 `.env.local` 中设置以下变量：

```bash
NEXT_PUBLIC_STRIPE_PRICE_SINGLE=price_xxx_single_1_99
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_xxx_month_9_99
NEXT_PUBLIC_STRIPE_PRICE_YEARLY=price_xxx_year_99
```

## 在 Stripe Dashboard 创建价格

### 1. 单次解锁（SINGLE）
- **类型**: One-time payment
- **金额**: $1.99 USD
- **产品名称**: SeeQi Pro - Single Unlock
- **描述**: One-time payment to unlock reports
- 创建后复制 Price ID 到 `NEXT_PUBLIC_STRIPE_PRICE_SINGLE`

### 2. 月订阅（MONTHLY）
- **类型**: Recurring subscription
- **计费周期**: Monthly
- **金额**: $9.99 USD
- **产品名称**: SeeQi Pro - Monthly
- **描述**: Monthly subscription, cancel anytime
- 创建后复制 Price ID 到 `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY`

### 3. 年订阅（YEARLY）
- **类型**: Recurring subscription
- **计费周期**: Yearly
- **金额**: $99.00 USD
- **产品名称**: SeeQi Pro - Yearly
- **描述**: Yearly subscription with annual perks
- 创建后复制 Price ID 到 `NEXT_PUBLIC_STRIPE_PRICE_YEARLY`

## 创建步骤

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Products** → **Add product**
3. 为每个方案创建产品并设置价格
4. 复制每个价格的 Price ID（格式：`price_xxxxx`）
5. 将 Price ID 填入对应的环境变量

## 注意事项

- 所有价格使用 USD 货币
- 单次解锁使用 `payment` 模式
- 订阅使用 `subscription` 模式
- 确保在 Stripe Dashboard 中启用 Webhook 以处理订阅事件


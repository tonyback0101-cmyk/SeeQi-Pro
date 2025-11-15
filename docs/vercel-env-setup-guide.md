# Vercel 环境变量配置指南

## 📋 当前配置状态

根据你的 Vercel Dashboard，**已配置**的变量：
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_PUBLISHABLE_KEY`（需要改为 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`）
- ✅ `STRIPE_WEBHOOK_SECRET`

## ❌ 缺失的必需环境变量

根据项目需求，以下变量**必须配置**：

### 1. Supabase 配置（必需）
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. NextAuth 配置（必需）
```
NEXTAUTH_SECRET=your-random-secret-key-至少32字符
NEXTAUTH_URL=https://your-domain.vercel.app
```

### 3. 应用 URL 配置（必需）
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. Stripe 价格 ID（推荐）
```
STRIPE_FULL_REPORT_PRICE_ID=price_xxx
STRIPE_PRICE_REPORT_ONE_USD=price_xxx
STRIPE_PRICE_SUB_MONTH_USD=price_xxx
STRIPE_PRICE_SUB_YEAR_USD=price_xxx
```

## 🔧 配置步骤

### 步骤 1：修复现有变量

1. **重命名 `STRIPE_PUBLISHABLE_KEY`**
   - 点击编辑图标（铅笔）
   - 将 Key 从 `STRIPE_PUBLISHABLE_KEY` 改为 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - 保持 Value 不变
   - 点击保存

### 步骤 2：添加 Supabase 变量

1. 点击 **"+ 添加另一个"** 按钮
2. 依次添加以下变量：

#### SUPABASE_URL
```
钥匙: SUPABASE_URL
价值: https://your-project.supabase.co
环境: 所有环境（或选择 Production）
```

#### SUPABASE_SERVICE_ROLE_KEY
```
钥匙: SUPABASE_SERVICE_ROLE_KEY
价值: [从 Supabase Dashboard 获取]
环境: 所有环境（或选择 Production）
```

#### NEXT_PUBLIC_SUPABASE_URL
```
钥匙: NEXT_PUBLIC_SUPABASE_URL
价值: https://your-project.supabase.co
环境: 所有环境（或选择 Production）
```

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
钥匙: NEXT_PUBLIC_SUPABASE_ANON_KEY
价值: [从 Supabase Dashboard 获取]
环境: 所有环境（或选择 Production）
```

### 步骤 3：添加 NextAuth 变量

#### NEXTAUTH_SECRET
```
钥匙: NEXTAUTH_SECRET
价值: [生成一个至少32字符的随机字符串]
环境: 所有环境（或选择 Production）
```

**生成方法**：
```bash
# 在终端运行
openssl rand -base64 32
```

或者使用在线工具生成随机字符串。

#### NEXTAUTH_URL
```
钥匙: NEXTAUTH_URL
价值: https://your-app.vercel.app
环境: 所有环境（或选择 Production）
```

### 步骤 4：添加应用 URL

#### NEXT_PUBLIC_APP_URL
```
钥匙: NEXT_PUBLIC_APP_URL
价值: https://your-app.vercel.app
环境: 所有环境（或选择 Production）
```

### 步骤 5：保存所有更改

1. 检查所有变量都已正确输入
2. 点击右下角的 **"救"**（Save）按钮
3. 等待保存完成

## 🔑 如何获取密钥

### Supabase 密钥

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → 用于 `SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → 用于 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → 用于 `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 保密，不要公开）

### Stripe 密钥

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Developers** → **API keys**
3. 确认你使用的是：
   - **Test mode** 或 **Live mode**（根据需求）
4. 复制：
   - **Secret key** → 已配置为 `STRIPE_SECRET_KEY` ✅
   - **Publishable key** → 需要改为 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Webhook secret 在 **Developers** → **Webhooks** 中获取 → 已配置 ✅

## ⚠️ 关于 "未创建环境变量" 警告

这个警告可能表示：
1. 某些必需的环境变量尚未配置
2. 变量已配置但未保存
3. 变量配置在错误的环境中（如只在 Preview 中配置，但 Production 需要）

**解决方法**：
1. 确保所有必需变量都已添加
2. 检查环境选择是否正确（建议选择"所有环境"）
3. 点击 **"救"**（Save）按钮保存
4. 触发新的部署使更改生效

## 📝 完整配置清单

配置完成后，确认以下变量都已存在：

### 必需变量（必须配置）
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `STRIPE_SECRET_KEY` ✅
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`（需要重命名）
- [ ] `STRIPE_WEBHOOK_SECRET` ✅

### 推荐变量（功能完整需要）
- [ ] `STRIPE_FULL_REPORT_PRICE_ID`
- [ ] `STRIPE_PRICE_REPORT_ONE_USD`
- [ ] `STRIPE_PRICE_SUB_MONTH_USD`
- [ ] `STRIPE_PRICE_SUB_YEAR_USD`

### 可选变量（增强功能）
- [ ] `ENABLE_SUPABASE_ANALYZE=true`
- [ ] `RULES_BUCKET=rules`
- [ ] `IMAGE_TTL_MINUTES=3`
- [ ] `REPORT_TTL_DAYS=30`

## 🚀 配置完成后的操作

1. **保存所有变量**：点击 **"救"**（Save）按钮
2. **触发新部署**：
   - 方法 1：在 Vercel Dashboard 中手动触发重新部署
   - 方法 2：推送一个空提交到 GitHub：
     ```bash
     git commit --allow-empty -m "trigger redeploy after env vars update"
     git push origin main
     ```
3. **验证部署**：
   - 检查部署日志，确认没有环境变量相关的错误
   - 测试应用功能，确认所有功能正常

## 🔍 验证配置

部署后，检查以下内容：

1. **构建日志**：确认没有环境变量缺失的错误
2. **运行时日志**：检查应用启动是否正常
3. **功能测试**：
   - 用户登录/注册
   - 图片上传
   - 分析功能
   - 支付功能（如果已配置）

## 📞 需要帮助？

如果遇到问题：
1. 查看 `docs/vercel-env-vars-checklist.md` 获取详细说明
2. 检查 Vercel 构建日志中的错误信息
3. 确认所有密钥都已正确复制（没有多余空格）



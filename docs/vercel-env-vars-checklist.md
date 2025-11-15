# Vercel 环境变量配置清单

## 🔴 必需的环境变量（必须配置）

### Supabase 配置
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### NextAuth 配置
```
NEXTAUTH_SECRET=your-random-secret-key-至少32字符
NEXTAUTH_URL=https://your-domain.com (生产环境)
```

### Stripe 配置（已部分配置 ✅）
```
STRIPE_SECRET_KEY=sk_test_... (已配置 ✅)
STRIPE_WEBHOOK_SECRET=whsec_... (已配置 ✅)
STRIPE_PUBLISHABLE_KEY=pk_test_... (已配置 ✅，但需要作为 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
```

### 应用 URL 配置
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
# 或
APP_URL=https://your-domain.vercel.app
```

## 🟡 推荐配置（功能完整需要）

### Stripe 价格 ID（用于订阅和支付）
```
# 单次报告价格
STRIPE_PRICE_REPORT_ONE_USD=price_xxx

# 月度订阅
STRIPE_PRICE_SUB_MONTH_USD=price_xxx

# 年度订阅
STRIPE_PRICE_SUB_YEAR_USD=price_xxx

# 或使用其他命名（代码会尝试多个变量名）
STRIPE_PRO_PRICE_MONTH=price_xxx
STRIPE_PRO_PRICE_YEAR=price_xxx
STRIPE_PRO_PRICE_LIFETIME=price_xxx
STRIPE_FULL_REPORT_PRICE_ID=price_xxx
```

### 规则存储配置（如果使用 Supabase Storage）
```
RULES_BUCKET=rules
RULES_BUCKET_PREFIX=rules
```

## 🟢 可选配置（增强功能）

### 客户端 Stripe 配置
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 其他配置
```
IMAGE_TTL_MINUTES=3
REPORT_TTL_DAYS=30
ENABLE_SUPABASE_ANALYZE=true
```

## 📋 当前状态分析

根据你的 Vercel 配置界面，**已配置**：
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_PUBLISHABLE_KEY` (建议改为 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- ✅ `STRIPE_WEBHOOK_SECRET`

**缺失的必需变量**：
- ❌ `SUPABASE_URL`
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ `NEXTAUTH_SECRET`
- ❌ `NEXT_PUBLIC_APP_URL` 或 `APP_URL`

## 🔧 快速修复步骤

### 1. 在 Vercel Dashboard 中添加缺失的变量

点击"添加另一个"按钮，依次添加：

#### Supabase 变量
```
钥匙: SUPABASE_URL
价值: https://your-project.supabase.co
```

```
钥匙: SUPABASE_SERVICE_ROLE_KEY
价值: your-service-role-key
```

```
钥匙: NEXT_PUBLIC_SUPABASE_URL
价值: https://your-project.supabase.co
```

```
钥匙: NEXT_PUBLIC_SUPABASE_ANON_KEY
价值: your-anon-key
```

#### NextAuth 变量
```
钥匙: NEXTAUTH_SECRET
价值: (生成一个至少32字符的随机字符串)
```

生成方法：
```bash
# 在终端运行
openssl rand -base64 32
```

#### 应用 URL
```
钥匙: NEXT_PUBLIC_APP_URL
价值: https://your-app.vercel.app
```

### 2. 修改现有变量

将 `STRIPE_PUBLISHABLE_KEY` 改为 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`（因为客户端需要访问）

### 3. 点击"保存"按钮

保存后，Vercel 会自动重新部署应用。

## ✅ 验证配置

部署后，检查应用是否正常运行：

1. **检查环境变量警告**：应用启动时会显示缺失的环境变量
2. **测试功能**：
   - 用户登录/注册
   - 支付流程
   - 报告生成

## 🚨 常见问题

### Q: 为什么显示"未创建环境变量"？

**A:** 这个警告通常表示：
1. 有必需的环境变量未配置
2. 环境变量值格式不正确
3. 需要点击"保存"按钮才能生效

### Q: 如何获取 Supabase 密钥？

**A:** 
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制：
   - **Project URL** → `SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 保密）

### Q: 如何获取 Stripe 密钥？

**A:**
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Developers** → **API keys**
3. 复制：
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Webhook secret 在 **Developers** → **Webhooks** 中创建 webhook 后获取

### Q: 环境变量应该配置在哪个环境？

**A:** 
- **生产环境（生产）**：用于生产部署
- **预览环境**：用于 PR 预览（可以使用测试密钥）
- **开发环境**：本地开发使用 `.env.local`

## 📝 完整配置示例

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_SECRET=your-32-char-random-string
NEXTAUTH_URL=https://your-app.vercel.app

# Stripe
STRIPE_SECRET_KEY=sk_test_51SSgiTC9iFiRbx5Z...
STRIPE_WEBHOOK_SECRET=whsec_zn7HcYSTD8020gIGHB94NEXJxABVAoJ4
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SSgiTC9iFiRbx5Z...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Stripe Prices (可选，但推荐配置)
STRIPE_PRICE_REPORT_ONE_USD=price_xxxxx
STRIPE_PRICE_SUB_MONTH_USD=price_xxxxx
STRIPE_PRICE_SUB_YEAR_USD=price_xxxxx
```

## 🔍 检查清单

配置完成后，确认：

- [ ] 所有必需变量已配置
- [ ] 变量名称拼写正确（注意大小写）
- [ ] 变量值格式正确（没有多余空格）
- [ ] 已点击"保存"按钮
- [ ] Vercel 已重新部署
- [ ] 应用启动无错误



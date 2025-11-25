# Supabase 配置清单

## 📋 完整配置清单

### 1. 数据库表结构 ✅

#### 必需的表
- ✅ `report_v2` - 分析报告表（已创建）
- ✅ `orders` - 订单表（已创建）
- ✅ `report_access` - 报告访问权限表（已创建）
- ✅ `user_profiles` - 用户画像表（已创建）
- ✅ `subscriptions` - 订阅表（已创建）

**状态**: ✅ **所有必需的表已创建**

**迁移文件**:
- `migrations/create_report_v2_table.sql`
- `migrations/v2_ensure_orders_table.sql`
- `migrations/v2_ensure_report_access_user_id.sql`
- `migrations/v2_ensure_user_profiles_fields.sql`
- `migrations/v2_ensure_subscriptions_table.sql`

### 2. RLS (Row Level Security) 配置 ⚠️

#### 当前状态
| 表名 | RLS 状态 | 策略数量 | 建议 |
|------|---------|---------|------|
| `report_v2` | ✅ 已启用 | 2 个策略 | 收紧匿名读取策略 |
| `orders` | ❌ 未启用 | 0 | 启用 RLS，添加用户策略 |
| `report_access` | ❌ 未启用 | 0 | 启用 RLS，添加用户策略 |
| `user_profiles` | ❌ 未启用 | 0 | 启用 RLS，添加用户策略 |
| `subscriptions` | ❌ 未启用 | 0 | 启用 RLS，添加用户策略 |

#### 需要执行的迁移
**文件**: `migrations/v2_enable_rls_for_all_tables.sql`

**操作步骤**:
1. 在 Supabase Dashboard → SQL Editor
2. 运行 `migrations/v2_enable_rls_for_all_tables.sql`
3. 验证所有表的 RLS 已启用
4. 验证策略已创建

**优先级**: 🔴 **高优先级**（安全性）

### 3. Storage Buckets 配置 ⚠️

#### 必需的存储桶
1. **`palmprints`** - 掌纹图片存储
   - **用途**: 存储用户上传的掌纹图片
   - **权限**: 必须设置为 **Public**（用于获取 publicUrl）
   - **位置**: `app/api/v2/analyze/route.ts:31`

2. **`tongue`** - 舌象图片存储
   - **用途**: 存储用户上传的舌象图片
   - **权限**: 必须设置为 **Public**（用于获取 publicUrl）
   - **位置**: `app/api/v2/analyze/route.ts:32`

#### 配置步骤
1. 登录 Supabase Dashboard
2. 进入 **Storage** → **Buckets**
3. 创建以下存储桶（如果不存在）:
   - `palmprints` - 设置为 **Public**
   - `tongue` - 设置为 **Public**
4. 验证存储桶权限:
   - ✅ Public bucket（允许公开访问）
   - ✅ 允许上传（通过 service role）

**优先级**: 🔴 **高优先级**（功能必需）

### 4. 邮件模板配置 ⚠️

#### 必需的邮件模板
1. **Magic Link / OTP 邮件**
   - **用途**: 登录验证码邮件
   - **位置**: Supabase Dashboard → Authentication → Email Templates
   - **模板**: "Magic Link" 或 "OTP"

2. **Password Reset 邮件**
   - **用途**: 密码重置邮件
   - **位置**: Supabase Dashboard → Authentication → Email Templates
   - **模板**: "Password Reset"

#### 配置步骤
1. 登录 Supabase Dashboard
2. 进入 **Authentication** → **Email Templates**
3. 检查以下模板:
   - ✅ Magic Link 模板（用于 OTP 登录）
   - ✅ Password Reset 模板（用于密码重置）
4. 自定义邮件内容（可选）:
   - 添加品牌标识
   - 自定义邮件主题和内容
   - 确保包含必要的变量（如验证码、重置链接）

#### 邮件发送设置
- **SMTP 配置**（可选）:
  - 如果使用自定义 SMTP（如 Postmark），需要在 Supabase 中配置
  - 位置: Authentication → Settings → SMTP Settings

**优先级**: 🔴 **高优先级**（用户登录必需）

### 5. 环境变量配置 ✅

#### 必需的 Supabase 环境变量
- ✅ `SUPABASE_URL` - Supabase 项目 URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - 服务角色密钥（用于 server-side 操作）
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - 公共 URL（用于客户端）
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 匿名密钥（用于客户端）

**状态**: ✅ **代码中已检查这些环境变量**

### 6. 数据库索引 ⚠️

#### 检查索引
根据迁移文件，以下表应该有索引：

**`report_v2`**:
- ✅ `idx_report_v2_id`
- ✅ `idx_report_v2_created_at`
- ✅ `idx_report_v2_locale`

**`orders`**:
- ✅ `idx_orders_user_id`
- ✅ `idx_orders_report_id`
- ✅ `idx_orders_status`
- ✅ `idx_orders_kind`
- ✅ `idx_orders_stripe_checkout_session_id`

**`report_access`**:
- ✅ `idx_report_access_user_id`
- ✅ `idx_report_access_report_id`
- ✅ `idx_report_access_session_id`

**`user_profiles`**:
- ✅ `idx_user_profiles_user_id`

**`subscriptions`**:
- ✅ `idx_subscriptions_user_id`
- ✅ `idx_subscriptions_status`
- ✅ `idx_subscriptions_stripe_subscription_id`
- ✅ `idx_subscriptions_stripe_customer_id`

**操作**: 运行迁移文件会自动创建索引

**优先级**: 🟡 **中优先级**（性能优化）

### 7. 外键约束 ⚠️

#### 检查外键
- ✅ `orders.user_id` → `auth.users(id)`
- ✅ `report_access.user_id` → `auth.users(id)`（可为 null）
- ✅ `user_profiles.user_id` → `auth.users(id)`
- ✅ `subscriptions.user_id` → `auth.users(id)`

**状态**: ✅ **迁移文件中已定义外键约束**

### 8. 函数和触发器（如果有）⚠️

#### 检查
- ⚠️ 未找到自定义函数或触发器
- ⚠️ 可能需要添加自动更新时间戳的触发器

**建议**: 检查是否需要添加 `updated_at` 自动更新触发器

**优先级**: 🟢 **低优先级**（可选优化）

## 📊 配置优先级总结

| 配置项 | 优先级 | 状态 | 操作 |
|--------|--------|------|------|
| **Storage Buckets** | 🔴 高 | ⚠️ 需要配置 | 创建 `palmprints` 和 `tongue` 存储桶，设置为 Public |
| **邮件模板** | 🔴 高 | ⚠️ 需要验证 | 检查 Magic Link 和 Password Reset 模板 |
| **RLS 配置** | 🔴 高 | ⚠️ 需要执行 | 运行 `v2_enable_rls_for_all_tables.sql` |
| **数据库索引** | 🟡 中 | ✅ 已定义 | 运行迁移文件自动创建 |
| **外键约束** | 🟡 中 | ✅ 已定义 | 运行迁移文件自动创建 |
| **环境变量** | ✅ 已检查 | ✅ 代码已检查 | 确保在 Vercel 中设置 |

## 🔧 详细操作步骤

### 步骤 1: 创建 Storage Buckets（高优先级）

1. 登录 Supabase Dashboard
2. 进入 **Storage** → **Buckets**
3. 点击 **New bucket**
4. 创建 `palmprints` 存储桶:
   - Name: `palmprints`
   - Public bucket: ✅ **启用**（重要！）
   - File size limit: 10 MB（或根据需要）
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
5. 创建 `tongue` 存储桶:
   - Name: `tongue`
   - Public bucket: ✅ **启用**（重要！）
   - File size limit: 10 MB（或根据需要）
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
6. 验证存储桶已创建且为 Public

### 步骤 2: 配置邮件模板（高优先级）

1. 登录 Supabase Dashboard
2. 进入 **Authentication** → **Email Templates**
3. 检查 **Magic Link** 模板:
   - 确保模板存在
   - 验证变量是否正确（如 `{{ .Token }}`）
   - 测试发送邮件
4. 检查 **Password Reset** 模板:
   - 确保模板存在
   - 验证变量是否正确（如 `{{ .Token }}`）
   - 测试发送邮件
5. （可选）自定义邮件内容:
   - 添加品牌标识
   - 自定义主题和内容

### 步骤 3: 执行 RLS 迁移（高优先级）

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 打开 `migrations/v2_enable_rls_for_all_tables.sql`
4. 复制 SQL 内容
5. 在 SQL Editor 中执行
6. 验证执行结果:
   - 检查所有表的 RLS 已启用
   - 检查策略已创建
7. 测试 server-side 写入仍然正常工作

### 步骤 4: 验证环境变量（中优先级）

1. 在 Vercel Dashboard 中检查环境变量:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 确保所有变量都已设置且正确

### 步骤 5: 验证数据库表（中优先级）

1. 在 Supabase Dashboard → Table Editor 中检查:
   - `report_v2` 表存在
   - `orders` 表存在
   - `report_access` 表存在
   - `user_profiles` 表存在
   - `subscriptions` 表存在
2. 验证表结构正确（字段、类型、约束）

## ✅ 配置检查清单

### Storage Buckets
- [ ] 创建 `palmprints` 存储桶
- [ ] 设置 `palmprints` 为 Public
- [ ] 创建 `tongue` 存储桶
- [ ] 设置 `tongue` 为 Public
- [ ] 测试图片上传功能

### 邮件模板
- [ ] 检查 Magic Link 模板存在
- [ ] 检查 Password Reset 模板存在
- [ ] 测试登录 OTP 邮件发送
- [ ] 测试密码重置邮件发送
- [ ] （可选）自定义邮件内容

### RLS 配置
- [ ] 运行 `v2_enable_rls_for_all_tables.sql` 迁移
- [ ] 验证 `report_v2` RLS 已启用
- [ ] 验证 `orders` RLS 已启用
- [ ] 验证 `report_access` RLS 已启用
- [ ] 验证 `user_profiles` RLS 已启用
- [ ] 验证 `subscriptions` RLS 已启用
- [ ] 验证所有策略已创建
- [ ] 测试 server-side 写入仍然正常工作

### 数据库表
- [ ] 验证 `report_v2` 表存在
- [ ] 验证 `orders` 表存在
- [ ] 验证 `report_access` 表存在
- [ ] 验证 `user_profiles` 表存在
- [ ] 验证 `subscriptions` 表存在
- [ ] 验证所有索引已创建
- [ ] 验证所有外键约束已创建

### 环境变量
- [ ] `SUPABASE_URL` 已设置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已设置
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已设置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已设置

## 🎯 关键注意事项

### 1. Storage Buckets 必须是 Public
- ⚠️ **重要**: `palmprints` 和 `tongue` 存储桶必须设置为 **Public**
- 原因: 代码使用 `getPublicUrl()` 获取图片 URL，需要公开访问
- 如果存储桶不是 Public，图片 URL 将无法直接访问

### 2. RLS 策略不影响 Service Role
- ✅ Service Role 自动绕过所有 RLS 策略
- ✅ Server-side 写入不会受到影响
- ⚠️ 但建议启用 RLS 以保护用户数据

### 3. 邮件模板变量
- 确保邮件模板中包含正确的变量（如 `{{ .Token }}`）
- 测试邮件发送以确保模板正常工作

### 4. 迁移执行顺序
- 建议先执行表创建迁移
- 然后执行 RLS 配置迁移
- 最后验证所有配置


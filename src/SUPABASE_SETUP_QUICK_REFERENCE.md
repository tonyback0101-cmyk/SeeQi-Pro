# Supabase 配置快速参考清单

## 🎯 必须配置的项目（高优先级）

### 1. Storage Buckets ⚠️ **必须配置**

#### 需要创建的存储桶
1. **`palmprints`** - 掌纹图片存储
   - ✅ 设置为 **Public**（重要！）
   - ✅ 允许上传（通过 service role）

2. **`tongue`** - 舌象图片存储
   - ✅ 设置为 **Public**（重要！）
   - ✅ 允许上传（通过 service role）

#### 操作步骤
1. Supabase Dashboard → **Storage** → **Buckets**
2. 点击 **New bucket**
3. 创建 `palmprints`（Public ✅）
4. 创建 `tongue`（Public ✅）

### 2. 邮件模板 ⚠️ **必须验证**

#### 需要检查的模板
1. **Magic Link / OTP 邮件**
   - 位置: Authentication → Email Templates
   - 用途: 登录验证码

2. **Password Reset 邮件**
   - 位置: Authentication → Email Templates
   - 用途: 密码重置

#### 操作步骤
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. 检查 Magic Link 模板存在
3. 检查 Password Reset 模板存在
4. 测试邮件发送

### 3. RLS 配置 ⚠️ **建议执行**

#### 需要执行的迁移
**文件**: `migrations/v2_enable_rls_for_all_tables.sql`

#### 操作步骤
1. Supabase Dashboard → **SQL Editor**
2. 运行 `migrations/v2_enable_rls_for_all_tables.sql`
3. 验证所有表的 RLS 已启用

## 📋 完整配置清单

### ✅ 数据库表（已创建）
- [x] `report_v2` - 分析报告表
- [x] `orders` - 订单表
- [x] `report_access` - 报告访问权限表
- [x] `user_profiles` - 用户画像表
- [x] `subscriptions` - 订阅表

### ⚠️ Storage Buckets（需要配置）
- [ ] `palmprints` - 掌纹图片（必须 Public）
- [ ] `tongue` - 舌象图片（必须 Public）

### ⚠️ 邮件模板（需要验证）
- [ ] Magic Link / OTP 模板
- [ ] Password Reset 模板

### ⚠️ RLS 配置（建议执行）
- [ ] 运行 `v2_enable_rls_for_all_tables.sql`
- [ ] 验证所有表的 RLS 已启用
- [ ] 验证策略已创建

### ✅ 环境变量（代码已检查）
- [x] `SUPABASE_URL`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 详细操作指南

### 步骤 1: 创建 Storage Buckets（5 分钟）

```
1. 登录 Supabase Dashboard
2. Storage → Buckets → New bucket
3. 创建 palmprints（Public ✅）
4. 创建 tongue（Public ✅）
```

### 步骤 2: 验证邮件模板（5 分钟）

```
1. Authentication → Email Templates
2. 检查 Magic Link 模板
3. 检查 Password Reset 模板
4. 测试发送邮件
```

### 步骤 3: 执行 RLS 迁移（10 分钟）

```
1. SQL Editor
2. 运行 migrations/v2_enable_rls_for_all_tables.sql
3. 验证执行结果
```

## ⚠️ 关键注意事项

1. **Storage Buckets 必须是 Public**
   - 代码使用 `getPublicUrl()`，需要公开访问
   - 如果存储桶不是 Public，图片 URL 将无法访问

2. **RLS 不影响 Service Role**
   - Service Role 自动绕过 RLS
   - Server-side 写入不会受到影响

3. **邮件模板变量**
   - 确保模板包含正确的变量（如 `{{ .Token }}`）

## 📊 配置状态总结

| 配置项 | 状态 | 优先级 | 预计时间 |
|--------|------|--------|----------|
| Storage Buckets | ⚠️ 需要配置 | 🔴 高 | 5 分钟 |
| 邮件模板 | ⚠️ 需要验证 | 🔴 高 | 5 分钟 |
| RLS 配置 | ⚠️ 建议执行 | 🔴 高 | 10 分钟 |
| 数据库表 | ✅ 已创建 | - | - |
| 环境变量 | ✅ 已检查 | - | - |

## ✅ 快速检查清单

- [ ] `palmprints` 存储桶已创建且为 Public
- [ ] `tongue` 存储桶已创建且为 Public
- [ ] Magic Link 邮件模板存在
- [ ] Password Reset 邮件模板存在
- [ ] RLS 迁移已执行
- [ ] 所有环境变量已设置


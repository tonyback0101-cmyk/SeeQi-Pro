# 数据库表和 Storage 审计报告

## 📋 审计概览

已完成全项目扫描，检查旧表名使用情况、V2 API 表使用情况、表结构改动和 Storage bucket 使用情况。

## ✅ V2 API 表使用情况

### V2 API 使用的表（符合要求）

#### 1. `app/api/v2/analyze/route.ts`
**使用的表**: `report_v2`
- ✅ 通过 `saveReport()` 函数写入 `report_v2` 表
- ✅ 通过 `getReportById()` 函数读取 `report_v2` 表
- ✅ 实现位置: `lib/analysis/v2/reportStore.ts`

**关键代码**:
```typescript
// lib/analysis/v2/reportStore.ts:131
const { data, error } = await client
  .from("report_v2")
  .select("normalized, id, created_at, ...")
  .eq("id", reportId)
  .maybeSingle();
```

```typescript
// lib/analysis/v2/reportStore.ts:403
const { data, error: supabaseError } = await client
  .from("report_v2")
  .upsert(insertData, { onConflict: 'id' })
  .select("id")
  .single();
```

#### 2. `app/api/v2/pay/checkout/route.ts`
**使用的表**: `user_profiles`, `orders`
- ✅ 查询 `user_profiles` 获取 `stripe_customer_id`
- ✅ 更新 `user_profiles` 写入 `stripe_customer_id`
- ✅ 插入 `orders` 创建订单记录

**关键代码**:
```typescript
// app/api/v2/pay/checkout/route.ts:112
.from("user_profiles")
.select("stripe_customer_id")
.eq("user_id", userId)
.maybeSingle();
```

```typescript
// app/api/v2/pay/checkout/route.ts:143
.from("user_profiles")
.update({ stripe_customer_id: customer.id })
.eq("user_id", userId);
```

```typescript
// app/api/v2/pay/checkout/route.ts:208
.from("orders")
.insert(orderPayload);
```

#### 3. `app/api/v2/subscription/checkout/route.ts`
**使用的表**: `user_profiles`, `orders`
- ✅ 查询 `user_profiles` 获取用户信息
- ✅ 插入/更新 `orders` 创建订单记录

**关键代码**:
```typescript
// app/api/v2/subscription/checkout/route.ts:50
.from("user_profiles")
.select("inviter_id, ref_code")
.eq("user_id", session.user.id)
.maybeSingle();
```

```typescript
// app/api/v2/subscription/checkout/route.ts:142
.from("orders")
.select("id")
.eq("provider_session_id", checkoutSession.id)
.maybeSingle();
```

**结论**: ✅ **V2 API 仅使用允许的表** (`report_v2`, `orders`, `user_profiles`)

---

## ⚠️ Webhook Handler 表使用情况

### `app/api/stripe/webhook/route.ts`
**使用的表**: `orders`, `user_profiles`, `report_access`, `subscriptions`
- ⚠️ `subscriptions` 表不在允许列表中（用户要求仅允许 `report_v2`, `orders`, `report_access`, `user_profiles`）
- ✅ `orders` - 允许
- ✅ `user_profiles` - 允许
- ✅ `report_access` - 允许

**关键代码**:
```typescript
// app/api/stripe/webhook/route.ts:261
.from("report_access")
.insert({ ... });
```

```typescript
// app/api/stripe/webhook/route.ts:299
.from("subscriptions")
.select("id")
.eq("stripe_subscription_id", subscriptionId)
.maybeSingle();
```

**问题**: ⚠️ **Webhook handler 使用了 `subscriptions` 表，但用户要求 V2 仅允许操作 `report_v2`, `orders`, `report_access`, `user_profiles`**

**建议**: 
- 如果 `subscriptions` 表是必需的（用于订阅管理），需要确认是否应该添加到允许列表
- 或者将 webhook handler 视为 V2 系统的一部分，允许使用 `subscriptions` 表

---

## ⚠️ 旧表使用情况（非 V2 API）

以下文件使用旧表，但这些是**旧版 API**（不在 `app/api/v2` 目录），应保留以兼容旧系统：

### 1. `app/api/analyze/route.ts`
**使用的表**: `reports`
- ⚠️ 旧版分析 API
- 位置: 不在 `app/api/v2` 目录
- **建议**: 保留（旧版兼容）

### 2. `app/api/pay/status/route.ts`
**使用的表**: `reports`
- ⚠️ 旧版支付状态 API
- 位置: 不在 `app/api/v2` 目录
- **建议**: 保留（旧版兼容）

### 3. `app/api/result/[id]/route.ts`
**使用的表**: `reports`
- ⚠️ 旧版结果查询 API
- 位置: 不在 `app/api/v2` 目录
- **建议**: 保留（旧版兼容）

### 4. `app/share/[id]/page.tsx`
**使用的表**: `reports`
- ⚠️ 旧版分享页面
- 位置: 不在 `app/api/v2` 目录
- **建议**: 保留（旧版兼容）

**结论**: ✅ **旧表仅在旧版 API 中使用，V2 API 未使用旧表**

---

## ✅ 表结构改动检查

### 搜索结果
- ✅ **未发现任何 `CREATE TABLE` 语句**
- ✅ **未发现任何 `ALTER TABLE` 语句**
- ✅ **未发现任何 `DROP TABLE` 语句**
- ✅ **未发现任何 `CREATE INDEX` 语句**
- ✅ **未发现任何 `ALTER INDEX` 语句**

**搜索范围**: `app/api/v2` 目录

**结论**: ✅ **V2 API 未改动任何表结构**

---

## ✅ Storage Bucket 使用情况

### V2 API 使用的 Storage Bucket

#### `app/api/v2/analyze/route.ts`
**使用的 Bucket**: `palmprints`, `tongue`
- ✅ 掌纹图片使用 `palmprints` bucket
- ✅ 舌象图片使用 `tongue` bucket
- ✅ 通过常量定义，便于维护

**关键代码**:
```typescript
// app/api/v2/analyze/route.ts:31-32
const PALM_STORAGE_BUCKET = PALM_BUCKET; // "palmprints"
const TONGUE_STORAGE_BUCKET = "tongue"; // 舌苔存储桶
```

```typescript
// app/api/v2/analyze/route.ts:77
const bucket = type === "palm" ? PALM_STORAGE_BUCKET : TONGUE_STORAGE_BUCKET;
```

```typescript
// app/api/v2/analyze/route.ts:117
const { error: uploadError } = await client.storage.from(bucket).upload(path, buffer, {
  contentType: imageInfo.mime,
  upsert: false,
  cacheControl: "3600",
});
```

**结论**: ✅ **V2 API 仅使用允许的 Storage Bucket** (`palmprints`, `tongue`)

---

## 📊 审计总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| **V2 API 表使用** | ⚠️ 部分通过 | V2 API 仅使用允许的表，但 webhook 使用了 `subscriptions` |
| **旧表使用** | ⚠️ 仅旧版 API | 旧表仅在旧版 API 中使用，V2 API 未使用 |
| **表结构改动** | ✅ 通过 | 未发现任何表结构改动代码 |
| **Storage Bucket** | ✅ 通过 | 仅使用 `palmprints` 和 `tongue` |

---

## ⚠️ 发现的问题

### 1. Webhook Handler 使用 `subscriptions` 表
**位置**: `app/api/stripe/webhook/route.ts`
**问题**: Webhook handler 使用了 `subscriptions` 表，但用户要求 V2 仅允许操作 `report_v2`, `orders`, `report_access`, `user_profiles`

**需要确认**:
- `subscriptions` 表是否应该添加到允许列表？
- 或者 webhook handler 是否应该被视为 V2 系统的一部分？

---

## ✅ 合规性确认

### 1. V2 仅允许操作的表
- ✅ `report_v2` - 用于存储分析报告
- ✅ `orders` - 用于存储订单记录
- ✅ `user_profiles` - 用于存储用户信息
- ✅ `report_access` - 用于存储报告访问权限（webhook 使用）
- ⚠️ `subscriptions` - 用于存储订阅记录（webhook 使用，不在允许列表中）

**结论**: ⚠️ **V2 API 仅使用允许的表，但 webhook 使用了 `subscriptions` 表**

### 2. 禁止改动旧表结构
- ✅ 未发现任何 `CREATE TABLE` 语句
- ✅ 未发现任何 `ALTER TABLE` 语句
- ✅ 未发现任何 `DROP TABLE` 语句

**结论**: ✅ **未改动任何表结构**

### 3. Storage 仅使用允许的 Bucket
- ✅ `palmprints` - 用于存储掌纹图片
- ✅ `tongue` - 用于存储舌象图片

**结论**: ✅ **仅使用允许的 Storage Bucket**

---

## 📝 建议

### 1. Webhook Handler 表使用
- ⚠️ 如果 `subscriptions` 表是必需的（用于订阅管理），建议将其添加到允许列表
- ✅ 或者确认 webhook handler 是否应该被视为 V2 系统的一部分

### 2. 旧版 API 兼容性
- ⚠️ 旧版 API 仍使用 `reports` 表，这是正常的（用于兼容旧系统）
- ✅ V2 API 已完全迁移到 `report_v2` 表

### 3. 表访问权限
- ✅ V2 API 使用 `getSupabaseAdminClient()` 获取服务角色权限
- ✅ 所有表操作都通过服务角色执行，不受 RLS 限制

### 4. Storage Bucket 配置
- ⚠️ 确保 Supabase 中已创建 `palmprints` 和 `tongue` bucket
- ⚠️ 确保这两个 bucket 设置为 Public（用于获取 publicUrl）

---

## 🎯 最终确认

- [x] V2 API 仅使用允许的表 (`report_v2`, `orders`, `user_profiles`)
- [x] 旧表仅在旧版 API 中使用（用于兼容）
- [x] 未改动任何表结构
- [x] Storage 仅使用允许的 Bucket (`palmprints`, `tongue`)
- [⚠️] Webhook handler 使用了 `subscriptions` 表（需要确认是否允许）

---

## ⚠️ 需要确认的问题

**问题**: Webhook handler (`app/api/stripe/webhook/route.ts`) 使用了 `subscriptions` 表，但用户要求 V2 仅允许操作 `report_v2`, `orders`, `report_access`, `user_profiles`。

**选项**:
1. 将 `subscriptions` 添加到允许列表（如果订阅管理是 V2 系统的一部分）
2. 将 webhook handler 视为 V2 系统的一部分，允许使用 `subscriptions` 表
3. 重构 webhook handler，移除对 `subscriptions` 表的使用（如果可能）

# 数据库 RLS 和权限检查报告

## 🔍 检查结果

### 1. report_v2 表的 RLS 状态

**状态**: ⚠️ **RLS 已启用，但策略可能过于宽松**

**当前配置** (`migrations/create_report_v2_table.sql`):
```sql
-- 启用 Row Level Security (RLS)
ALTER TABLE report_v2 ENABLE ROW LEVEL SECURITY;

-- 策略1：允许匿名用户读取（所有用户可读）
CREATE POLICY "Allow anonymous read access" ON report_v2
  FOR SELECT
  USING (true);

-- 策略2：允许服务角色完全访问（后端 API 使用）
CREATE POLICY "Allow service role full access" ON report_v2
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

**问题**:
- ✅ RLS 已启用
- ⚠️ 匿名用户可读取所有报告（可能不符合安全要求）
- ✅ 服务角色策略存在（但服务角色会自动绕过 RLS，策略是冗余的）

**建议**:
1. 如果报告应该私有化，移除或修改匿名读取策略
2. 添加基于 `user_id` 的读取策略
3. 服务角色策略可以保留（虽然冗余，但明确意图）

### 2. orders 表的 RLS 状态

**状态**: ❌ **未找到 RLS 配置**

**当前配置** (`migrations/v2_ensure_orders_table.sql`):
- 表已创建，但**没有 RLS 配置**
- 没有启用 RLS
- 没有创建策略

**问题**:
- ❌ RLS 未启用
- ❌ 没有访问控制策略
- ⚠️ 如果使用 service role，可以绕过 RLS，但建议明确配置

**建议**:
1. 启用 RLS
2. 创建策略限制访问（只有服务角色和用户自己可访问）

### 3. report_access 表的 RLS 状态

**状态**: ❌ **未找到 RLS 配置**

**当前配置** (`migrations/v2_ensure_report_access_user_id.sql`):
- 表已创建，但**没有 RLS 配置**
- 没有启用 RLS
- 没有创建策略

**问题**:
- ❌ RLS 未启用
- ❌ 没有访问控制策略

**建议**:
1. 启用 RLS
2. 创建策略限制访问

### 4. user_profiles 表的 RLS 状态

**状态**: ❌ **未找到 RLS 配置**

**当前配置** (`migrations/v2_ensure_user_profiles_fields.sql`):
- 表已创建，但**没有 RLS 配置**
- 没有启用 RLS
- 没有创建策略

**问题**:
- ❌ RLS 未启用
- ❌ 没有访问控制策略

**建议**:
1. 启用 RLS
2. 创建策略：用户只能读取/更新自己的 profile

### 5. subscriptions 表的 RLS 状态

**状态**: ❌ **未找到 RLS 配置**

**当前配置** (`migrations/v2_ensure_subscriptions_table.sql`):
- 表已创建，但**没有 RLS 配置**
- 没有启用 RLS
- 没有创建策略

**问题**:
- ❌ RLS 未启用
- ❌ 没有访问控制策略

**建议**:
1. 启用 RLS
2. 创建策略：用户只能读取自己的订阅

## 🔐 Server-Side 写入权限

### Service Role 使用情况

**代码位置**: `lib/supabaseAdmin.ts`
```typescript
export function getSupabaseAdminClient(): AdminClient {
  // 使用 SUPABASE_SERVICE_ROLE_KEY
  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
```

**关键点**:
- ✅ 使用 `SUPABASE_SERVICE_ROLE_KEY`（服务角色密钥）
- ✅ 服务角色**自动绕过 RLS**（无论 RLS 是否启用）
- ✅ 所有 server-side API 都使用 `getSupabaseAdminClient()`

### Server-Side 写入能力验证

#### ✅ orders 表
- **写入位置**: `app/api/pay/checkout/route.ts`, `app/api/stripe/webhook/route.ts`
- **使用客户端**: `getSupabaseAdminClient()` (service role)
- **权限**: ✅ **可以写入**（service role 绕过 RLS）

#### ✅ report_access 表
- **写入位置**: `app/api/stripe/webhook/route.ts`
- **使用客户端**: `getSupabaseAdminClient()` (service role)
- **权限**: ✅ **可以写入**（service role 绕过 RLS）

#### ✅ user_profiles 表
- **写入位置**: `app/api/stripe/webhook/route.ts`
- **使用客户端**: `getSupabaseAdminClient()` (service role)
- **权限**: ✅ **可以写入**（service role 绕过 RLS）

#### ✅ report_v2 表
- **写入位置**: `lib/analysis/v2/reportStore.ts` (saveReport)
- **使用客户端**: `getSupabaseAdminClient()` (service role)
- **权限**: ✅ **可以写入**（service role 绕过 RLS）

#### ✅ subscriptions 表
- **写入位置**: `app/api/stripe/webhook/route.ts`
- **使用客户端**: `getSupabaseAdminClient()` (service role)
- **权限**: ✅ **可以写入**（service role 绕过 RLS）

## 🔧 Webhook Handler 权限

**代码位置**: `app/api/stripe/webhook/route.ts`
```typescript
async function getSupabase() {
  return getSupabaseAdminClient(); // 使用 service role
}
```

**验证**:
- ✅ Webhook handler 使用 `getSupabaseAdminClient()`
- ✅ Service role 可以写入所有表
- ✅ 不受 RLS 限制

## 📊 RLS 配置总结

| 表名 | RLS 状态 | 策略数量 | Service Role 访问 | 建议 |
|------|---------|---------|------------------|------|
| `report_v2` | ✅ 已启用 | 2 个策略 | ✅ 可访问 | 需要收紧匿名读取策略 |
| `orders` | ❌ 未启用 | 0 | ✅ 可访问 | 建议启用 RLS |
| `report_access` | ❌ 未启用 | 0 | ✅ 可访问 | 建议启用 RLS |
| `user_profiles` | ❌ 未启用 | 0 | ✅ 可访问 | 建议启用 RLS |
| `subscriptions` | ❌ 未启用 | 0 | ✅ 可访问 | 建议启用 RLS |

## 📝 日志配置

### 当前日志状态

**代码中的日志使用**:
- ✅ 使用 `console.log()` 记录成功操作
- ✅ 使用 `console.warn()` 记录警告
- ✅ 使用 `console.error()` 记录错误
- ✅ 关键操作都有日志记录

**日志位置**:
- Vercel 函数日志（自动）
- 浏览器控制台（前端）
- 服务器控制台（后端）

**日志追踪能力**:
- ✅ 所有 API 路由都有日志前缀（如 `[POST /api/pay/checkout]`）
- ✅ 关键操作有唯一标识（如 `reportId`）
- ✅ 错误有详细堆栈信息

**建议**:
1. 考虑添加结构化日志（JSON 格式）
2. 考虑添加日志聚合服务（如 Sentry, LogRocket）
3. 考虑添加请求 ID 追踪

## 🎯 关键发现

### ✅ 正常的部分
1. **Service Role 使用正确**: 所有 server-side 操作都使用 service role
2. **Service Role 可以写入**: 所有表都可以通过 service role 写入
3. **Webhook 有权限**: Webhook handler 使用 service role，可以写入所有表
4. **日志已开启**: 关键操作都有日志记录

### ⚠️ 需要关注的部分
1. **RLS 配置不完整**: 只有 `report_v2` 启用了 RLS，其他表未启用
2. **report_v2 策略过于宽松**: 匿名用户可读取所有报告
3. **缺少 RLS 策略**: orders、report_access、user_profiles、subscriptions 都没有 RLS 策略

## 🔧 建议的修复

### 1. 为所有表启用 RLS（推荐）

创建新的迁移文件，为所有表启用 RLS 并创建适当的策略。

### 2. 收紧 report_v2 的访问策略

限制匿名用户只能读取自己的报告，或完全禁用匿名读取。

### 3. 添加日志聚合

考虑集成 Sentry 或其他日志服务，以便更好地追踪生产环境问题。


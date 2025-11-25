# RLS 和权限配置总结

## 📋 快速回答

### 1. report_v2 是否有 RLS？是否关闭？

**答案**: ✅ **RLS 已启用，未关闭**

- RLS 状态：**已启用** (`ALTER TABLE report_v2 ENABLE ROW LEVEL SECURITY`)
- 当前策略：
  - `Allow anonymous read access` - 允许所有用户读取（过于宽松）
  - `Allow service role full access` - 允许服务角色完全访问
- **问题**: 匿名用户可读取所有报告，建议收紧策略

### 2. orders、report_access、user_profiles 是否都能被 server-side 写入？

**答案**: ✅ **都可以被 server-side 写入**

**原因**:
- 所有 server-side 代码使用 `getSupabaseAdminClient()`
- 该函数使用 `SUPABASE_SERVICE_ROLE_KEY`（服务角色密钥）
- **Service Role 自动绕过所有 RLS 策略**
- 因此，即使 RLS 未启用，service role 仍然可以写入所有表

**验证**:
- ✅ `orders` - 写入位置：`app/api/pay/checkout/route.ts`, `app/api/stripe/webhook/route.ts`
- ✅ `report_access` - 写入位置：`app/api/stripe/webhook/route.ts`
- ✅ `user_profiles` - 写入位置：`app/api/stripe/webhook/route.ts`
- ✅ `report_v2` - 写入位置：`lib/analysis/v2/reportStore.ts`
- ✅ `subscriptions` - 写入位置：`app/api/stripe/webhook/route.ts`

### 3. webhook handler 是否有写权限？

**答案**: ✅ **有完整的写权限**

**验证**:
- Webhook handler 使用 `getSupabaseAdminClient()` (service role)
- Service role 可以写入所有表
- 不受 RLS 限制

**代码位置**: `app/api/stripe/webhook/route.ts:24-26`
```typescript
async function getSupabase() {
  return getSupabaseAdminClient(); // service role
}
```

### 4. RLS 是否配置了 allow service role？

**答案**: ⚠️ **部分配置，但不必要**

**说明**:
- Service Role **自动绕过所有 RLS 策略**（Supabase 内置行为）
- 即使没有策略，service role 也可以访问所有表
- `report_v2` 表有策略 `Allow service role full access`，但这是冗余的
- 其他表（orders、report_access、user_profiles、subscriptions）没有 RLS 策略，但 service role 仍然可以访问

**建议**:
- 策略可以保留（明确意图，文档化）
- 但更重要的是为普通用户（anon/authenticated）创建适当的策略

### 5. 日志（log）是否开启并可追踪？

**答案**: ✅ **已开启，可追踪**

**日志配置**:
- ✅ 使用 `console.log()` 记录成功操作
- ✅ 使用 `console.warn()` 记录警告
- ✅ 使用 `console.error()` 记录错误
- ✅ 所有 API 路由都有统一的前缀格式（如 `[POST /api/pay/checkout]`）
- ✅ 关键操作都有唯一标识（如 `reportId`）
- ✅ 错误有详细堆栈信息

**日志位置**:
- Vercel 函数日志（自动收集）
- 浏览器控制台（前端）
- 服务器控制台（后端）

**示例日志格式**:
```
[POST /api/pay/checkout] Order successfully saved
[POST /api/pay/checkout] order upsert failed after retries
[LLM] proxy success { duration: 1234, model: "gpt-4o-mini" }
[V2 ANALYZE] Palm feature extraction failed, fallback applied
```

**建议**:
- 考虑添加结构化日志（JSON 格式）
- 考虑添加日志聚合服务（如 Sentry, LogRocket）
- 考虑添加请求 ID 追踪（便于关联同一请求的所有日志）

## 🔧 当前状态总结

| 表名 | RLS 状态 | Service Role 写入 | 普通用户策略 | 建议 |
|------|---------|-----------------|------------|------|
| `report_v2` | ✅ 已启用 | ✅ 可写入 | ⚠️ 过于宽松 | 收紧匿名读取策略 |
| `orders` | ❌ 未启用 | ✅ 可写入 | ❌ 无策略 | 启用 RLS，添加用户策略 |
| `report_access` | ❌ 未启用 | ✅ 可写入 | ❌ 无策略 | 启用 RLS，添加用户策略 |
| `user_profiles` | ❌ 未启用 | ✅ 可写入 | ❌ 无策略 | 启用 RLS，添加用户策略 |
| `subscriptions` | ❌ 未启用 | ✅ 可写入 | ❌ 无策略 | 启用 RLS，添加用户策略 |

## ✅ 结论

### 生产环境可用性
- ✅ **所有 server-side 写入都可以正常工作**（service role 绕过 RLS）
- ✅ **Webhook handler 有完整权限**
- ✅ **日志已开启并可追踪**

### 安全建议
- ⚠️ **建议为所有表启用 RLS**（即使 service role 可以绕过）
- ⚠️ **收紧 report_v2 的匿名读取策略**（当前过于宽松）
- ⚠️ **为普通用户创建适当的访问策略**（保护用户数据）

### 已创建的修复文件
- ✅ `migrations/v2_enable_rls_for_all_tables.sql` - 为所有表启用 RLS 并创建策略
- ✅ `DATABASE_RLS_AND_PERMISSIONS_CHECK.md` - 详细的检查报告

## 🚀 下一步行动

1. **立即执行**（不影响功能）:
   - 运行 `migrations/v2_enable_rls_for_all_tables.sql` 迁移
   - 验证所有 server-side 写入仍然正常工作

2. **建议执行**（提高安全性）:
   - 收紧 `report_v2` 的匿名读取策略
   - 测试普通用户的访问权限

3. **可选优化**（提高可观测性）:
   - 集成日志聚合服务
   - 添加请求 ID 追踪


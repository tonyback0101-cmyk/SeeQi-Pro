# Base URL、Runtime 和速率配置总结

## 📋 快速回答

### 1. Base URL 是否正确？

**答案**: ✅ **配置正确**

#### LLM Proxy Base URL
- **优先级**: `VERCEL_URL` > `NEXT_PUBLIC_APP_URL` > 开发环境 fallback > 生产环境 fallback
- **状态**: ✅ 有合理的 fallback 机制
- **位置**: `lib/llm/service.ts:22-36`

#### Stripe Checkout Base URL
- **配置**: `NEXT_PUBLIC_APP_URL` (fallback: `https://seeqipro.vercel.app`)
- **状态**: ✅ 配置正确
- **位置**: `app/api/pay/checkout/route.ts:34-36`

#### OpenAI API Base URL
- **配置**: `PENAI_BASE_URL` > `OPENAI_BASE_URL` > `https://api.openai.com`
- **状态**: ✅ 支持自定义 Base URL
- **位置**: `app/api/llm/chat/route.ts:3`

**建议**: 确保生产环境设置了 `NEXT_PUBLIC_APP_URL`

### 2. Key 是否生效？

**答案**: ✅ **都有检查机制**

#### OpenAI API Key
- **检查**: ✅ 存在性检查，缺失时返回 500 错误
- **位置**: `app/api/llm/chat/route.ts:37-44`

#### Stripe Secret Key
- **检查**: ✅ 存在性检查，缺失时返回 500 错误
- **位置**: `app/api/pay/checkout/route.ts:72-81`

#### Stripe Webhook Secret
- **检查**: ✅ 占位值检查，未配置时返回 500 错误
- **位置**: `app/api/stripe/webhook/route.ts:22, 647-650`

#### Supabase Service Role Key
- **检查**: ✅ 占位值检查
- **位置**: `lib/supabaseAdmin.ts:23-25`

**建议**: 确保所有 Key 在生产环境正确配置

### 3. Edge Runtime 是否开启？

**答案**: ✅ **部分开启（LLM API）**

#### Edge Runtime 使用情况
- ✅ `app/api/llm/chat/route.ts` - **Edge Runtime**（快速响应）
- ✅ `app/api/reports/share/card/route.tsx` - **Edge Runtime**
- ❌ 其他 API 路由 - **Node.js Runtime**（需要更多功能）

**说明**:
- Edge Runtime 适合轻量级、快速响应的 API
- Node.js Runtime 适合需要长时间运行或使用 Node.js 特定功能的 API
- **当前配置合理**: LLM 代理使用 Edge Runtime，分析、支付等复杂操作使用 Node.js Runtime

### 4. 速率是否看起来正常（5s / 10s 阈值）？

**答案**: ⚠️ **超时时间较长，需要优化**

#### LLM API 超时
- **当前**: 30 秒（`LLM_TIMEOUT_MS`）
- **期望**: 5-10 秒
- **状态**: ⚠️ **超出阈值**
- **位置**: `app/api/llm/chat/route.ts:4`

#### 分析 API 最大执行时间
- **当前**: 60 秒（`maxDuration`）
- **期望**: 5-10 秒
- **状态**: ⚠️ **超出阈值**
- **位置**: `app/api/v2/analyze/route.ts:35`
- **说明**: 这是函数最大执行时间，不是超时时间

#### 前端超时控制
- **当前**: 65 秒（略大于服务器 60 秒超时）
- **期望**: 5-10 秒
- **状态**: ⚠️ **超出阈值**
- **位置**: `app/[locale]/analyze/page.tsx:248-250`

#### 重试延迟
- **配置**: 指数退避（500ms, 1000ms, 1500ms）
- **状态**: ✅ **配置合理**

#### 速率限制
- **状态**: ❌ **未配置**
- **建议**: 考虑添加 API 速率限制

## 📊 配置总结

| 配置项 | 当前值 | 期望值 | 状态 | 建议 |
|--------|--------|--------|------|------|
| **Base URL** | ✅ 正确 | - | ✅ | 保持 |
| **Key 检查** | ✅ 有检查 | - | ✅ | 保持 |
| **Edge Runtime** | ✅ 已启用（LLM） | - | ✅ | 保持 |
| **LLM 超时** | 30s | 5-10s | ⚠️ | 降低到 10-15s |
| **分析 API 最大执行时间** | 60s | 5-10s | ⚠️ | 添加内部超时（30-40s） |
| **前端超时** | 65s | 5-10s | ⚠️ | 降低到 10-15s |
| **速率限制** | ❌ 未配置 | 需要 | ❌ | 添加 |

## 🔧 建议的修复

### 1. 降低 LLM 超时时间（推荐）

**文件**: `app/api/llm/chat/route.ts`
```typescript
// 从 30 秒降低到 10 秒
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "10000", 10);
```

### 2. 为分析 API 添加内部超时（推荐）

**文件**: `app/api/v2/analyze/route.ts`
```typescript
// 添加内部超时控制（30-40 秒）
const ANALYZE_TIMEOUT_MS = 30000; // 30 秒内部超时
// 在关键步骤添加超时检查
```

### 3. 降低前端超时（推荐）

**文件**: `app/[locale]/analyze/page.tsx`
```typescript
// 从 65 秒降低到 15 秒（略大于服务器超时）
const timeoutId = setTimeout(() => controller.abort(), 15000);
```

### 4. 添加速率限制（可选）

考虑使用 Vercel 的速率限制功能或添加自定义中间件。

## ✅ 结论

### 生产环境可用性
- ✅ **Base URL 配置正确**
- ✅ **Key 检查机制完善**
- ✅ **Edge Runtime 已启用（LLM API）**

### 需要优化
- ⚠️ **超时时间较长**（30-60 秒，期望 5-10 秒）
- ⚠️ **缺少速率限制**

### 优先级
1. **高优先级**: 降低 LLM 超时时间（30s → 10s）
2. **高优先级**: 降低前端超时（65s → 15s）
3. **中优先级**: 为分析 API 添加内部超时（30-40s）
4. **低优先级**: 添加速率限制


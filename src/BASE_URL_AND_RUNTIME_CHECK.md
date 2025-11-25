# Base URL 和 Runtime 配置检查报告

## 🔍 检查结果

### 1. Base URL 是否正确？

#### ✅ LLM Proxy Base URL
**位置**: `lib/llm/service.ts:22-36`
```typescript
function getLLMProxyUrl(): string {
  // 优先使用 VERCEL_URL（Vercel 自动提供）
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/llm/chat`;
  }
  // 其次使用 NEXT_PUBLIC_APP_URL（如果配置了）
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/llm/chat`;
  }
  // 开发环境 fallback
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/api/llm/chat";
  }
  // 生产环境 fallback
  return "https://seeqi.app/api/llm/chat";
}
```

**状态**: ✅ **配置正确**
- 优先级：`VERCEL_URL` > `NEXT_PUBLIC_APP_URL` > 开发环境 fallback > 生产环境 fallback
- Vercel 部署时自动提供 `VERCEL_URL`
- 有合理的 fallback 机制

#### ✅ Stripe Checkout Base URL
**位置**: `app/api/pay/checkout/route.ts:34-36`
```typescript
function resolveAppUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
  return baseUrl.replace(/\/$/, "");
}
```

**状态**: ✅ **配置正确**
- 使用 `NEXT_PUBLIC_APP_URL` 环境变量
- 有 fallback 值 `https://seeqipro.vercel.app`
- 自动移除尾部斜杠

#### ✅ OpenAI API Base URL
**位置**: `app/api/llm/chat/route.ts:3`
```typescript
const BASE_URL = process.env.PENAI_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
```

**状态**: ✅ **配置正确**
- 支持自定义 Base URL（`PENAI_BASE_URL` 或 `OPENAI_BASE_URL`）
- 默认使用 OpenAI 官方 API：`https://api.openai.com`

**建议**:
- 确保生产环境设置了 `NEXT_PUBLIC_APP_URL`
- 确保 Vercel 环境变量正确配置

### 2. Key 是否生效？

#### ✅ OpenAI API Key
**位置**: `app/api/llm/chat/route.ts:37-44`
```typescript
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[LLM] proxy error: Missing OPENAI_API_KEY");
    return NextResponse.json(
      { error: "llm_proxy_failed", message: "LLM service not configured" },
      { status: 500 }
    );
  }
  // ...
}
```

**状态**: ✅ **有检查机制**
- 检查 `OPENAI_API_KEY` 是否存在
- 如果不存在，返回明确的错误信息

#### ✅ Stripe Secret Key
**位置**: `app/api/pay/checkout/route.ts:72-81`
```typescript
// 检查 Stripe 配置
if (!process.env.STRIPE_SECRET_KEY) {
  return NextResponse.json(
    {
      error: checkoutLocale === "zh" 
        ? "Stripe 支付未配置，请在环境变量中设置 STRIPE_SECRET_KEY"
        : "Stripe payment not configured. Please set STRIPE_SECRET_KEY in environment variables",
    },
    { status: 500 },
  );
}
```

**状态**: ✅ **有检查机制**
- 检查 `STRIPE_SECRET_KEY` 是否存在
- 如果不存在，返回明确的错误信息

#### ✅ Stripe Webhook Secret
**位置**: `app/api/stripe/webhook/route.ts:22, 647-650`
```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "placeholder-webhook-secret";

export async function POST(req: Request) {
  // 运行时检查：如果使用占位值，说明环境变量未配置
  if (webhookSecret === "placeholder-webhook-secret") {
    return new Response("STRIPE_WEBHOOK_SECRET 未配置", { status: 500 });
  }
  // ...
}
```

**状态**: ✅ **有检查机制**
- 检查 `STRIPE_WEBHOOK_SECRET` 是否为占位值
- 如果未配置，返回明确的错误信息

#### ✅ Supabase Service Role Key
**位置**: `lib/supabaseAdmin.ts:23-25`
```typescript
const serviceRoleKey = getSupabaseServiceRoleKey();

if (!url || !serviceRoleKey || url.includes("placeholder.supabase.co") || serviceRoleKey === "placeholder-key") {
  // 占位值检查
}
```

**状态**: ✅ **有检查机制**
- 检查是否为占位值
- 运行时会在使用前验证

**建议**:
- 确保所有 Key 在生产环境正确配置
- 考虑添加启动时的环境变量验证脚本

### 3. Edge Runtime 是否开启？

#### ✅ LLM Chat API
**位置**: `app/api/llm/chat/route.ts:6`
```typescript
export const runtime = "edge";
```

**状态**: ✅ **已启用 Edge Runtime**
- 使用 Edge Runtime 可以提高响应速度
- 支持超时控制（`AbortController`）

#### ⚠️ 其他 API 路由
**状态**: 大部分使用 `nodejs` runtime

**Edge Runtime 使用情况**:
- ✅ `app/api/llm/chat/route.ts` - Edge Runtime
- ✅ `app/api/reports/share/card/route.tsx` - Edge Runtime
- ❌ 其他 API 路由 - Node.js Runtime

**说明**:
- Edge Runtime 适合轻量级、快速响应的 API
- Node.js Runtime 适合需要长时间运行或使用 Node.js 特定功能的 API（如文件处理、数据库操作）

**当前配置合理**:
- LLM 代理使用 Edge Runtime（快速响应）
- 分析、支付等复杂操作使用 Node.js Runtime（需要更多功能）

### 4. 速率是否看起来正常（5s / 10s 阈值）？

#### ✅ LLM API 超时配置
**位置**: `app/api/llm/chat/route.ts:4`
```typescript
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "30000", 10); // 默认 30 秒
```

**状态**: ⚠️ **超时时间较长（30秒）**
- 当前配置：30 秒
- 用户期望：5s / 10s 阈值
- **建议**: 考虑降低到 10-15 秒

#### ✅ 分析 API 超时配置
**位置**: `app/api/v2/analyze/route.ts:35`
```typescript
export const maxDuration = 60; // Vercel 函数最大执行时间
```

**状态**: ⚠️ **超时时间较长（60秒）**
- 当前配置：60 秒（Vercel Pro plan）
- 用户期望：5s / 10s 阈值
- **说明**: 这是函数最大执行时间，不是超时时间
- **建议**: 考虑添加内部超时控制（如 30-40 秒）

#### ✅ 重试延迟配置
**位置**: `app/api/pay/checkout/route.ts:288`
```typescript
// 等待后重试（指数退避）
await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
```

**状态**: ✅ **配置合理**
- 第1次重试：500ms
- 第2次重试：1000ms
- 第3次重试：1500ms
- 总计：最多 3 秒延迟

#### ⚠️ 缺少速率限制
**状态**: ❌ **没有发现明确的速率限制配置**

**建议**:
- 考虑添加 API 速率限制（rate limiting）
- 考虑添加请求队列（防止并发过多）
- 考虑添加超时控制（确保响应时间在阈值内）

## 📊 配置总结

| 配置项 | 当前值 | 期望值 | 状态 | 建议 |
|--------|--------|--------|------|------|
| LLM 超时 | 30s | 5-10s | ⚠️ | 降低到 10-15s |
| 分析 API 最大执行时间 | 60s | 5-10s | ⚠️ | 添加内部超时（30-40s） |
| Edge Runtime | ✅ 已启用（LLM） | - | ✅ | 保持 |
| Base URL 配置 | ✅ 正确 | - | ✅ | 保持 |
| Key 检查 | ✅ 有检查 | - | ✅ | 保持 |
| 速率限制 | ❌ 未配置 | 需要 | ❌ | 添加 |

## 🔧 建议的修复

### 1. 降低 LLM 超时时间
```typescript
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "10000", 10); // 改为 10 秒
```

### 2. 为分析 API 添加内部超时
```typescript
// 在分析流程中添加超时控制
const ANALYZE_TIMEOUT_MS = 30000; // 30 秒内部超时
```

### 3. 添加速率限制
考虑使用 Vercel 的速率限制功能或添加自定义中间件。


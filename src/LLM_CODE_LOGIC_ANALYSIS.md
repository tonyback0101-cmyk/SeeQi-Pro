# LLM 调用代码逻辑全面分析

## 🔍 完整调用链分析

### 1. 入口：`/api/v2/analyze` 路由
**文件**: `app/api/v2/analyze/route.ts`

#### 1.1 环境检查（第170-209行）
```typescript
const isProduction = process.env.NODE_ENV === "production";
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

// 生产环境：OPENAI_API_KEY 缺失时直接返回错误
if (isProduction && !hasOpenAIKey) {
  return errorResponse("LLM服务未配置，无法生成分析报告。请联系管理员。", 500);
}

// 生产环境：禁止使用 mock 模式
if (isProduction && useMockAnalysis) {
  return errorResponse("配置错误：生产环境不允许使用mock模式", 500);
}
```

**检查点**:
- ✅ 生产环境必须配置 `OPENAI_API_KEY`
- ✅ 生产环境禁止使用 `USE_MOCK_ANALYSIS`

---

### 2. LLM 调用层：`lib/llm/service.ts`

#### 2.1 `callLLMViaProxy()` 函数（第48-124行）
**作用**: 统一入口，调用内部代理路由 `/api/llm/chat`

**关键逻辑**:
```typescript
async function callLLMViaProxy(params): Promise<string> {
  // 1. 检查 OPENAI_API_KEY
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("LLM API key not configured...");
  }
  
  // 2. 获取代理 URL
  const proxyUrl = getLLMProxyUrl();
  
  // 3. 调用代理路由
  const response = await fetch(proxyUrl, {...});
  
  // 4. 检查响应
  if (!response.ok) {
    throw new Error(`LLM proxy error: ...`);
  }
  
  // 5. 返回内容
  return content;
}
```

**错误处理**:
- ✅ 如果 `OPENAI_API_KEY` 缺失，抛出错误
- ✅ 如果网络请求失败，抛出错误
- ✅ 如果响应不成功，抛出错误
- ✅ 如果内容为空，记录警告但不抛出错误

---

#### 2.2 `getLLMProxyUrl()` 函数（第23-43行）
**作用**: 构建 LLM 代理路由的绝对 URL

**关键逻辑**:
```typescript
function getLLMProxyUrl(): string {
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
  
  if (isDev) {
    // 开发环境：使用 localhost
    const devPort = process.env.PORT || "3001";
    return `http://localhost:${devPort}/api/llm/chat`;
  }
  
  // 生产环境：使用环境变量构建 URL
  const baseUrl = getInternalAppUrl(); // 需要 NEXTAUTH_URL_INTERNAL 等
  return `${baseUrl}/api/llm/chat`;
}
```

**依赖环境变量**:
- 开发环境: `PORT` (可选，默认 3001)
- 生产环境: `NEXTAUTH_URL_INTERNAL` 或 `NEXTAUTH_URL` 或 `NEXT_PUBLIC_APP_URL`

---

#### 2.3 LLM 解读函数（已修复）

##### 2.3.1 `interpretPalmWithLLM()` (第1043-1080行)
**修复前问题**: 内部 catch 错误并返回 fallback，外层无法检测失败

**修复后逻辑**:
```typescript
export async function interpretPalmWithLLM(...): Promise<PalmInsight> {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    const raw = await callLLMViaProxy({ system, user });
    return safeParsePalmInsight(raw, archetype, locale);
  } catch (error) {
    // 生产环境：重新抛出错误
    if (isProduction) {
      throw error;
    }
    // 开发环境：返回 fallback
    return { summary: [...], bullets: [...] };
  }
}
```

##### 2.3.2 `interpretTongueWithLLM()` (第1367-1396行)
**修复逻辑**: 同 `interpretPalmWithLLM()`

##### 2.3.3 `interpretDreamWithLLM()` (第1810-1841行)
**修复逻辑**: 同 `interpretPalmWithLLM()`

##### 2.3.4 `interpretPalmWealthWithLLM()` (第776-833行)
**修复逻辑**: 同 `interpretPalmWithLLM()`

---

### 3. 代理路由：`/api/llm/chat`
**文件**: `app/api/llm/chat/route.ts`

#### 3.1 路由处理（第36-105行）
**关键逻辑**:
```typescript
export async function POST(req: NextRequest) {
  // 1. 检查 API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "llm_proxy_failed" }, { status: 500 });
  }
  
  // 2. 构建 Base URL
  const BASE_URL = process.env.PENAI_BASE_URL 
    ?? process.env.OPENAI_BASE_URL 
    ?? "https://api.openai.com";
  
  // 3. 调用 OpenAI API
  const res = await fetchWithTimeout(
    `${BASE_URL}/v1/chat/completions`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    LLM_TIMEOUT_MS
  );
  
  // 4. 检查响应
  if (!res.ok) {
    return NextResponse.json({ error: "llm_proxy_failed" }, { status: 500 });
  }
  
  // 5. 返回数据
  return NextResponse.json(data);
}
```

**依赖环境变量**:
- `OPENAI_API_KEY` (必需)
- `PENAI_BASE_URL` (可选，优先级最高)
- `OPENAI_BASE_URL` (可选，优先级第二)
- `LLM_TIMEOUT_MS` (可选，默认 12000)

---

## 🔄 完整调用流程

### 开发环境流程
```
1. /api/v2/analyze
   ├─ 检查 OPENAI_API_KEY (仅记录警告)
   ├─ 调用 interpretPalmWithLLM()
   │  ├─ callLLMViaProxy()
   │  │  ├─ getLLMProxyUrl() → "http://localhost:3001/api/llm/chat"
   │  │  └─ fetch(proxyUrl)
   │  │     └─ /api/llm/chat
   │  │        ├─ 检查 OPENAI_API_KEY
   │  │        ├─ fetch("https://api.openai.com/v1/chat/completions")
   │  │        └─ 返回响应
   │  └─ 如果失败 → 返回 fallback (开发环境允许)
   └─ 继续处理其他 LLM 调用
```

### 生产环境流程
```
1. /api/v2/analyze
   ├─ 检查 OPENAI_API_KEY (缺失则返回 500)
   ├─ 调用 interpretPalmWithLLM()
   │  ├─ callLLMViaProxy()
   │  │  ├─ getLLMProxyUrl() → getInternalAppUrl() + "/api/llm/chat"
   │  │  │  └─ 需要: NEXTAUTH_URL_INTERNAL 或 NEXTAUTH_URL 或 NEXT_PUBLIC_APP_URL
   │  │  └─ fetch(proxyUrl)
   │  │     └─ /api/llm/chat
   │  │        ├─ 检查 OPENAI_API_KEY
   │  │        ├─ fetch(BASE_URL + "/v1/chat/completions")
   │  │        └─ 返回响应
   │  └─ 如果失败 → 抛出错误 (生产环境不允许 fallback)
   └─ 外层 catch 错误 → 返回 500 错误
```

---

## ⚠️ 关键修复点

### 修复 1: LLM 函数内部 fallback 问题
**问题**: `interpretPalmWithLLM` 等函数在内部 catch 错误并返回 fallback，导致外层无法检测失败

**修复**: 在生产环境中，如果 LLM 调用失败，重新抛出错误而不是返回 fallback

**影响**:
- ✅ 生产环境：LLM 失败时会抛出错误，外层可以捕获并返回 500
- ✅ 开发环境：仍然允许 fallback，方便调试

---

### 修复 2: `_llm_usage` 标记逻辑
**问题**: `palmLLMCalled = true` 在 try 块开始就设置，即使失败也会标记为 true

**修复**: 只有在 LLM 真正成功返回有效数据后才标记为 true

**代码**:
```typescript
let palmLLMSuccess = false;
try {
  palmInsight = await interpretPalmWithLLM(...);
  if (palmInsight && (palmInsight.summary?.length > 0 || palmInsight.bullets?.length > 0)) {
    palmLLMSuccess = true; // 只有成功才标记
  } else {
    throw new Error("LLM returned empty or invalid response");
  }
} catch (error) {
  // 生产环境：抛出错误
  if (isProduction) {
    throw error;
  }
  // 开发环境：fallback
}
```

---

### 修复 3: 生产环境错误处理
**问题**: 生产环境 LLM 失败时会 fallback 到规则引擎

**修复**: 生产环境 LLM 失败时直接返回错误，不允许 fallback

**代码**:
```typescript
// 生产环境：LLM调用失败时返回错误，不允许fallback
if (isProduction) {
  throw new Error(`掌纹分析失败：${error.message}`);
}
```

---

## ✅ 验证检查点

### 检查点 1: 环境变量配置
- [ ] `OPENAI_API_KEY` 已设置
- [ ] 生产环境 `NODE_ENV=production`
- [ ] 生产环境至少设置一个 URL 变量（`NEXTAUTH_URL_INTERNAL` / `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`）

### 检查点 2: LLM 调用成功
- [ ] 日志中出现 `[LLM] proxy success`
- [ ] 返回数据中 `_llm_usage.palm = true`
- [ ] 返回数据中 `_llm_usage.tongue = true`
- [ ] 返回数据中 `_llm_usage.dream = true`

### 检查点 3: LLM 调用失败（生产环境）
- [ ] 日志中出现 `[ANALYZE_V2][LLM]` 错误
- [ ] 返回 500 错误，而不是 fallback 数据
- [ ] 错误消息明确说明 LLM 服务不可用

### 检查点 4: LLM 调用失败（开发环境）
- [ ] 日志中出现 `[V2 Analyze] Falling back to rule-based` 警告
- [ ] 返回数据中 `_llm_usage` 为 `false`
- [ ] 仍然返回报告（使用规则引擎 fallback）

---

## 📊 调用链图

```
用户请求
  ↓
POST /api/v2/analyze
  ↓
环境检查 (OPENAI_API_KEY, NODE_ENV)
  ↓
分析图片 (palm, tongue, dream)
  ↓
调用 interpretPalmWithLLM()
  ↓
  ├─ callLLMViaProxy()
  │  ↓
  │  getLLMProxyUrl()
  │  ↓
  │  ├─ 开发: http://localhost:3001/api/llm/chat
  │  └─ 生产: {NEXTAUTH_URL_INTERNAL}/api/llm/chat
  │  ↓
  │  fetch(proxyUrl)
  │  ↓
  │  POST /api/llm/chat
  │  ↓
  │  检查 OPENAI_API_KEY
  │  ↓
  │  fetch(BASE_URL + "/v1/chat/completions")
  │  ↓
  │  OpenAI API
  │  ↓
  │  返回响应
  │  ↓
  │  解析响应
  │  ↓
  │  返回内容
  │
  └─ 如果失败:
     ├─ 生产环境: 抛出错误 → 返回 500
     └─ 开发环境: 返回 fallback → 继续处理
```

---

## 🎯 总结

### 关键修复
1. ✅ LLM 函数在生产环境中失败时抛出错误（不再静默 fallback）
2. ✅ `_llm_usage` 标记只有在真正成功时才为 `true`
3. ✅ 生产环境 OPENAI_API_KEY 缺失时直接返回错误
4. ✅ 生产环境禁止使用 mock 模式

### 配置要求
1. **必需**: `OPENAI_API_KEY`
2. **生产环境必需**: `NODE_ENV=production` + 至少一个 URL 变量
3. **可选**: `PENAI_BASE_URL` / `OPENAI_BASE_URL` / `LLM_TIMEOUT_MS`

### 验证方法
1. 检查日志中的 `[LLM] proxy success` 消息
2. 检查返回数据中的 `_llm_usage` 字段
3. 生产环境失败时应该返回 500 错误，而不是 fallback 数据


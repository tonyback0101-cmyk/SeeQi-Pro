# LLM 正常调用配置检查清单

## 📋 必需环境变量（生产环境）

### 1. `OPENAI_API_KEY` ⚠️ **必需**
- **作用**: OpenAI API 认证密钥
- **格式**: `sk-...` (以 `sk-` 开头)
- **检查位置**:
  - `app/api/llm/chat/route.ts` (第37行)
  - `lib/llm/service.ts` (第58行)
  - `app/api/v2/analyze/route.ts` (第173行)
- **验证方法**:
  ```bash
  # 检查环境变量是否存在
  echo $OPENAI_API_KEY | head -c 7  # 应该显示 "sk-xxx"
  ```
- **生产环境行为**: 如果缺失，会返回 500 错误，不会 fallback 到规则引擎

---

## 📋 生产环境 URL 配置（必需）

### 2. `NEXTAUTH_URL_INTERNAL` ⚠️ **生产环境必需**
- **作用**: 服务端内部访问 URL（用于 LLM 代理路由）
- **格式**: `https://your-domain.com` (完整 URL，包含协议)
- **检查位置**: `lib/env/urls.ts` (第42-46行)
- **优先级**: 1 (最高)
- **用途**: `lib/llm/service.ts` 中的 `getLLMProxyUrl()` 函数使用

### 3. `NEXTAUTH_URL` ⚠️ **生产环境必需（如果 NEXTAUTH_URL_INTERNAL 未设置）**
- **作用**: NextAuth 对外暴露的绝对 URL
- **格式**: `https://your-domain.com`
- **检查位置**: `lib/env/urls.ts` (第32-36行)
- **优先级**: 2 (如果 NEXTAUTH_URL_INTERNAL 未设置)
- **用途**: 作为 `getInternalAppUrl()` 的 fallback

### 4. `NEXT_PUBLIC_APP_URL` ⚠️ **生产环境必需（如果上述两个都未设置）**
- **作用**: 对外可见的应用 URL
- **格式**: `https://your-domain.com`
- **检查位置**: `lib/env/urls.ts` (第22-26行)
- **优先级**: 3 (最后 fallback)
- **用途**: 作为 `getInternalAppUrl()` 的最后 fallback

**⚠️ 重要**: 生产环境中，`getInternalAppUrl()` 必须能解析到有效的 URL，否则 LLM 代理路由无法构建正确的 URL。

---

## 📋 可选环境变量

### 5. `PENAI_BASE_URL` (可选，优先级最高)
- **作用**: PenAI 代理 Base URL（如果使用 PenAI 代理服务）
- **格式**: `https://api.penai.com` 或自定义代理 URL
- **检查位置**: `app/api/llm/chat/route.ts` (第3行)
- **优先级**: 1 (最高)
- **默认值**: 如果未设置，使用 `OPENAI_BASE_URL` 或 `https://api.openai.com`

### 6. `OPENAI_BASE_URL` (可选，优先级第二)
- **作用**: 自定义 OpenAI Base URL（如果使用自定义代理）
- **格式**: `https://api.openai.com` 或自定义代理 URL
- **检查位置**: `app/api/llm/chat/route.ts` (第3行)
- **优先级**: 2
- **默认值**: 如果未设置，使用 `https://api.openai.com`

### 7. `LLM_TIMEOUT_MS` (可选)
- **作用**: LLM 请求超时时间（毫秒）
- **格式**: 数字字符串，如 `"12000"` (12秒)
- **检查位置**: `app/api/llm/chat/route.ts` (第4行)
- **默认值**: `12000` (12秒)
- **建议值**: 12000-30000 (12-30秒)

### 8. `PORT` (开发环境可选)
- **作用**: 开发服务器端口号
- **格式**: 数字字符串，如 `"3001"`
- **检查位置**: `lib/llm/service.ts` (第27行)
- **默认值**: `"3001"`
- **用途**: 仅用于开发环境，构建 LLM 代理 URL

### 9. `NODE_ENV` (生产环境必需)
- **作用**: 环境标识（development / production）
- **格式**: `"production"` 或 `"development"`
- **检查位置**: 
  - `app/api/v2/analyze/route.ts` (第172行)
  - `lib/llm/service.ts` (第25行)
- **生产环境**: 必须设置为 `"production"`

### 10. `USE_MOCK_ANALYSIS` (仅开发环境，默认关闭)
- **作用**: 启用 mock 分析模式（仅用于开发调试）
- **格式**: `"1"` 或未设置
- **检查位置**: `app/api/v2/analyze/route.ts` (第196行)
- **⚠️ 重要**: 生产环境禁止使用，即使设置为 `"1"` 也会被拒绝

---

## 🔍 代码检查点

### 检查点 1: `/api/llm/chat` 路由
**文件**: `app/api/llm/chat/route.ts`

1. **第3行**: Base URL 配置
   ```typescript
   const BASE_URL = process.env.PENAI_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
   ```
   - ✅ 检查: `PENAI_BASE_URL` 或 `OPENAI_BASE_URL` 是否正确设置
   - ✅ 验证: 如果使用自定义代理，URL 是否正确

2. **第37行**: API Key 检查
   ```typescript
   const apiKey = process.env.OPENAI_API_KEY;
   if (!apiKey) {
     return NextResponse.json({ error: "llm_proxy_failed", message: "LLM service not configured" }, { status: 500 });
   }
   ```
   - ✅ 检查: `OPENAI_API_KEY` 是否存在
   - ✅ 验证: 如果缺失，会返回 500 错误

3. **第50-61行**: 实际 API 调用
   ```typescript
   const res = await fetchWithTimeout(
     `${BASE_URL}/v1/chat/completions`,
     {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${apiKey}`,
       },
       body: JSON.stringify(body),
     },
     LLM_TIMEOUT_MS
   );
   ```
   - ✅ 检查: `BASE_URL` 是否正确
   - ✅ 检查: `Authorization` header 是否正确设置
   - ✅ 验证: 请求是否成功（`res.ok`）

---

### 检查点 2: LLM 服务调用
**文件**: `lib/llm/service.ts`

1. **第23-42行**: `getLLMProxyUrl()` 函数
   ```typescript
   function getLLMProxyUrl(): string {
     const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
     if (isDev) {
       const devPort = process.env.PORT || "3001";
       const devUrl = `http://localhost:${devPort}/api/llm/chat`;
       return devUrl;
     }
     
     // 生产环境
     const baseUrl = getInternalAppUrl();
     const url = `${baseUrl}/api/llm/chat`;
     return url;
   }
   ```
   - ✅ **开发环境**: 检查 `PORT` 环境变量（默认 3001）
   - ✅ **生产环境**: 检查 `getInternalAppUrl()` 是否能正确解析 URL
     - 需要: `NEXTAUTH_URL_INTERNAL` 或 `NEXTAUTH_URL` 或 `NEXT_PUBLIC_APP_URL`

2. **第58行**: API Key 检查
   ```typescript
   if (!process.env.OPENAI_API_KEY) {
     throw new Error("LLM API key not configured. Please set OPENAI_API_KEY in environment variables.");
   }
   ```
   - ✅ 检查: `OPENAI_API_KEY` 是否存在

---

### 检查点 3: 分析路由
**文件**: `app/api/v2/analyze/route.ts`

1. **第172-193行**: 环境检查
   ```typescript
   const isProduction = process.env.NODE_ENV === "production";
   const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
   
   if (isProduction && !hasOpenAIKey) {
     return errorResponse("LLM服务未配置，无法生成分析报告。请联系管理员。", 500, "PROCESSING_FAILED");
   }
   ```
   - ✅ **生产环境**: 如果 `OPENAI_API_KEY` 缺失，直接返回 500 错误
   - ✅ **开发环境**: 允许继续执行（但 LLM 调用会失败）

2. **第196-203行**: Mock 模式检查
   ```typescript
   const useMockAnalysis = process.env.USE_MOCK_ANALYSIS === "1" && !isProduction;
   if (isProduction && useMockAnalysis) {
     return errorResponse("配置错误：生产环境不允许使用mock模式", 500, "PROCESSING_FAILED");
   }
   ```
   - ✅ 检查: 生产环境禁止使用 mock 模式

3. **第488-527行**: 掌纹 LLM 调用
   - ✅ 检查: LLM 调用是否成功
   - ✅ 验证: `palmLLMSuccess` 标记是否正确设置
   - ✅ **生产环境**: 如果失败，会抛出错误（不会 fallback）

4. **第541-580行**: 舌象 LLM 调用
   - ✅ 检查: LLM 调用是否成功
   - ✅ 验证: `tongueLLMSuccess` 标记是否正确设置
   - ✅ **生产环境**: 如果失败，会抛出错误（不会 fallback）

5. **第590-629行**: 梦境 LLM 调用
   - ✅ 检查: LLM 调用是否成功
   - ✅ 验证: `dreamLLMSuccess` 标记是否正确设置
   - ✅ **生产环境**: 如果失败，会抛出错误（不会 fallback）

6. **第673-710行**: 财富线 LLM 调用
   - ✅ 检查: LLM 调用是否成功
   - ✅ **生产环境**: 如果失败，会抛出错误（不会 fallback）

7. **第730-732行**: `_llm_usage` 标记
   ```typescript
   _llm_usage: {
     palm: palmLLMSuccess,
     tongue: tongueLLMSuccess,
     dream: dreamLLMSuccess,
   },
   ```
   - ✅ 验证: 只有在 LLM 真正成功调用后才标记为 `true`

---

## 🧪 验证步骤

### 步骤 1: 检查环境变量
```bash
# 检查必需的环境变量
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:7}..."  # 应该显示 "sk-xxx..."
echo "NODE_ENV: $NODE_ENV"  # 生产环境应该是 "production"
echo "NEXTAUTH_URL_INTERNAL: $NEXTAUTH_URL_INTERNAL"  # 生产环境必需
echo "NEXTAUTH_URL: $NEXTAUTH_URL"  # 生产环境必需（如果 NEXTAUTH_URL_INTERNAL 未设置）
echo "NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"  # 生产环境必需（如果上述两个都未设置）

# 检查可选的环境变量
echo "PENAI_BASE_URL: $PENAI_BASE_URL"  # 可选
echo "OPENAI_BASE_URL: $OPENAI_BASE_URL"  # 可选
echo "LLM_TIMEOUT_MS: $LLM_TIMEOUT_MS"  # 可选，默认 12000
```

### 步骤 2: 检查代码日志
在分析请求时，检查以下日志：

1. **开发环境日志**:
   ```
   [V2 Analyze] Environment check { hasOpenAIKey: true, ... }
   [LLM] Using development URL { devUrl: "http://localhost:3001/api/llm/chat", ... }
   [V2 Analyze] Calling LLM for palm interpretation...
   [LLM] Calling LLM proxy { url: "http://localhost:3001/api/llm/chat", ... }
   [LLM] proxy success { duration: 1234, model: "gpt-4o-mini", usage: {...} }
   [V2 Analyze] LLM palm interpretation successful { usedLLM: true }
   ```

2. **生产环境日志**:
   ```
   [LLM] Resolved LLM proxy URL { baseUrl: "https://your-domain.com", url: "https://your-domain.com/api/llm/chat" }
   [V2 Analyze] Calling LLM for palm interpretation...
   [LLM] Calling LLM proxy { url: "https://your-domain.com/api/llm/chat", ... }
   [LLM] proxy success { duration: 1234, model: "gpt-4o-mini", usage: {...} }
   [V2 Analyze] LLM palm interpretation successful { usedLLM: true }
   ```

3. **错误日志**:
   ```
   [ANALYZE_V2][LLM] CRITICAL: OPENAI_API_KEY not configured in production!
   [LLM] proxy error: Missing OPENAI_API_KEY
   [ANALYZE_V2][LLM] Palm LLM call failed { errorMessage: "...", isProduction: true }
   ```

### 步骤 3: 验证 LLM 调用结果
检查返回的 JSON 中的 `_llm_usage` 字段：
```json
{
  "normalized": {
    "_llm_usage": {
      "palm": true,    // 只有在 LLM 真正成功调用后才为 true
      "tongue": true,  // 只有在 LLM 真正成功调用后才为 true
      "dream": true    // 只有在 LLM 真正成功调用后才为 true
    }
  }
}
```

---

## 📝 配置示例

### 开发环境配置（`.env.local`）
```bash
# 必需
OPENAI_API_KEY=sk-xxx...

# 可选
PORT=3001
LLM_TIMEOUT_MS=12000

# 如果使用自定义代理
# PENAI_BASE_URL=https://api.penai.com
# 或
# OPENAI_BASE_URL=https://api.openai.com
```

### 生产环境配置（Vercel / 服务器环境变量）
```bash
# 必需
OPENAI_API_KEY=sk-xxx...
NODE_ENV=production

# URL 配置（至少设置一个）
NEXTAUTH_URL_INTERNAL=https://your-domain.com
# 或
NEXTAUTH_URL=https://your-domain.com
# 或
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 可选
LLM_TIMEOUT_MS=12000

# 如果使用自定义代理
# PENAI_BASE_URL=https://api.penai.com
# 或
# OPENAI_BASE_URL=https://api.openai.com
```

---

## ⚠️ 常见问题排查

### 问题 1: LLM 调用失败，返回 500 错误
**可能原因**:
1. `OPENAI_API_KEY` 未设置或无效
2. `BASE_URL` 配置错误（如果使用自定义代理）
3. 网络连接问题
4. API 配额超限

**排查步骤**:
1. 检查 `OPENAI_API_KEY` 是否正确设置
2. 检查日志中的 `[LLM] proxy error` 信息
3. 验证 API Key 是否有效（可以在 OpenAI 控制台测试）

### 问题 2: 生产环境 LLM 代理 URL 构建失败
**可能原因**:
1. `NEXTAUTH_URL_INTERNAL`、`NEXTAUTH_URL`、`NEXT_PUBLIC_APP_URL` 都未设置
2. URL 格式错误（缺少协议 `https://`）

**排查步骤**:
1. 检查 `getInternalAppUrl()` 是否能正确解析 URL
2. 检查日志中的 `[LLM] Cannot resolve LLM proxy URL in production` 错误
3. 确保至少设置一个 URL 环境变量

### 问题 3: `_llm_usage` 显示为 `false`，但实际调用了 LLM
**可能原因**:
1. LLM 调用失败，fallback 到规则引擎
2. LLM 返回的数据格式不正确

**排查步骤**:
1. 检查日志中的 `[ANALYZE_V2][LLM]` 错误信息
2. 检查 `palmLLMSuccess`、`tongueLLMSuccess`、`dreamLLMSuccess` 的值
3. 验证 LLM 返回的数据是否符合预期格式

---

## ✅ 最终检查清单

- [ ] `OPENAI_API_KEY` 已设置且有效
- [ ] 生产环境 `NODE_ENV=production` 已设置
- [ ] 生产环境至少设置了一个 URL 环境变量（`NEXTAUTH_URL_INTERNAL` / `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`）
- [ ] 如果使用自定义代理，`PENAI_BASE_URL` 或 `OPENAI_BASE_URL` 已正确设置
- [ ] `LLM_TIMEOUT_MS` 已设置（可选，默认 12000）
- [ ] 生产环境 `USE_MOCK_ANALYSIS` 未设置或未启用
- [ ] 测试分析请求，验证 `_llm_usage` 为 `true`
- [ ] 检查日志，确认 LLM 调用成功
- [ ] 验证返回的分析结果包含 LLM 生成的内容（不是规则引擎 fallback）


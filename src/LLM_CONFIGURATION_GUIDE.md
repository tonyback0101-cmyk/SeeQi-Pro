# LLM 配置保姆级指南

## 📍 配置位置总览

### 开发环境配置位置
- **文件**: `.env.local` (项目根目录)
- **格式**: `KEY=value` (每行一个)

### 生产环境配置位置
- **Vercel**: 项目设置 → Environment Variables
- **其他平台**: 平台提供的环境变量配置界面
- **服务器**: `.env` 文件或系统环境变量

---

## 🔴 必需配置（生产环境）

### 1. `OPENAI_API_KEY` ⚠️ **绝对必需**

#### 作用
OpenAI API 认证密钥，用于调用 OpenAI 服务生成分析报告。

#### 在哪里配置

**开发环境**:
```
项目根目录/.env.local
```

**生产环境（Vercel）**:
1. 登录 Vercel Dashboard
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**
4. 点击 **Add New**
5. 输入变量名和值

**生产环境（其他平台）**:
- 在平台的环境变量配置界面添加
- 或在服务器上创建 `.env` 文件

#### 如何配置

**步骤 1: 获取 API Key**
1. 访问 https://platform.openai.com/api-keys
2. 登录你的 OpenAI 账号
3. 点击 **Create new secret key**
4. 复制生成的 API Key（格式：`sk-...`）
5. ⚠️ **重要**: API Key 只显示一次，请立即保存

**步骤 2: 配置到项目**

**开发环境**:
```bash
# 在项目根目录创建或编辑 .env.local 文件
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File -Force
Add-Content -Path .env.local -Value "OPENAI_API_KEY=sk-你的API密钥"

# Windows (CMD)
echo OPENAI_API_KEY=sk-你的API密钥 > .env.local

# Mac/Linux
echo "OPENAI_API_KEY=sk-你的API密钥" > .env.local
```

**生产环境（Vercel）**:
1. 在 Vercel Dashboard 中，进入项目设置
2. 点击 **Environment Variables**
3. 点击 **Add New**
4. 填写：
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-你的API密钥`
   - **Environment**: 选择 `Production`、`Preview`、`Development`（根据需要）
5. 点击 **Save**

**步骤 3: 验证配置**

**开发环境**:
```bash
# Windows (PowerShell)
Get-Content .env.local | Select-String "OPENAI_API_KEY"

# Mac/Linux
grep OPENAI_API_KEY .env.local
```

**生产环境**:
- 在 Vercel Dashboard 的 Environment Variables 列表中查看
- 确保变量已添加到正确的环境（Production/Preview/Development）

**步骤 4: 重启服务**

**开发环境**:
```bash
# 停止当前开发服务器 (Ctrl+C)
# 重新启动
npm run dev
```

**生产环境**:
- Vercel: 会自动重新部署（或手动触发重新部署）
- 其他平台: 根据平台要求重启服务

#### 检查位置
- `app/api/llm/chat/route.ts` (第37行)
- `lib/llm/service.ts` (第58行)
- `app/api/v2/analyze/route.ts` (第173行)

#### 如果缺失会怎样
- **开发环境**: 会记录警告，但允许继续（LLM 调用会失败）
- **生产环境**: 直接返回 500 错误，提示 "LLM服务未配置"

---

### 2. URL 配置（生产环境必需，至少设置一个）

#### 作用
用于构建 LLM 代理路由的完整 URL。生产环境中，服务端需要知道自己的完整 URL 才能正确调用 `/api/llm/chat` 路由。

#### 优先级顺序
1. `NEXTAUTH_URL_INTERNAL` (最高优先级)
2. `NEXTAUTH_URL` (第二优先级)
3. `NEXT_PUBLIC_APP_URL` (最后 fallback)

**建议**: 生产环境优先设置 `NEXTAUTH_URL_INTERNAL`，如果未设置，会自动使用 `NEXTAUTH_URL` 或 `NEXT_PUBLIC_APP_URL`。

---

#### 2.1 `NEXTAUTH_URL_INTERNAL` (推荐)

**作用**: 服务端内部访问 URL（用于服务端到服务端的调用）

**在哪里配置**:
- **开发环境**: 通常不需要设置（使用 localhost）
- **生产环境**: Vercel 或其他平台的环境变量配置

**如何配置**:

**生产环境（Vercel）**:
1. 进入 Vercel Dashboard → 项目设置 → Environment Variables
2. 添加新变量：
   - **Name**: `NEXTAUTH_URL_INTERNAL`
   - **Value**: `https://你的域名.com` (例如: `https://www.seeqicloud.com`)
   - **Environment**: `Production`
3. 点击 **Save**

**格式要求**:
- ✅ 正确: `https://www.seeqicloud.com`
- ✅ 正确: `https://seeqicloud.com`
- ❌ 错误: `www.seeqicloud.com` (缺少协议)
- ❌ 错误: `http://www.seeqicloud.com` (生产环境应使用 HTTPS)

**检查位置**: `lib/env/urls.ts` (第42-46行)

---

#### 2.2 `NEXTAUTH_URL` (备选)

**作用**: NextAuth 对外暴露的绝对 URL（也用于服务端内部调用）

**在哪里配置**:
- **开发环境**: 通常不需要设置
- **生产环境**: Vercel 或其他平台的环境变量配置

**如何配置**:

**生产环境（Vercel）**:
1. 进入 Vercel Dashboard → 项目设置 → Environment Variables
2. 添加新变量：
   - **Name**: `NEXTAUTH_URL`
   - **Value**: `https://你的域名.com`
   - **Environment**: `Production`
3. 点击 **Save**

**格式要求**: 同 `NEXTAUTH_URL_INTERNAL`

**检查位置**: `lib/env/urls.ts` (第32-36行)

---

#### 2.3 `NEXT_PUBLIC_APP_URL` (最后备选)

**作用**: 对外可见的应用 URL（也用于服务端内部调用）

**在哪里配置**:
- **开发环境**: 通常不需要设置
- **生产环境**: Vercel 或其他平台的环境变量配置

**如何配置**:

**生产环境（Vercel）**:
1. 进入 Vercel Dashboard → 项目设置 → Environment Variables
2. 添加新变量：
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://你的域名.com`
   - **Environment**: `Production`
3. 点击 **Save**

**格式要求**: 同 `NEXTAUTH_URL_INTERNAL`

**检查位置**: `lib/env/urls.ts` (第22-26行)

**⚠️ 注意**: 变量名包含 `NEXT_PUBLIC_` 前缀，这意味着它会被暴露到客户端代码中。如果包含敏感信息，优先使用 `NEXTAUTH_URL_INTERNAL`。

---

### 3. `NODE_ENV=production` ⚠️ **生产环境必需**

#### 作用
标识当前运行环境，用于区分开发环境和生产环境。

#### 在哪里配置

**开发环境**:
- 通常不需要手动设置（Next.js 自动设置为 `development`）
- 如果需要在开发环境测试生产行为，可以临时设置

**生产环境**:
- **Vercel**: 自动设置为 `production`（无需手动配置）
- **其他平台**: 通常在部署时自动设置，或需要在环境变量中显式设置

#### 如何配置

**Vercel**: 
- ✅ **自动设置**，无需手动配置
- 在 Production 部署中，`NODE_ENV` 自动为 `production`

**其他平台**:
```bash
# 如果平台不自动设置，需要手动添加
NODE_ENV=production
```

#### 检查位置
- `app/api/v2/analyze/route.ts` (第172行)
- `lib/llm/service.ts` (第25行)

#### 如果缺失会怎样
- 代码会认为处于开发环境
- 生产环境的严格检查不会生效
- LLM 失败时会 fallback 到规则引擎（而不是返回错误）

---

## 🟡 可选配置

### 4. `PENAI_BASE_URL` 或 `OPENAI_BASE_URL` (可选)

#### 作用
自定义 OpenAI API 的 Base URL。如果你使用代理服务（如 PenAI）或自定义的 OpenAI 兼容 API，需要设置此变量。

#### 在哪里配置

**开发环境**:
```
项目根目录/.env.local
```

**生产环境**:
- Vercel: Environment Variables
- 其他平台: 环境变量配置界面

#### 如何配置

**如果使用 PenAI 代理**:
```bash
# .env.local (开发环境)
PENAI_BASE_URL=https://api.penai.com

# 或生产环境（Vercel）
# Name: PENAI_BASE_URL
# Value: https://api.penai.com
```

**如果使用其他 OpenAI 兼容 API**:
```bash
# .env.local (开发环境)
OPENAI_BASE_URL=https://your-custom-api.com

# 或生产环境（Vercel）
# Name: OPENAI_BASE_URL
# Value: https://your-custom-api.com
```

**优先级**:
- `PENAI_BASE_URL` > `OPENAI_BASE_URL` > `https://api.openai.com` (默认)

**检查位置**: `app/api/llm/chat/route.ts` (第3行)

**默认值**: 如果都不设置，使用 `https://api.openai.com`

---

### 5. `LLM_TIMEOUT_MS` (可选)

#### 作用
LLM 请求的超时时间（毫秒）。如果 LLM API 响应较慢，可以增加此值。

#### 在哪里配置

**开发环境**:
```
项目根目录/.env.local
```

**生产环境**:
- Vercel: Environment Variables
- 其他平台: 环境变量配置界面

#### 如何配置

```bash
# .env.local (开发环境)
LLM_TIMEOUT_MS=12000

# 或生产环境（Vercel）
# Name: LLM_TIMEOUT_MS
# Value: 12000
```

**建议值**:
- 默认: `12000` (12秒)
- 如果经常超时: `20000` (20秒) 或 `30000` (30秒)
- 最大建议: `60000` (60秒)

**检查位置**: `app/api/llm/chat/route.ts` (第4行)

**默认值**: `12000` (12秒)

---

### 6. `PORT` (仅开发环境，可选)

#### 作用
开发服务器的端口号。用于构建开发环境的 LLM 代理 URL。

#### 在哪里配置

**开发环境**:
```
项目根目录/.env.local
```

**生产环境**: 不需要设置

#### 如何配置

```bash
# .env.local
PORT=3001
```

**默认值**: `3001`

**检查位置**: `lib/llm/service.ts` (第27行)

**用途**: 仅用于开发环境，构建 `http://localhost:3001/api/llm/chat`

---

## 📋 完整配置示例

### 开发环境配置 (`.env.local`)

```bash
# ============================================
# 必需配置
# ============================================

# OpenAI API 密钥（必需）
OPENAI_API_KEY=sk-你的API密钥

# ============================================
# 可选配置
# ============================================

# 开发服务器端口（可选，默认 3001）
PORT=3001

# LLM 超时时间（可选，默认 12000 毫秒）
LLM_TIMEOUT_MS=12000

# 如果使用自定义代理（可选）
# PENAI_BASE_URL=https://api.penai.com
# 或
# OPENAI_BASE_URL=https://your-custom-api.com
```

### 生产环境配置 (Vercel Environment Variables)

在 Vercel Dashboard 中添加以下变量：

| Name | Value | Environment |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-你的API密钥` | Production, Preview, Development |
| `NEXTAUTH_URL_INTERNAL` | `https://你的域名.com` | Production |
| `NEXTAUTH_URL` | `https://你的域名.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://你的域名.com` | Production |
| `LLM_TIMEOUT_MS` | `12000` | Production (可选) |
| `PENAI_BASE_URL` | `https://api.penai.com` | Production (可选，如果使用代理) |

**⚠️ 注意**: 
- `NODE_ENV` 在 Vercel 的 Production 环境中自动设置为 `production`，无需手动配置
- 至少设置一个 URL 变量（`NEXTAUTH_URL_INTERNAL`、`NEXTAUTH_URL` 或 `NEXT_PUBLIC_APP_URL`）

---

## ✅ 配置验证步骤

### 步骤 1: 检查环境变量是否设置

**开发环境**:
```bash
# Windows (PowerShell)
Get-Content .env.local

# Mac/Linux
cat .env.local
```

**生产环境（Vercel）**:
1. 进入 Vercel Dashboard → 项目设置 → Environment Variables
2. 检查所有变量是否已添加
3. 确保变量已添加到正确的环境（Production/Preview/Development）

### 步骤 2: 验证 API Key 格式

```bash
# 检查 API Key 是否以 "sk-" 开头
# Windows (PowerShell)
$env:OPENAI_API_KEY.Substring(0, 3)

# Mac/Linux
echo $OPENAI_API_KEY | cut -c1-3
```

应该显示: `sk-`

### 步骤 3: 测试 LLM 调用

**开发环境**:
1. 启动开发服务器: `npm run dev`
2. 访问应用并提交一次分析请求
3. 查看终端日志，应该看到:
   ```
   [V2 Analyze] Environment check { hasOpenAIKey: true, ... }
   [LLM] Calling LLM proxy { url: "http://localhost:3001/api/llm/chat", ... }
   [LLM] proxy success { duration: 1234, model: "gpt-4o-mini", ... }
   [V2 Analyze] LLM palm interpretation successful { usedLLM: true }
   ```

**生产环境**:
1. 部署到生产环境
2. 提交一次分析请求
3. 检查返回的 JSON，`_llm_usage` 应该为:
   ```json
   {
     "normalized": {
       "_llm_usage": {
         "palm": true,
         "tongue": true,
         "dream": true
       }
     }
   }
   ```

### 步骤 4: 检查错误日志

如果 LLM 调用失败，检查日志中的错误信息：

**常见错误**:
- `[LLM] proxy error: Missing OPENAI_API_KEY` → API Key 未设置
- `[LLM] Cannot resolve LLM proxy URL in production` → URL 环境变量未设置
- `[LLM] proxy error: LLM API request failed` → API Key 无效或网络问题
- `[LLM] request timeout after 12000ms` → 超时时间太短，增加 `LLM_TIMEOUT_MS`

---

## 🔧 常见问题排查

### 问题 1: LLM 调用失败，返回 500 错误

**可能原因**:
1. `OPENAI_API_KEY` 未设置或无效
2. `NEXTAUTH_URL_INTERNAL` 等 URL 变量未设置（生产环境）
3. API Key 配额已用完
4. 网络连接问题

**排查步骤**:
1. 检查 `OPENAI_API_KEY` 是否正确设置
2. 检查日志中的 `[LLM] proxy error` 信息
3. 在 OpenAI 控制台验证 API Key 是否有效
4. 检查 API 使用配额

### 问题 2: 生产环境 LLM 代理 URL 构建失败

**可能原因**:
1. `NEXTAUTH_URL_INTERNAL`、`NEXTAUTH_URL`、`NEXT_PUBLIC_APP_URL` 都未设置
2. URL 格式错误（缺少协议 `https://`）

**排查步骤**:
1. 检查至少设置了一个 URL 环境变量
2. 确保 URL 格式正确（包含 `https://`）
3. 检查日志中的 `[LLM] Cannot resolve LLM proxy URL in production` 错误

### 问题 3: `_llm_usage` 显示为 `false`

**可能原因**:
1. LLM 调用失败，fallback 到规则引擎
2. LLM 返回的数据格式不正确

**排查步骤**:
1. 检查日志中的 `[ANALYZE_V2][LLM]` 错误信息
2. 验证 `OPENAI_API_KEY` 是否正确
3. 检查网络连接是否正常

---

## 📝 快速检查清单

### 开发环境
- [ ] 创建 `.env.local` 文件
- [ ] 添加 `OPENAI_API_KEY=sk-...`
- [ ] 重启开发服务器
- [ ] 测试分析请求，检查日志

### 生产环境
- [ ] 在 Vercel/平台添加 `OPENAI_API_KEY`
- [ ] 添加至少一个 URL 变量（`NEXTAUTH_URL_INTERNAL` 推荐）
- [ ] 确保 `NODE_ENV` 为 `production`（Vercel 自动设置）
- [ ] 重新部署应用
- [ ] 测试分析请求，检查 `_llm_usage` 字段

---

## 🎯 总结

### 最小必需配置（生产环境）
1. ✅ `OPENAI_API_KEY` - OpenAI API 密钥
2. ✅ 至少一个 URL 变量（`NEXTAUTH_URL_INTERNAL` 推荐）
3. ✅ `NODE_ENV=production`（Vercel 自动设置）

### 推荐配置（生产环境）
1. ✅ `OPENAI_API_KEY`
2. ✅ `NEXTAUTH_URL_INTERNAL`（服务端内部 URL）
3. ✅ `NEXTAUTH_URL`（NextAuth URL）
4. ✅ `NEXT_PUBLIC_APP_URL`（公共 URL）
5. ⚪ `LLM_TIMEOUT_MS=12000`（可选，默认 12 秒）

### 配置位置
- **开发环境**: `.env.local` 文件（项目根目录）
- **生产环境**: Vercel Dashboard → Settings → Environment Variables

### 验证方法
1. 检查环境变量是否设置
2. 查看日志中的 `[LLM] proxy success` 消息
3. 检查返回数据中的 `_llm_usage` 字段


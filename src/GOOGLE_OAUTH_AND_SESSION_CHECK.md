# Google OAuth 和 Session Cookie 配置检查报告

## 🔍 检查结果

### 1. Google 登录是否允许生产域名？

**答案**: ⚠️ **需要确认 Google Cloud Console 配置**

#### NextAuth Google Provider 配置
**位置**: `lib/auth/options.ts:32-38`
```typescript
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}
```

**状态**: ⚠️ **NextAuth 会自动生成 redirect URI，但需要在 Google Cloud Console 中配置**

#### NextAuth 自动生成的 Redirect URI
NextAuth 会自动生成以下格式的 redirect URI：
- `{NEXTAUTH_URL}/api/auth/callback/google`
- 例如：`https://seeqi.app/api/auth/callback/google`

#### 需要检查的配置
1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. 找到对应的 OAuth 2.0 Client ID
3. 在 **Authorized redirect URIs** 中添加：
   - `https://seeqi.app/api/auth/callback/google`
   - `https://www.seeqi.app/api/auth/callback/google`（如果使用 www）
   - `https://seeqipro.vercel.app/api/auth/callback/google`（如果使用 Vercel 域名）

**问题**: 
- ❌ 代码中没有明确配置 redirect URI（NextAuth 自动生成）
- ⚠️ 需要在 Google Cloud Console 中手动添加生产域名

**建议**:
- 确保 `NEXTAUTH_URL` 环境变量设置为生产域名
- 在 Google Cloud Console 中添加所有可能的 redirect URI

### 2. Session 是否配置 secure cookies？

**答案**: ✅ **已配置，但需要确保生产环境正确**

#### Session Cookie 配置
**位置**: `lib/auth/options.ts:129-156`
```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://")
      ? `__Secure-next-auth.session-token`
      : `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: (() => {
        const url = process.env.NEXTAUTH_URL || "";
        const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1") || !url;
        const isHttps = url.startsWith("https://");
        const isProduction = process.env.NODE_ENV === "production";
        // 如果是 localhost 或开发环境，明确禁用 secure
        if (isLocalhost || !isProduction) {
          return false;
        }
        // 只在生产环境且明确使用 HTTPS 时使用 secure
        return isProduction && isHttps;
      })(),
    },
  },
},
```

**状态**: ✅ **配置正确**
- ✅ `httpOnly: true` - 防止 XSS 攻击
- ✅ `sameSite: "lax"` - 防止 CSRF 攻击
- ✅ `secure` - 在生产环境且 HTTPS 时启用
- ✅ 开发环境（localhost）自动禁用 secure

**问题**:
- ⚠️ 依赖 `NEXTAUTH_URL` 环境变量正确设置
- ⚠️ 如果 `NEXTAUTH_URL` 未设置或设置为 HTTP，secure 将不会启用

**建议**:
- 确保生产环境 `NEXTAUTH_URL` 设置为 `https://seeqi.app`
- 确保 `NODE_ENV=production`

### 3. localhost 与 online mix 的变量要清理

**答案**: ⚠️ **发现混合配置，需要清理**

#### 发现的 localhost/online 混合配置

##### 1. `app/api/v2/pay/checkout/route.ts:32`
```typescript
"http://localhost:3001"  // ❌ 硬编码 localhost
```

##### 2. `app/api/pay/checkout/route.ts:34`
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
```
**状态**: ✅ 使用环境变量，有合理的 fallback

##### 3. `app/api/v2/subscription/checkout/route.ts:12`
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
```
**状态**: ✅ 使用环境变量，有合理的 fallback

##### 4. `app/api/billing/create-checkout-session/route.ts:12`
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
```
**状态**: ✅ 使用环境变量，有合理的 fallback

##### 5. `lib/llm/service.ts:33`
```typescript
if (process.env.NODE_ENV === "development") {
  return "http://localhost:3000/api/llm/chat";
}
```
**状态**: ✅ 仅在开发环境使用，合理

##### 6. `lib/auth/options.ts:144-145`
```typescript
const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1") || !url;
```
**状态**: ✅ 用于检测开发环境，合理

**需要清理的配置**:
- ❌ `app/api/v2/pay/checkout/route.ts:32` - 硬编码 `http://localhost:3001`

## 📊 配置总结

| 配置项 | 状态 | 问题 | 建议 |
|--------|------|------|------|
| **Google OAuth Redirect URI** | ⚠️ | 需要在 Google Cloud Console 配置 | 添加生产域名到授权列表 |
| **Session Secure Cookie** | ✅ | 依赖环境变量 | 确保 `NEXTAUTH_URL` 正确设置 |
| **localhost/online 混合** | ⚠️ | 发现硬编码 localhost | 清理硬编码，使用环境变量 |

## 🔧 建议的修复

### 1. 清理硬编码 localhost（高优先级）

**文件**: `app/api/v2/pay/checkout/route.ts`
```typescript
// 删除或替换硬编码的 localhost
// 使用环境变量或统一的 URL 解析函数
```

### 2. 确保 Google OAuth Redirect URI 配置（高优先级）

**操作**: 在 Google Cloud Console 中添加：
- `https://seeqi.app/api/auth/callback/google`
- `https://www.seeqi.app/api/auth/callback/google`（如果使用）
- `https://seeqipro.vercel.app/api/auth/callback/google`（如果使用）

### 3. 验证环境变量（中优先级）

确保生产环境设置了：
- `NEXTAUTH_URL=https://seeqi.app`
- `NEXT_PUBLIC_APP_URL=https://seeqi.app`
- `NODE_ENV=production`


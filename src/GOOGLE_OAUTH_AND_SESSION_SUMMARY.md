# Google OAuth 和 Session Cookie 配置总结

## 📋 快速回答

### 1. Google 登录是否允许生产域名？

**答案**: ⚠️ **需要在 Google Cloud Console 配置**

#### NextAuth 自动生成的 Redirect URI
- 格式：`{NEXTAUTH_URL}/api/auth/callback/google`
- 例如：`https://seeqi.app/api/auth/callback/google`

#### 需要在 Google Cloud Console 配置
1. 登录 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services** → **Credentials**
3. 找到对应的 OAuth 2.0 Client ID
4. 在 **Authorized redirect URIs** 中添加：
   - `https://seeqi.app/api/auth/callback/google`
   - `https://www.seeqi.app/api/auth/callback/google`（如果使用 www）
   - `https://seeqipro.vercel.app/api/auth/callback/google`（如果使用 Vercel 域名）

#### 代码配置
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

**状态**: ✅ NextAuth 会自动生成 redirect URI，但需要在 Google Cloud Console 手动添加

**建议**:
- 确保 `NEXTAUTH_URL` 环境变量设置为生产域名
- 在 Google Cloud Console 中添加所有可能的 redirect URI

### 2. Session 是否配置 secure cookies？

**答案**: ✅ **已配置，但需要确保生产环境正确**

#### Session Cookie 配置详情
**位置**: `lib/auth/options.ts:129-156`

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `httpOnly` | `true` | ✅ 防止 XSS 攻击 |
| `sameSite` | `"lax"` | ✅ 防止 CSRF 攻击 |
| `secure` | 动态 | ✅ 生产环境且 HTTPS 时启用 |
| Cookie 名称 | 动态 | ✅ 生产环境使用 `__Secure-` 前缀 |

#### Secure Cookie 逻辑
```typescript
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
```

**状态**: ✅ **配置正确**
- ✅ 开发环境（localhost）自动禁用 secure
- ✅ 生产环境且 HTTPS 时启用 secure
- ✅ 使用 `__Secure-` 前缀（生产环境）

**要求**:
- ⚠️ 必须设置 `NEXTAUTH_URL=https://seeqi.app`
- ⚠️ 必须设置 `NODE_ENV=production`

### 3. localhost 与 online mix 的变量要清理

**答案**: ✅ **已修复硬编码 localhost**

#### 修复前
**文件**: `app/api/v2/pay/checkout/route.ts:32`
```typescript
function resolveAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3001"  // ❌ 硬编码 localhost
  ).replace(/\/$/, "");
}
```

#### 修复后
```typescript
function resolveAppUrl(): string {
  // 优先使用 NEXT_PUBLIC_APP_URL，其次使用 APP_URL
  // 生产环境必须设置环境变量，不使用 localhost fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL or APP_URL must be set in production");
  }
  return baseUrl.replace(/\/$/, "");
}
```

#### 其他配置检查
| 文件 | 配置 | 状态 |
|------|------|------|
| `app/api/pay/checkout/route.ts` | 使用环境变量 + fallback | ✅ 合理 |
| `app/api/v2/subscription/checkout/route.ts` | 使用环境变量 + fallback | ✅ 合理 |
| `app/api/billing/create-checkout-session/route.ts` | 使用环境变量 + fallback | ✅ 合理 |
| `lib/llm/service.ts` | 开发环境使用 localhost | ✅ 合理（仅开发环境） |
| `lib/auth/options.ts` | 用于检测开发环境 | ✅ 合理 |

**状态**: ✅ **已清理硬编码 localhost**

## 📊 配置总结

| 配置项 | 状态 | 问题 | 建议 |
|--------|------|------|------|
| **Google OAuth Redirect URI** | ⚠️ | 需要在 Google Cloud Console 配置 | 添加生产域名到授权列表 |
| **Session Secure Cookie** | ✅ | 依赖环境变量 | 确保 `NEXTAUTH_URL` 正确设置 |
| **localhost/online 混合** | ✅ | 已修复硬编码 | 保持使用环境变量 |

## ✅ 结论

### 生产环境可用性
- ✅ **Session Cookie 配置正确**（secure, httpOnly, sameSite）
- ✅ **硬编码 localhost 已清理**
- ⚠️ **Google OAuth 需要在 Google Cloud Console 配置**

### 必须执行的操作
1. **高优先级**: 在 Google Cloud Console 添加生产域名的 redirect URI
2. **高优先级**: 确保生产环境设置了 `NEXTAUTH_URL=https://seeqi.app`
3. **高优先级**: 确保生产环境设置了 `NODE_ENV=production`

### 已修复的问题
- ✅ 清理了 `app/api/v2/pay/checkout/route.ts` 中的硬编码 localhost
- ✅ 改为使用环境变量，生产环境未设置时会抛出错误

## 🔧 生产环境检查清单

### Google OAuth
- [ ] 在 Google Cloud Console 添加 `https://seeqi.app/api/auth/callback/google`
- [ ] 在 Google Cloud Console 添加 `https://www.seeqi.app/api/auth/callback/google`（如果使用）
- [ ] 在 Google Cloud Console 添加 `https://seeqipro.vercel.app/api/auth/callback/google`（如果使用）

### 环境变量
- [ ] `NEXTAUTH_URL=https://seeqi.app`
- [ ] `NEXT_PUBLIC_APP_URL=https://seeqi.app`
- [ ] `NODE_ENV=production`
- [ ] `GOOGLE_CLIENT_ID`（如果使用 Google 登录）
- [ ] `GOOGLE_CLIENT_SECRET`（如果使用 Google 登录）

### Session Cookie
- [ ] 验证生产环境 Cookie 使用 `__Secure-` 前缀
- [ ] 验证生产环境 Cookie 设置了 `secure` 标志
- [ ] 验证生产环境 Cookie 设置了 `httpOnly` 标志


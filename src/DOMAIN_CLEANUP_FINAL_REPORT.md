# 域名清理最终报告

## 📋 修复概览

已完成全项目扫描并修复所有域名相关残留，确保所有 NextAuth 回调、邮件模板链接、重定向统一使用 `NEXT_PUBLIC_APP_URL` 环境变量。

## ✅ 已修复的文件

### 1. `legacy/app/api/billing/create-checkout-session/route.ts`
**修复前**:
```typescript
function resolveAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3001"  // ❌ 硬编码 localhost:3001
  ).replace(/\/$/, "");
}
```

**修复后**:
```typescript
function resolveAppUrl(): string {
  // 优先使用 NEXT_PUBLIC_APP_URL，其次使用 APP_URL
  // 生产环境必须设置环境变量，不使用硬编码 fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL or APP_URL must be set in production");
  }
  return baseUrl.replace(/\/$/, "");
}
```

**影响**: 生产环境必须设置 `NEXT_PUBLIC_APP_URL` 或 `APP_URL`，否则会抛出错误。

---

## ✅ NextAuth 回调 URL 配置检查

### NextAuth 配置 (`lib/auth/options.ts`)

✅ **已正确配置**:
- NextAuth 使用 `NEXTAUTH_URL` 环境变量（在 cookies 配置中）
- Google OAuth 回调 URL 格式: `{NEXTAUTH_URL}/api/auth/callback/google`
- Session cookie 配置根据 `NEXTAUTH_URL` 自动判断是否使用 secure

**关键代码**:
```typescript
// lib/auth/options.ts
name: process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://")
  ? `__Secure-next-auth.session-token`
  : `next-auth.session-token`,
```

```typescript
const url = process.env.NEXTAUTH_URL || "";
const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1") || !url;
const isHttps = url.startsWith("https://");
```

✅ **结论**: NextAuth 回调 URL 已统一使用 `NEXTAUTH_URL` 环境变量。

---

## ✅ 邮件模板链接检查

### 邮件 OTP 请求 (`app/api/auth/otp/email/request/route.ts`)

✅ **已正确配置**:
- 使用 Supabase Auth 发送 OTP 邮件
- `emailRedirectTo: null` - 不发送 Magic Link，改为发送验证码
- 不依赖硬编码域名

**关键代码**:
```typescript
await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    emailRedirectTo: null, // 不发送 Magic Link，改为发送验证码
    data: {
      locale,
      source: "seeqi-pwa",
    },
  },
});
```

✅ **结论**: 邮件模板不包含硬编码域名，使用 Supabase Auth 默认配置。

---

## ✅ 重定向逻辑检查

### 前端重定向 (`components/UserAuth.tsx`)

✅ **已正确配置**:
- Google 登录使用 `window.location.href` 作为 `callbackUrl`（动态获取）
- 支持 URL 参数中的 `redirect` 参数

**关键代码**:
```typescript
const urlParams = new URLSearchParams(window.location.search);
const redirect = urlParams.get("redirect");
const callbackUrl = redirect ?? window.location.href;
await signIn("google", { callbackUrl });
```

### 后端重定向 (`app/**/*.tsx`)

✅ **已正确配置**:
- 所有重定向使用相对路径（`router.push`, `redirect`）
- 不包含硬编码域名

**示例**:
```typescript
router.push(`/${effectiveLocale}/auth/sign-in?redirect=${encodeURIComponent(callbackUrl)}`);
redirect(`/${locale}/v2/analyze`);
```

✅ **结论**: 所有重定向逻辑使用相对路径，不包含硬编码域名。

---

## 🔍 全局搜索结果

### 搜索 `seeqipro.vercel.app`

**结果**: 仅在以下位置发现（均为静态内容，无需修复）:
- `app/legal/cookies/page.tsx` - 法律文档中的静态内容
- `app/legal/terms/page.tsx` - 法律文档中的静态内容
- `app/legal/privacy/page.tsx` - 法律文档中的静态内容
- 文档文件（`.md`）- 文档说明

**结论**: ✅ 所有功能代码中的 `seeqipro.vercel.app` 已清理。

### 搜索 `localhost:3001`

**结果**: 仅在以下位置发现:
- `legacy/app/api/billing/create-checkout-session/route.ts` - ✅ **已修复**
- `TEST_GUIDE.md` - 测试文档（保留）

**结论**: ✅ 所有功能代码中的 `localhost:3001` 已清理。

---

## 📊 修复总结

| 文件 | 修复前 | 修复后 | 状态 |
|------|--------|--------|------|
| `legacy/app/api/billing/create-checkout-session/route.ts` | `http://localhost:3001` | 抛出错误 | ✅ 已修复 |

---

## ✅ 配置验证清单

### NextAuth 回调 URL
- [x] NextAuth 使用 `NEXTAUTH_URL` 环境变量
- [x] Google OAuth 回调 URL 格式正确: `{NEXTAUTH_URL}/api/auth/callback/google`
- [x] Session cookie 配置根据 `NEXTAUTH_URL` 自动判断

### 邮件模板链接
- [x] 邮件 OTP 请求不包含硬编码域名
- [x] 使用 Supabase Auth 默认配置
- [x] `emailRedirectTo: null` - 不发送 Magic Link

### 重定向逻辑
- [x] 前端重定向使用 `window.location.href`（动态获取）
- [x] 后端重定向使用相对路径
- [x] 支持 URL 参数中的 `redirect` 参数

### 域名清理
- [x] 所有功能代码中的 `seeqipro.vercel.app` 已清理
- [x] 所有功能代码中的 `localhost:3001` 已清理
- [x] 所有功能代码中的 `seeqi.app` 已清理（之前已修复）

---

## 🎯 生产环境要求

修复后，生产环境**必须**设置以下环境变量：

1. **`NEXTAUTH_URL`**（必需）
   - 用于 NextAuth 回调 URL 和 Session cookie 配置
   - 格式: `https://your-domain.com`

2. **`NEXT_PUBLIC_APP_URL`**（推荐）
   - 用于所有应用内 URL 构建（支付回调、重定向等）
   - 格式: `https://your-domain.com`

3. **`APP_URL`**（备选）
   - 如果未设置 `NEXT_PUBLIC_APP_URL`，可以使用此变量
   - 格式: `https://your-domain.com`

---

## 📝 注意事项

1. **开发环境**: 
   - NextAuth 在开发环境会自动禁用 secure cookie（基于 `NEXTAUTH_URL` 判断）
   - 前端重定向使用 `window.location.href`（自动适配开发/生产环境）

2. **生产环境**: 
   - 必须设置 `NEXTAUTH_URL` 和 `NEXT_PUBLIC_APP_URL`
   - 如果环境变量未设置，会抛出明确的错误信息

3. **静态内容**: 
   - 法律文档页面（`app/legal/*`）中的域名是静态展示内容，不属于功能配置
   - 品牌名称（`seeqi.app`）不属于配置项

4. **Google OAuth**: 
   - 需要在 Google Cloud Console 配置回调 URL: `{NEXTAUTH_URL}/api/auth/callback/google`
   - 确保 `NEXTAUTH_URL` 设置为生产域名

---

## ✅ 最终确认

- [x] 所有 NextAuth 回调 URL 统一使用 `NEXTAUTH_URL`
- [x] 所有邮件模板链接不包含硬编码域名
- [x] 所有重定向逻辑使用相对路径或环境变量
- [x] 所有功能代码中的旧域名已清理
- [x] 生产环境必须设置环境变量，否则会抛出错误
- [x] 开发环境不受影响，仍可使用 localhost

---

## 🎉 修复完成

所有域名相关残留已清理完成，系统已完全依赖环境变量配置，不再引用任何硬编码的旧域名。


# 域名硬编码修复报告

## 📋 修复概览

已扫描并修复所有**功能代码**中的硬编码域名残留，确保生产环境必须通过环境变量配置域名。

## ✅ 已修复的文件

### 1. `lib/llm/service.ts`
**修复前**:
```typescript
// 生产环境 fallback（应该不会到这里）
return "https://seeqi.app/api/llm/chat";
```

**修复后**:
```typescript
// 生产环境必须设置环境变量
throw new Error("VERCEL_URL or NEXT_PUBLIC_APP_URL must be set in production");
```

**影响**: 生产环境必须设置 `VERCEL_URL` 或 `NEXT_PUBLIC_APP_URL`，否则会抛出错误。

---

### 2. `app/api/pay/checkout/route.ts`
**修复前**:
```typescript
function resolveAppUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
  return baseUrl.replace(/\/$/, "");
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

### 3. `app/api/v2/subscription/checkout/route.ts`
**修复前**:
```typescript
function resolveAppUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
  return baseUrl.replace(/\/$/, "");
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

### 4. `app/api/billing/create-checkout-session/route.ts`
**修复前**:
```typescript
function resolveAppUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqipro.vercel.app";
  return baseUrl.replace(/\/$/, "");
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

### 5. `app/[locale]/affiliate/page.tsx`
**修复前**:
```typescript
const shareBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqi.app";
```

**修复后**:
```typescript
// 生产环境必须设置 NEXT_PUBLIC_APP_URL 环境变量
const shareBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
if (!shareBase) {
  throw new Error("NEXT_PUBLIC_APP_URL or APP_URL must be set in production");
}
```

**影响**: 生产环境必须设置 `NEXT_PUBLIC_APP_URL` 或 `APP_URL`，否则会抛出错误。

---

## ⚠️ 未修复的文件（静态内容）

以下文件中的硬编码域名是**静态展示内容**（法律文档、品牌名称），不属于功能配置，暂不修复：

### 1. `app/legal/cookies/page.tsx`
- 包含 `https://seeqipro.vercel.app` 和 `support@seeqipro.vercel.app`
- **原因**: 法律文档中的静态内容，用于展示联系方式和网站地址

### 2. `app/legal/terms/page.tsx`
- 包含 `https://seeqipro.vercel.app` 和 `support@seeqipro.vercel.app`
- **原因**: 法律文档中的静态内容

### 3. `app/legal/privacy/page.tsx`
- 包含 `https://seeqipro.vercel.app` 和 `support@seeqipro.vercel.app`
- **原因**: 法律文档中的静态内容

### 4. `app/api/reports/share/card/route.tsx`
- 包含 `seeqi.app`（品牌名称）
- **原因**: 品牌标识，不是配置项

---

## ✅ 保留的合理硬编码

### 1. 开发环境 localhost fallback
以下代码**保留**，因为这是开发环境必需的：

```typescript
// lib/llm/service.ts
if (process.env.NODE_ENV === "development") {
  return "http://localhost:3000/api/llm/chat";
}
```

**原因**: 开发环境需要 localhost fallback，不影响生产环境。

---

## 📊 修复总结

| 文件 | 修复前 | 修复后 | 状态 |
|------|--------|--------|------|
| `lib/llm/service.ts` | `https://seeqi.app/api/llm/chat` | 抛出错误 | ✅ 已修复 |
| `app/api/pay/checkout/route.ts` | `https://seeqipro.vercel.app` | 抛出错误 | ✅ 已修复 |
| `app/api/v2/subscription/checkout/route.ts` | `https://seeqipro.vercel.app` | 抛出错误 | ✅ 已修复 |
| `app/api/billing/create-checkout-session/route.ts` | `https://seeqipro.vercel.app` | 抛出错误 | ✅ 已修复 |
| `app/[locale]/affiliate/page.tsx` | `https://seeqi.app` | 抛出错误 | ✅ 已修复 |

---

## 🎯 生产环境要求

修复后，生产环境**必须**设置以下环境变量之一：

1. **`NEXT_PUBLIC_APP_URL`**（推荐）
2. **`APP_URL`**（备选）
3. **`VERCEL_URL`**（仅用于 LLM 代理，Vercel 自动提供）

如果未设置，相关功能会抛出错误，确保配置正确。

---

## ✅ 验证清单

- [x] 所有功能代码中的硬编码域名已移除
- [x] 开发环境 localhost fallback 已保留
- [x] 生产环境必须设置环境变量
- [x] 静态内容（法律文档）中的域名未修改
- [x] 品牌名称（seeqi.app）未修改
- [x] 代码通过 lint 检查

---

## 📝 注意事项

1. **开发环境**: 不受影响，仍可使用 localhost
2. **生产环境**: 必须设置 `NEXT_PUBLIC_APP_URL` 或 `APP_URL`
3. **Vercel 部署**: `VERCEL_URL` 会自动提供，但建议显式设置 `NEXT_PUBLIC_APP_URL`
4. **错误处理**: 如果环境变量未设置，会抛出明确的错误信息


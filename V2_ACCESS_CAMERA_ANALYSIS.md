# V2 访问控制与相机功能关联分析报告

## 1. V2 相关的 Stripe/价格/access 代码搜索

### 1.1 在 `/v2/analyze` 模块中的引用

**文件路径：** `src/app/[locale]/v2/analyze/page.tsx`

**检查结果：** ❌ **没有找到任何 V2 访问控制相关的导入或使用**

**导入列表（第1-12行）：**
```typescript
import { useState, useEffect, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";  // ✅ 仅用于获取 session，不用于访问控制
import { validateImageQuality } from "@/lib/analysis/image/validate";
import { buildV2AnalyzePage, buildV2ResultPage, buildAuthSignInPage, buildHomePage } from "@/lib/v2/routes";
import ErrorBoundary from "@/components/ErrorBoundary";

const MobileCamera = dynamic(() => import("@/components/MobileCamera"), { ssr: false });
```

**未导入的模块：**
- ❌ `computeV2Access`
- ❌ `useV2Access`
- ❌ `usePricing`
- ❌ `StripeCheckout`
- ❌ `@/lib/access/v2Access`
- ❌ `@/lib/v2/accessLevel`

### 1.2 在其他 V2 模块中的使用

**`computeV2Access` 使用位置：**
- ✅ `src/app/[locale]/v2/analysis-result/page.tsx` (第4行、第43行)
  - 用于结果页的访问控制计算
  - **不在 analyze 页面中使用**

**`V2AccessResult` 使用位置：**
- ✅ `src/app/[locale]/v2/analysis-result/V2AnalysisResultClient.tsx` (第18行、第28行)
  - 用于结果页的访问控制渲染
  - **不在 analyze 页面中使用**

---

## 2. 相机功能中的访问控制检查

### 2.1 相机按钮相关代码

**位置：** 第1382-1389行（掌纹）、第1437-1444行（舌苔）

```typescript
<button
  type="button"
  className="action-button secondary-action camera-trigger"
  data-input-type="palm"
  onClick={() => handleRequestCamera("palm")}
>
  拍照
</button>
```

**检查结果：** ❌ **没有任何访问控制相关的属性或条件**

### 2.2 handleRequestCamera 函数

**位置：** 第370-410行

```typescript
const handleRequestCamera = (mode: "palm" | "tongue"): boolean => {
  console.log("[Camera] handleRequestCamera called, mode:", mode);
  console.log("[Camera] isOnline:", isOnline, "cameraSupported:", cameraSupported);
  console.log("[Camera] current activeCameraMode:", activeCameraMode);
  console.log("[Camera] navigator.mediaDevices:", typeof navigator !== "undefined" ? !!navigator.mediaDevices : "navigator undefined");
  
  // 如果已经有激活的相机模式，先关闭它（允许切换模式）
  if (activeCameraMode && activeCameraMode !== mode) {
    // ... 切换逻辑 ...
  }
  
  // 如果点击的是同一个模式，则关闭相机（切换开关）
  if (activeCameraMode === mode) {
    // ... 关闭逻辑 ...
    return true;
  }
  
  // 暂时跳过在线检查，允许离线使用摄像头
  // if (!isOnline) {
  //   setCameraMessage(...);
  //   return false;
  // }
  
  // 强制检查摄像头支持（即使 cameraSupported 为 false 也尝试）
  const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  
  if (!hasMediaDevices && !cameraSupported) {
    console.warn("[Camera] Camera not supported on this device");
    const message = locale === "zh" ? "当前设备不支持相机功能，请使用上传图片功能" : "Camera not supported on this device, please use upload instead";
    setCameraMessage(message);
    // 即使不支持，也尝试打开摄像头（某些浏览器可能仍然支持）
    console.log("[Camera] Attempting to open camera anyway despite cameraSupported=false");
  }
  
  console.log("[Camera] Setting activeCameraMode to:", mode);
  setCameraMessage(null);
  setActiveCameraMode(mode);
  return true;
};
```

**检查结果：** ❌ **没有任何登录/付费相关的检查**

**检查的条件：**
- ✅ `activeCameraMode` - 相机模式切换逻辑
- ✅ `isOnline` - 离线检查（已注释）
- ✅ `cameraSupported` - 设备支持检查
- ❌ **没有 `session` 检查**
- ❌ **没有 `isLoggedIn` 检查**
- ❌ **没有 `hasAccess` 检查**
- ❌ **没有 `isPro` 检查**
- ❌ **没有 `subscription` 检查**

### 2.3 session 的使用

**位置：** 第66行

```typescript
const { data: session, status: sessionStatus } = useSession();
```

**使用位置：**
- ✅ 第491行：提交时检查 `sessionStatus === "loading"`（仅用于等待登录状态加载完成）
- ✅ 第1490行：注释说明允许匿名用户提交
- ❌ **不在相机功能中使用**

---

## 3. 是否存在「未登录或未付费 → 禁用拍摄」的逻辑

### 3.1 检查结果

**✅ 结论：不存在「未登录或未付费 → 禁用拍摄」的逻辑**

### 3.2 详细检查

#### 3.2.1 相机按钮

**位置：** 第1382-1389行、第1437-1444行

**检查项：**
- ❌ 没有 `disabled={!session}` 属性
- ❌ 没有 `disabled={!isLoggedIn}` 属性
- ❌ 没有 `disabled={!hasAccess}` 属性
- ❌ 没有 `disabled={!isPro}` 属性
- ❌ 没有条件性的 `disabled` 类名
- ❌ 没有条件性的 CSS 样式

#### 3.2.2 handleRequestCamera 函数

**位置：** 第370-410行

**检查项：**
- ❌ 没有 `if (!session) return false;`
- ❌ 没有 `if (!isLoggedIn) return false;`
- ❌ 没有 `if (!hasAccess) return false;`
- ❌ 没有 `if (!isPro) return false;`
- ❌ 没有 `if (!subscription) return false;`

#### 3.2.3 拍照函数

**位置：** 第1655-1700行

**检查项：**
- ❌ 没有登录检查
- ❌ 没有付费检查
- ❌ 没有访问控制检查

---

## 4. 所有 V2 访问控制相关代码的位置

### 4.1 computeV2Access 使用位置

| 文件 | 行号 | 用途 |
|------|------|------|
| `src/app/[locale]/v2/analysis-result/page.tsx` | 第4行 | 导入 `computeV2Access` |
| `src/app/[locale]/v2/analysis-result/page.tsx` | 第43行 | 调用 `computeV2Access({ userId, reportId })` |
| `src/lib/access/v2Access.ts` | 第138-170行 | `computeV2Access` 函数定义 |

**⚠️ 注意：** `computeV2Access` **不在** `v2/analyze/page.tsx` 中使用。

### 4.2 V2AccessResult 使用位置

| 文件 | 行号 | 用途 |
|------|------|------|
| `src/app/[locale]/v2/analysis-result/V2AnalysisResultClient.tsx` | 第18行 | 导入 `V2AccessResult` 类型 |
| `src/app/[locale]/v2/analysis-result/V2AnalysisResultClient.tsx` | 第28行 | 使用 `access: V2AccessResult` prop |
| `src/lib/access/v2Access.ts` | 第127-131行 | `V2AccessResult` 接口定义 |

**⚠️ 注意：** `V2AccessResult` **不在** `v2/analyze/page.tsx` 中使用。

### 4.3 其他访问控制函数

| 函数 | 文件 | 行号 | 在 analyze 页面中使用？ |
|------|------|------|----------------------|
| `hasSingleReportAccess` | `src/lib/access/v2Access.ts` | 第12-42行 | ❌ 否 |
| `getActiveSubscription` | `src/lib/access/v2Access.ts` | 第48-94行 | ❌ 否 |
| `hasActiveSubscription` | `src/lib/access/v2Access.ts` | 第100-114行 | ❌ 否 |
| `calculateAccessLevel` | `src/lib/v2/accessLevel.ts` | 第35-70行 | ❌ 否 |

---

## 5. 总结

### 5.1 V2 访问控制代码在 analyze 页面中的使用

**✅ 结论：`/v2/analyze` 页面中没有任何 V2 访问控制相关的代码**

**未导入的模块：**
- ❌ `computeV2Access`
- ❌ `useV2Access`
- ❌ `usePricing`
- ❌ `StripeCheckout`
- ❌ `@/lib/access/v2Access`
- ❌ `@/lib/v2/accessLevel`

**唯一相关的导入：**
- ✅ `useSession` - 仅用于获取 session，不用于访问控制

### 5.2 「未登录或未付费 → 禁用拍摄」逻辑

**✅ 结论：不存在这样的逻辑**

**检查的所有位置：**
1. ✅ 相机按钮 JSX（第1382-1389行、第1437-1444行）
   - ❌ 没有 `disabled` 属性
   - ❌ 没有条件性的禁用类名
   - ❌ 没有条件性的 CSS 样式

2. ✅ `handleRequestCamera` 函数（第370-410行）
   - ❌ 没有 `if (!session) return false;`
   - ❌ 没有 `if (!isLoggedIn) return false;`
   - ❌ 没有 `if (!hasAccess) return false;`
   - ❌ 没有 `if (!isPro) return false;`

3. ✅ 拍照函数（第1655-1700行）
   - ❌ 没有登录检查
   - ❌ 没有付费检查

### 5.3 访问控制代码的实际使用位置

**只在结果页使用：**
- ✅ `src/app/[locale]/v2/analysis-result/page.tsx` - 使用 `computeV2Access`
- ✅ `src/app/[locale]/v2/analysis-result/V2AnalysisResultClient.tsx` - 使用 `V2AccessResult`

**不在分析页使用：**
- ❌ `src/app/[locale]/v2/analyze/page.tsx` - **没有任何访问控制代码**

---

## 6. 最终结论

### 6.1 V2 访问控制代码

**在 `/v2/analyze` 模块中：**
- ❌ **没有新增或修改任何 V2 访问控制相关的引用**
- ❌ **没有导入 `computeV2Access`、`useV2Access`、`usePricing`、`StripeCheckout` 等**
- ✅ **只导入了 `useSession`，但仅用于提交时的状态检查，不用于访问控制**

### 6.2 禁用拍摄逻辑

**✅ 不存在「未登录或未付费 → 禁用拍摄」的逻辑**

**具体检查：**
- ❌ 没有 `if (!session) disableCamera` 条件
- ❌ 没有 `if (!isLoggedIn) disableCamera` 条件
- ❌ 没有 `if (!hasAccess) disableCamera` 条件
- ❌ 没有 `if (!isPro) disableCamera` 条件
- ❌ 没有 `if (!subscription) disableCamera` 条件

**所有用户（包括未登录和免费用户）都可以使用拍摄功能。**


# PWA 和英文翻译修复清单

## 🔧 需要修复的问题

### 高优先级（必须修复）

#### 1. 创建 Service Worker 文件
**文件**: `public/service-worker.js`  
**状态**: ❌ 缺失  
**影响**: PWA 离线功能无法工作

**操作**: 创建 Service Worker 文件（基础版本）

#### 2. 创建 PWA 图标文件
**目录**: `public/icons/`  
**文件**: `icon-192.png`, `icon-512.png`  
**状态**: ❌ 缺失  
**影响**: PWA 安装可能失败

**操作**: 需要提供图标文件（不在代码修复范围内）

---

### 中优先级（建议修复）

#### 3. 修复 Manifest 多语言支持
**文件**: `app/manifest.ts`  
**问题**: `lang` 固定为 `"zh-CN"`，应该根据 locale 动态设置

**当前代码**:
```typescript
lang: "zh-CN",
```

**建议修复**: 根据当前 locale 动态设置（需要传入 locale 参数）

#### 4. 改进英文翻译准确性

**需要修复的翻译**:

| 位置 | 中文 | 当前英文 | 建议英文 |
|------|------|----------|----------|
| `V2AnalysisResultClient.tsx:720` | "解锁方式" | "Options" | "Unlock Options" |
| `PalmistryBlock.tsx:81` | "破财风险点" | "Risk Points" | "Wealth Risk Points" |
| `PalmistryBlock.tsx:82` | "聚财途径" | "Wealth Accumulation" | "Wealth Accumulation Methods" |
| `PalmistryBlock.tsx:140` | "掌纹深度解读 · 财富线局势" | "Palmistry Deep Insight" | "Palmistry Deep Insight · Wealth Line Analysis" |

---

## ✅ 已通过检查项

### PWA 布局适配
- ✅ PWA 检测 Hook 实现正确
- ✅ PWA 安全区域适配正确（`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`）
- ✅ PWA 模式下布局优化（简化 header，调整字体大小）

### 响应式设计
- ✅ 移动端适配完善（`@media (max-width: 768px)`）
- ✅ 容器内边距、字体大小、间距都针对移动端优化

### 英文翻译
- ✅ 大部分翻译准确
- ✅ 中文术语（如 "Zhong Qi", "Ming Qi", "Ganzhi"）正确保留
- ✅ 日期格式化支持多语言
- ✅ 心理学用语过滤函数（确保国学风格）

---

## 📝 详细修复建议

### 1. Service Worker 文件

需要创建 `public/service-worker.js`，基础版本：

```javascript
// 基础 Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 基础缓存策略
  event.respondWith(fetch(event.request));
});
```

### 2. Manifest 多语言支持

需要修改 `app/manifest.ts`，使其支持动态 locale（但 Next.js 的 manifest 路由不支持参数，可能需要使用中间件或客户端生成）

### 3. 英文翻译修复

需要修改以下文件：
- `app/[locale]/v2/analysis-result/V2AnalysisResultClient.tsx`
- `app/[locale]/v2/analysis-result/components/PalmistryBlock.tsx`

---

## 🎯 优先级总结

| 优先级 | 问题 | 影响 | 修复难度 |
|--------|------|------|----------|
| 🔴 高 | Service Worker 缺失 | PWA 离线功能无法工作 | 简单 |
| 🔴 高 | Icons 缺失 | PWA 安装可能失败 | 需要设计资源 |
| 🟡 中 | Manifest 多语言 | 用户体验 | 中等 |
| 🟡 中 | 英文翻译准确性 | 用户体验 | 简单 |


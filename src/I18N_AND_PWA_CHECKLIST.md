# 国际化（i18n）和 PWA 对齐检查清单

## 🔍 发现的问题

### 1. 根布局 metadata 未支持多语言 ❌
**文件**: `app/layout.tsx`
- 当前只有中文 title 和 description
- 需要根据 locale 动态设置

### 2. 部分页面 metadata 未支持多语言 ❌
需要检查所有页面的 metadata 是否支持多语言

### 3. PWA Manifest 配置缺失 ⚠️
- 未找到 manifest.json 文件
- 需要创建支持多语言的 manifest

### 4. Service Worker 配置 ⚠️
- 需要检查 service worker 是否支持多语言路由

---

## 📋 需要检查的页面列表

### 核心页面（必须支持英语）
- [x] `app/[locale]/page.tsx` - 首页 ✅
- [x] `app/[locale]/v2/analyze/page.tsx` - V2 分析页 ✅
- [x] `app/[locale]/v2/analysis-result/page.tsx` - V2 结果页 ✅
- [ ] `app/[locale]/pricing/page.tsx` - 定价页（需检查 metadata）
- [ ] `app/[locale]/account/page.tsx` - 账户页（metadata 只有中文）
- [ ] `app/[locale]/pro/page.tsx` - Pro 页
- [ ] `app/[locale]/v2/subscription/page.tsx` - 订阅页
- [ ] `app/[locale]/auth/sign-in/page.tsx` - 登录页
- [ ] `app/[locale]/privacy/page.tsx` - 隐私页
- [ ] `app/[locale]/about/page.tsx` - 关于页

### 其他页面
- [ ] `app/[locale]/dream/page.tsx`
- [ ] `app/[locale]/analyze/page.tsx`
- [ ] `app/[locale]/analysis-result/[id]/page.tsx`
- [ ] `app/[locale]/wallet/page.tsx`
- [ ] `app/[locale]/affiliate/page.tsx`
- [ ] 其他所有页面...

---

## 🔧 需要修复的内容

### 1. 根布局 metadata（高优先级）
- 创建动态 metadata 函数
- 根据 locale 返回对应的 title 和 description

### 2. 所有页面的 metadata
- 确保所有页面都有多语言 metadata
- 使用 `generateMetadata` 函数

### 3. PWA Manifest
- 创建 `public/manifest.json` 或使用 Next.js metadata API
- 支持多语言 name 和 description

### 4. Service Worker
- 确保 service worker 正确处理多语言路由
- 缓存策略考虑 locale

---

## 📝 修复计划

1. **修复根布局 metadata** - 支持多语言
2. **检查并修复所有页面的 metadata** - 确保都有英语版本
3. **创建 PWA manifest** - 支持多语言
4. **验证所有页面的英语版本** - 确保内容完整


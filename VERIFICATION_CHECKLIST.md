# 完整验证清单

## ✅ 代码层面检查

### 1. 只有一份 SolarCard 组件
- ✅ `src/components/SolarCard.tsx` 存在且唯一
- ✅ 没有 `SolarCardOld.tsx` 或 `TodayLuck.tsx`

### 2. 旧文案已清理
- ✅ 搜索 "查看完整版黄历" - 未找到
- ✅ 搜索 "基于今日节气与健康黄历的综合建议" - 未找到
- ✅ 搜索 "查看完整黄历" - 未找到

### 3. 首页使用正确
- ✅ `HomePage.tsx` 只 import `SolarCard` 一次
- ✅ 已移除旧的 props（doList, avoidList, healthTip, element）
- ✅ 只传递 `locale` 和 `name`

### 4. SolarCard 组件状态
- ✅ 使用硬编码常量 `MODERN_YI_ACTIONS` 和 `MODERN_JI_ACTIONS`
- ✅ 使用 styled-jsx（不是 Tailwind）
- ✅ 没有旧文案或传统黄历列表

## 🔍 Git 版本链路检查

### 当前状态
```bash
# 最新 commit
git log --oneline -1
# 输出: 518012ad (HEAD -> main, origin/main) feat: add feature status check...

# Git 状态
git status --short
# 输出: MM src/components/SolarCard.tsx (staged + unstaged 都有修改)
```

### 需要执行的步骤

1. **统一 Git 状态**
```bash
# 查看所有修改
git diff src/components/SolarCard.tsx
git diff --cached src/components/SolarCard.tsx

# 统一提交所有修改
git add src/components/SolarCard.tsx src/components/HomePage.tsx
git commit -m "fix: SolarCard 使用硬编码常量，移除旧 props"
git push origin main
```

2. **验证本地 dev**
```bash
npm run dev
# 或
pnpm dev
# 打开 http://localhost:3000/zh
# 检查「今日气运指数」是否显示：
# - 标签式宜/忌列表
# - 没有"查看完整版黄历"
# - 使用硬编码的现代化文案
```

3. **验证 Vercel 部署**
- 去 Vercel Dashboard → 项目 → Deployments
- 查看最新部署的 commit id
- 应该与 `git log -1 --oneline` 的 commit id 一致
- 如果不一致，说明 Vercel 部署的是旧版本

## 🎯 预期结果

### 本地 dev 应该显示：
- 节气名称 · 第X天
- 农历日期
- 今日五行：...
- 节气养生按钮
- 简短总结："阴阳均衡，宜稳步推进，少折腾多沉淀。"
- 左右两列卡片：
  - 宜：签约合作、学习进修、整理空间
  - 忌：动土破土、远距离搬迁

### 不应该出现：
- ❌ "查看完整版黄历"
- ❌ 传统黄历长列表
- ❌ `<details>` 折叠块
- ❌ 旧的 doList/avoidList props


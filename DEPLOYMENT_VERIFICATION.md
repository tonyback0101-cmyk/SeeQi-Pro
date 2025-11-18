# 部署验证步骤

## ✅ 已完成的修复

1. **代码层面**
   - ✅ 只有一份 `SolarCard.tsx` 组件
   - ✅ 使用硬编码常量 `MODERN_YI_ACTIONS` 和 `MODERN_JI_ACTIONS`
   - ✅ 移除所有旧文案（"查看完整版黄历"等）
   - ✅ `HomePage.tsx` 已移除旧 props（doList, avoidList, healthTip, element）

2. **Git 状态**
   - ✅ 已统一 Git 状态（移除冲突的 staged 修改）
   - ✅ 已提交新版本

## 🔍 验证步骤

### 1. 验证本地 dev（必须）

```bash
npm run dev
# 或
pnpm dev
```

打开 `http://localhost:3000/zh`，检查「今日气运指数」区域：

**应该显示：**
- ✅ 节气名称 · 第X天
- ✅ 农历日期
- ✅ 今日五行：...
- ✅ "节气养生"按钮
- ✅ 简短总结："阴阳均衡，宜稳步推进，少折腾多沉淀。"
- ✅ 左右两列标签卡片：
  - 宜：签约合作、学习进修、整理空间
  - 忌：动土破土、远距离搬迁

**不应该出现：**
- ❌ "查看完整版黄历"
- ❌ 传统黄历长列表
- ❌ `<details>` 折叠块

### 2. 验证 Git 版本链路

```bash
# 查看最新 commit
git log --oneline -1
# 应该显示：fix: SolarCard 使用硬编码常量...

# 确认已推送到远程
git push origin main
# 如果已经推送，会显示 "Everything up-to-date"
```

### 3. 验证 Vercel 部署

1. 去 Vercel Dashboard → 你的项目 → Deployments
2. 查看最新部署的 **Commit ID**
3. 对比本地 commit：
   ```bash
   git log --oneline -1
   ```
4. **如果 commit ID 一致**：✅ Vercel 已部署最新版本
5. **如果不一致**：
   - 检查 Vercel 项目设置 → Git Repository → Production Branch
   - 确认是 `main` 分支
   - 手动触发重新部署（Redeploy）

### 4. 验证线上版本

访问线上地址，检查「今日气运指数」是否与本地 dev 一致。

## 🚨 如果本地 dev 显示旧版本

说明代码还有问题，检查：
1. 是否有缓存：清除 `.next` 文件夹，重新 `npm run dev`
2. 是否有其他组件：搜索 `SolarCard` 的所有引用
3. 是否有内联 JSX：检查 `HomePage.tsx` 是否有直接写死的旧 JSX

## 🚨 如果本地是新版本，但线上是旧版本

说明是部署问题：
1. 确认 Vercel 部署的 commit ID 是否最新
2. 检查 Vercel 构建日志是否有错误
3. 手动触发 Vercel 重新部署


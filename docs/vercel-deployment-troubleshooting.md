# Vercel 部署问题排查指南

## 🔴 错误：404 DEPLOYMENT_NOT_FOUND

### 可能的原因

1. **部署链接已过期**
   - 预览部署链接有时效性
   - 部署被删除或清理

2. **访问了错误的 URL**
   - 使用了旧的部署 ID
   - 部署 ID 拼写错误

3. **部署还在进行中**
   - 部署尚未完成
   - 构建失败导致部署不存在

4. **项目配置问题**
   - Vercel 项目未正确连接
   - Git 仓库连接断开

## ✅ 解决方案

### 方案 1：检查 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目
3. 查看 **Deployments** 标签页
4. 确认最新的部署状态：
   - ✅ **Ready** - 部署成功，点击查看
   - 🔄 **Building** - 正在构建，等待完成
   - ❌ **Error** - 构建失败，查看错误日志
   - ⏸️ **Canceled** - 部署已取消

### 方案 2：重新部署

如果部署不存在或失败，可以触发新的部署：

#### 方法 A：通过 Git 推送触发
```bash
# 确保代码已提交
git status

# 推送到 GitHub（会自动触发 Vercel 部署）
git push origin main
```

#### 方法 B：通过 Vercel CLI
```bash
# 安装 Vercel CLI（如果未安装）
npm i -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod

# 或部署到预览环境
vercel
```

#### 方法 C：通过 Vercel Dashboard
1. 进入项目页面
2. 点击 **Deployments** 标签
3. 找到想要重新部署的版本
4. 点击 **⋯** 菜单 → **Redeploy**

### 方案 3：检查项目连接

1. 进入 Vercel Dashboard
2. 选择项目
3. 进入 **Settings** → **Git**
4. 确认：
   - ✅ Git 仓库已连接
   - ✅ 分支配置正确（通常是 `main` 或 `master`）
   - ✅ 自动部署已启用

### 方案 4：查看构建日志

1. 在 Vercel Dashboard 中打开项目
2. 进入 **Deployments** 标签
3. 点击失败的部署
4. 查看 **Build Logs** 和 **Function Logs**
5. 检查错误信息：
   - 环境变量缺失
   - 构建错误
   - 依赖安装失败

## 🔧 常见构建问题修复

### 问题 1：环境变量缺失

**症状**：构建成功但运行时错误

**解决**：
1. 进入 **Settings** → **Environment Variables**
2. 参考 `docs/vercel-env-vars-checklist.md` 配置所有必需变量
3. 确保变量已添加到正确的环境（Production/Preview/Development）
4. 点击 **Save** 后重新部署

### 问题 2：构建超时

**症状**：部署在构建阶段超时

**解决**：
- 检查 `next.config.mjs` 中的配置
- 优化构建过程（减少不必要的依赖）
- 考虑升级 Vercel 计划（Hobby 计划有 10 秒限制，Pro 计划有 60 秒）

### 问题 3：依赖安装失败

**症状**：`npm install` 失败

**解决**：
```bash
# 本地测试构建
npm install
npm run build

# 如果本地成功但 Vercel 失败，检查：
# 1. package.json 中的依赖版本
# 2. Node.js 版本（在 Vercel 设置中配置）
# 3. 是否有平台特定的依赖（如 sharp）
```

## 📋 部署检查清单

部署前确认：

- [ ] 代码已提交到 Git 仓库
- [ ] 所有必需的环境变量已配置
- [ ] 本地构建成功（`npm run build`）
- [ ] Vercel 项目已正确连接 Git 仓库
- [ ] 分支配置正确（自动部署的分支）
- [ ] 没有构建错误或警告

## 🚀 快速重新部署

如果只是需要重新部署，最快的方法是：

1. **通过 Git 推送**（推荐）
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push origin main
   ```

2. **通过 Vercel Dashboard**
   - 进入项目 → Deployments
   - 找到最新部署 → ⋯ → Redeploy

3. **通过 Vercel CLI**
   ```bash
   vercel --prod
   ```

## 📞 获取帮助

如果问题持续存在：

1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 检查 [Vercel Status](https://www.vercel-status.com/)
3. 在 Vercel Dashboard 中提交支持请求

## 🔍 调试技巧

### 查看实时日志
```bash
# 使用 Vercel CLI 查看日志
vercel logs [deployment-url]
```

### 本地测试生产构建
```bash
# 模拟生产环境构建
npm run build
npm start
```

### 检查环境变量
在 Vercel Dashboard 中：
- Settings → Environment Variables
- 确认所有变量已正确配置
- 注意变量作用域（Production/Preview/Development）


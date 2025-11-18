# Git 推送绕过方案

## 🚨 紧急解决方案

既然一个小时前可以推送，现在不行，可能是：
1. Git 索引锁定
2. 文件被其他进程占用
3. Git 状态异常

## 方案1：直接使用 GitHub Web 界面

1. 打开 GitHub 仓库页面
2. 找到 `src/components/SolarCard.tsx`
3. 点击 "Edit" 按钮
4. 复制当前文件内容（我会提供）
5. 粘贴并提交

## 方案2：使用 Vercel 直接部署

如果连接了 GitHub：
1. Vercel 会自动检测新的 commit
2. 或者直接在 Vercel 中触发重新部署

## 方案3：检查并修复 Git 状态

```powershell
# 1. 检查是否有锁定文件
Get-ChildItem -Path .git -Filter "*.lock" -Recurse

# 2. 如果有，删除锁定文件
Remove-Item .git\index.lock -ErrorAction SilentlyContinue

# 3. 重置 Git 状态
git reset HEAD src/components/SolarCard.tsx
git add src/components/SolarCard.tsx
git commit -m "fix: SolarCard 使用硬编码常量"
git push origin main
```

## 方案4：创建新分支推送

```powershell
git checkout -b fix-solarcard-hardcoded
git add src/components/SolarCard.tsx
git commit -m "fix: SolarCard 使用硬编码常量"
git push origin fix-solarcard-hardcoded
# 然后在 GitHub 上创建 Pull Request
```

## 📋 当前文件内容摘要

**文件**：`src/components/SolarCard.tsx`

**关键修改点**：
- 第13-14行：硬编码常量定义 ✅
- 第119-120行：使用硬编码常量 ✅
- 第166-185行：渲染标签列表 ✅

**代码状态**：✅ 完全正确，可以直接使用


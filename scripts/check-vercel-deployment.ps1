# Vercel 部署状态检查脚本
# 使用方法: .\scripts\check-vercel-deployment.ps1

Write-Host "=== Vercel 部署状态检查 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 状态
Write-Host "1. 检查 Git 状态..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "   有未提交的更改" -ForegroundColor Red
    Write-Host "   建议先提交并推送代码" -ForegroundColor Yellow
} else {
    Write-Host "   Git 工作区干净 ✓" -ForegroundColor Green
}

Write-Host ""

# 检查远程仓库
Write-Host "2. 检查远程仓库连接..." -ForegroundColor Yellow
$remote = git remote -v | Select-String "origin"
if ($remote) {
    Write-Host "   远程仓库: $remote" -ForegroundColor Green
} else {
    Write-Host "   未找到远程仓库" -ForegroundColor Red
}

Write-Host ""

# 检查最新提交
Write-Host "3. 最新提交记录..." -ForegroundColor Yellow
$latestCommit = git log --oneline -1
Write-Host "   $latestCommit" -ForegroundColor Cyan

Write-Host ""

# 提供操作建议
Write-Host "=== 操作建议 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "方法 1: 通过 Git 推送触发部署（推荐）" -ForegroundColor Green
Write-Host "   git push origin main" -ForegroundColor White
Write-Host "   这会自动触发 Vercel 部署" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 2: 通过 Vercel Dashboard" -ForegroundColor Green
Write-Host "   1. 访问 https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. 找到你的项目" -ForegroundColor White
Write-Host "   3. 进入 Deployments 标签" -ForegroundColor White
Write-Host "   4. 点击最新部署的 ⋯ → Redeploy" -ForegroundColor White
Write-Host ""
Write-Host "方法 3: 使用 Vercel CLI" -ForegroundColor Green
Write-Host "   npx vercel login" -ForegroundColor White
Write-Host "   npx vercel --prod" -ForegroundColor White
Write-Host ""



# Palm Module Deployment Plan

## 环境配置
- [ ] 更新 `.env.production`：
  - `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_PALM_BUCKET=palmprints`
  - 日志/告警相关的 Webhook URL（如 `SLACK_WEBHOOK`）
- [ ] 运行 Supabase migration（包含 palm 表、policies、logs 表）。
- [ ] 确认 Storage bucket `palmprints` 已存在且设置为私有。

## 构建与部署流程
1. `npm ci`、`npm run lint`、`npm run test -- --run`
2. `npm run build`
3. 部署 Next.js 应用（Vercel / 自建环境）：
   - 确认环境变量与 Supabase 安全策略同步
   - 启用 PWA 功能及 Service Worker 缓存
4. 运行 `supabase db push`（如使用 Supabase CLI）或手动执行 SQL 脚本。

## 监控与告警
- **应用监控**：
  - 接入 Vercel/Node 运行时日志，关注 `/api/palmprints/*` 响应时间与错误率
  - 打通 error tracking（如 Sentry）
- **存储/上传日志**：
  - 定期检查 `public.palm_upload_logs`
  - 建立 Dashboard 或脚本按日聚合上传/失败次数
- **告警通道**：
  - 配置 Slack/Webhook，当 `sync_failure` 连续超过阈值触发通知
  - Supabase Storage 访问日志异常告警（官方提供日志时）
- **备份与保留**：
  - 建议启用 Supabase 定期备份
  - 图片存储可绑定 CDN 并设置生命周期策略（如 180 天归档）

## 发布前检查
- [ ] 生产环境已执行最新迁移
- [ ] 环境变量与 bucket 策略验证通过
- [ ] QA checklist & Integration matrix 已全部通过
- [ ] 离线队列在生产环境实际测试

## 运维手册
- 故障节点：
  - 上传接口、离线同步、批量导入
- 处理流程：
  1. 查看日志表、前端 console
  2. 检查 Supabase 状态页
  3. 必要时回滚到上一版本
- 联系方式：
  - 技术负责人 / On-call 通道
  - 紧急联系 Supabase 支持

# Palm Module Launch Checklist

## Pre-Launch
- [ ] 所有 TODO、Issue 已关闭或明确延期
- [ ] `npm run lint && npm run test -- --run` 通过
- [ ] QA Checklist & Integration Matrix 全量通过
- [ ] Release Notes & User Guide 已审核

## Gray Release
- [ ] 选择内测用户/团队，发送上线通知
- [ ] 观察离线同步、批量导入、标注情况（24 小时）
- [ ] 监控 `palm_upload_logs` 与告警通道无异常
- [ ] 收集反馈并按需修复

## Full Rollout
- [ ] 将功能开放至全部目标用户
- [ ] 更新官网/帮助中心信息
- [ ] 发布对外交付说明（若适用）

## Post-Launch
- [ ] 一周后回顾指标：上传成功率、离线失败次数
- [ ] 记录版本号和上线日期
- [ ] 安排后续迭代或优化计划

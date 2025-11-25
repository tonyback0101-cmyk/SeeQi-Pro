# V2 结果页完整流程测试指南

## 测试环境
- 开发服务器：`http://localhost:3001`
- 生产环境：`https://seeqipro.vercel.app`

## 测试 URL 格式

### 1. 预览页（未登录）
```
http://localhost:3001/zh/v2/analysis-result?reportId=<你的reportId>
```

### 2. 登录页（带 redirect）
```
http://localhost:3001/zh/auth/sign-in?redirect=%2Fzh%2Fv2%2Fanalysis-result%3FreportId%3D<reportId>%26intent%3Dunlock
```

### 3. 支付成功回跳
```
http://localhost:3001/zh/v2/analysis-result?reportId=<reportId>&success=1
```

### 4. 支付取消回跳
```
http://localhost:3001/zh/v2/analysis-result?reportId=<reportId>&canceled=1
```

## 测试步骤

### 场景 1：未登录用户 → 登录 → 查看完整版（如果已是 Pro）

1. **打开预览页**
   - 访问：`http://localhost:3001/zh/v2/analysis-result?reportId=<reportId>`
   - ✅ 应显示：预览版内容（掌纹简批、舌苔简批、梦境简批、今日气运简版）
   - ✅ 应显示：底部「解锁完整报告」按钮

2. **点击「解锁完整报告」按钮**
   - ✅ 应跳转到：`/zh/auth/sign-in?redirect=...&intent=unlock`
   - ✅ URL 中的 `redirect` 参数应包含 `intent=unlock`

3. **完成登录**
   - ✅ 登录成功后应自动跳转回：`/zh/v2/analysis-result?reportId=<reportId>&intent=unlock`
   - ✅ 如果用户已是 Pro（`user_profiles.is_pro = true` 或已有订阅）：
     - 应直接显示完整版内容
     - 不应显示「解锁完整报告」按钮
   - ✅ 如果用户不是 Pro：
     - 应显示预览版内容
     - 应显示「解锁完整报告」按钮

### 场景 2：已登录但未付费用户 → 支付 → 查看完整版

1. **打开预览页（已登录）**
   - 访问：`http://localhost:3001/zh/v2/analysis-result?reportId=<reportId>`
   - ✅ 应显示：预览版内容
   - ✅ 应显示：底部「解锁完整报告」按钮

2. **点击「解锁完整报告」按钮**
   - ✅ 应直接调用 `/api/pay/checkout` API
   - ✅ 应跳转到 Stripe Checkout 页面
   - ✅ 检查浏览器控制台，确认 API 调用成功

3. **完成支付（使用 Stripe 测试卡）**
   - 测试卡号：`4242 4242 4242 4242`
   - 过期日期：任意未来日期
   - CVC：任意 3 位数字
   - ✅ 支付成功后应跳转回：`/zh/v2/analysis-result?reportId=<reportId>&success=1`

4. **验证完整版显示**
   - ✅ URL 应自动清理为：`/zh/v2/analysis-result?reportId=<reportId>`
   - ✅ 应显示完整版内容（ProFullReportSection）：
     - 掌纹详细分析
     - 舌象详细解读
     - 梦境深度解梦
     - 今日综合气运 + 修身节奏（完整版）
   - ✅ 不应显示「解锁完整报告」按钮

### 场景 3：已登录且已付费用户

1. **打开结果页**
   - 访问：`http://localhost:3001/zh/v2/analysis-result?reportId=<reportId>`
   - ✅ 应直接显示完整版内容
   - ✅ 不应显示「解锁完整报告」按钮

### 场景 4：支付取消

1. **点击「解锁完整报告」按钮**
   - ✅ 跳转到 Stripe Checkout

2. **取消支付**
   - ✅ 应跳转回：`/zh/v2/analysis-result?reportId=<reportId>&canceled=1`
   - ✅ URL 应自动清理为：`/zh/v2/analysis-result?reportId=<reportId>`
   - ✅ 应显示预览版内容
   - ✅ 应显示「解锁完整报告」按钮

## 关键检查点

### 1. 前端显示逻辑
- [ ] 预览区块始终显示（无论是否付费）
- [ ] 完整版内容仅在 `isPro === true` 时显示
- [ ] 解锁按钮仅在 `!isPro` 时显示

### 2. 登录重定向
- [ ] `redirect` 参数格式正确：`/${locale}/v2/analysis-result?reportId=${reportId}&intent=unlock`
- [ ] 登录成功后正确跳转回结果页
- [ ] `intent=unlock` 参数被正确传递

### 3. 支付 API
- [ ] `/api/pay/checkout` 请求体包含 `locale` 和 `reportId`
- [ ] Stripe Checkout Session 的 `success_url` 格式正确
- [ ] Stripe Checkout Session 的 `cancel_url` 格式正确
- [ ] metadata 包含 `user_id`、`mode: "single"`、`report_id`

### 4. 订单创建
- [ ] 订单记录在 `orders` 表中创建
- [ ] 订单字段正确：`kind: "single"`、`stripe_checkout_session_id`、`amount`
- [ ] 订单 `status` 初始为 `"pending"`

### 5. 访问级别计算
- [ ] `computeV2Access` 正确查询订单状态
- [ ] 支付成功后 `access.level` 变为 `"single_paid"`
- [ ] `access.hasFullAccess === true` 时显示完整版

### 6. URL 清理
- [ ] `success=1` 参数在显示后自动清理
- [ ] `canceled=1` 参数在显示后自动清理
- [ ] `intent=unlock` 参数不影响显示逻辑

## 调试工具

### 浏览器控制台
- 查看 `[PAY]` 开头的日志
- 查看网络请求（`/api/pay/checkout`）

### 数据库检查
```sql
-- 检查订单
SELECT * FROM orders WHERE report_id = '<reportId>' ORDER BY created_at DESC;

-- 检查用户 Pro 状态
SELECT user_id, is_pro FROM user_profiles WHERE user_id = '<userId>';

-- 检查订阅
SELECT * FROM subscriptions WHERE user_id = '<userId>' AND status = 'active';
```

### 服务器日志
- 查看 `[V2AnalysisResultPage]` 日志
- 查看 `[POST /api/pay/checkout]` 日志
- 查看 Stripe Webhook 日志（如果有）

## 常见问题排查

### 问题 1：点击按钮后没有跳转
- 检查浏览器控制台是否有错误
- 检查 `reportId` 是否存在
- 检查 `session` 是否正确获取

### 问题 2：支付成功后仍显示预览版
- 检查订单是否创建成功（数据库）
- 检查 `computeV2Access` 是否正确查询订单
- 检查 `isPro` 计算逻辑是否正确

### 问题 3：登录后没有自动跳转
- 检查 `UserAuth` 组件是否正确处理 `redirect` 参数
- 检查 `redirect` URL 格式是否正确

### 问题 4：Stripe Checkout 报错
- 检查 `.env.local` 中的 Stripe 密钥是否正确
- 检查 `STRIPE_FULL_REPORT_PRICE_ID` 是否存在
- 检查 `NEXT_PUBLIC_APP_URL` 是否正确设置

## 测试报告模板

```
测试日期：____
测试人员：____
测试环境：开发 / 生产

场景 1：未登录 → 登录 → 查看
- [ ] 预览页显示正常
- [ ] 点击按钮跳转登录页
- [ ] 登录后正确跳转回结果页
- [ ] Pro 用户直接显示完整版
- [ ] 非 Pro 用户显示预览版 + 按钮

场景 2：已登录 → 支付 → 查看
- [ ] 点击按钮跳转 Stripe Checkout
- [ ] 支付成功正确跳转回结果页
- [ ] 显示完整版内容
- [ ] 不显示解锁按钮

场景 3：已付费用户
- [ ] 直接显示完整版
- [ ] 不显示解锁按钮

场景 4：支付取消
- [ ] 取消后正确跳转回结果页
- [ ] 显示预览版内容
- [ ] 显示解锁按钮

问题记录：
1. 
2. 
3. 
```



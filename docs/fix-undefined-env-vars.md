# 修复 "undefined" 环境变量错误

## 🚨 当前错误

错误信息：
```
目标 production, preview, development 在分支上已存在名为"STRIPE_WEBHOOK_SECRET"的变量 undefined
```

**问题分析**：
- `STRIPE_WEBHOOK_SECRET` 变量已经在所有环境中存在
- 但是值为 `undefined`（未定义/空值）
- 这会导致应用运行时无法正确读取该变量

## ✅ 解决方案

### 方法 1：编辑现有变量（推荐）

1. **找到 `STRIPE_WEBHOOK_SECRET` 变量**
   - 在环境变量列表中定位该变量

2. **点击编辑图标（铅笔）**
   - 打开编辑对话框

3. **检查并修复值**
   - 如果 Value 字段为空或显示 `undefined`
   - 输入正确的值：`whsec_zn7HcYSTD8020gIGHB94NEXJxABVAoJ4`
   - 或者从 Stripe Dashboard 重新获取

4. **确认环境选择**
   - 确保选择了正确的环境（Production/Preview/Development）
   - 或者选择"所有环境"以确保所有环境都有正确的值

5. **保存更改**
   - 点击"救"（Save）按钮

### 方法 2：删除并重新创建

如果编辑不起作用：

1. **删除现有变量**
   - 点击 `STRIPE_WEBHOOK_SECRET` 右侧的删除图标（减号圆圈）
   - 确认删除

2. **重新添加变量**
   - 点击"+ 添加另一个"按钮
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_zn7HcYSTD8020gIGHB94NEXJ4`（或从 Stripe 获取的新值）
   - 环境：选择"所有环境"或根据需要选择

3. **保存**

## 🔍 检查其他变量

在修复 `STRIPE_WEBHOOK_SECRET` 的同时，请检查其他变量是否也有类似问题：

### 检查清单

- [ ] `STRIPE_SECRET_KEY` - 值是否正确（不是 `undefined`）
- [ ] `STRIPE_PUBLISHABLE_KEY` - 值是否正确，是否已重命名为 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` - 修复 `undefined` 问题 ✅

### 检查缺失的必需变量

确保以下变量都已添加且值不为空：

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXT_PUBLIC_APP_URL`

## 🔑 如何获取正确的 Stripe Webhook Secret

如果值丢失或不确定：

1. **登录 Stripe Dashboard**
   - 访问：https://dashboard.stripe.com
   - 确保在正确的模式（Test 或 Live）

2. **进入 Webhooks 设置**
   - 点击 **Developers** → **Webhooks**
   - 找到你的 webhook 端点

3. **获取 Secret**
   - 点击 webhook 端点
   - 在 **Signing secret** 部分
   - 点击 **Reveal** 或 **Click to reveal**
   - 复制完整的 secret（格式：`whsec_...`）

4. **如果 webhook 不存在**
   - 点击 **Add endpoint**
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - 选择要监听的事件
   - 创建后获取 signing secret

## 📋 完整修复步骤

### 步骤 1：修复 STRIPE_WEBHOOK_SECRET

1. 编辑现有变量或删除后重新创建
2. 确保值不为空且格式正确（以 `whsec_` 开头）
3. 选择正确的环境（建议"所有环境"）

### 步骤 2：检查所有 Stripe 变量

确保以下变量都已正确配置：

```
STRIPE_SECRET_KEY=sk_test_...（或 sk_live_...）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...（或 pk_live_...）
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 步骤 3：添加缺失的必需变量

参考 `docs/vercel-env-setup-guide.md` 添加所有必需变量。

### 步骤 4：保存并验证

1. 点击"救"（Save）按钮
2. 确认没有错误提示
3. 触发新部署：
   ```bash
   git commit --allow-empty -m "trigger redeploy after fixing env vars"
   git push origin main
   ```

## 🚨 常见问题

### Q: 为什么会出现 `undefined`？

**A:** 可能的原因：
1. 变量被创建时值未正确输入
2. 值在保存时丢失
3. 环境变量在不同环境间同步时出错
4. 手动删除或清空了值

### Q: 如何防止再次出现？

**A:** 
1. 添加变量时仔细检查值是否正确
2. 使用"导入.env"功能批量导入（更可靠）
3. 保存后立即验证变量值
4. 定期检查环境变量配置

### Q: 变量值显示为 `***` 是正常的吗？

**A:** 是的，这是正常的安全行为。Vercel 会隐藏敏感变量的值。只要变量存在且不为 `undefined`，应用就能正常读取。

## ✅ 验证修复

修复后，验证：

1. **检查变量列表**
   - 确认 `STRIPE_WEBHOOK_SECRET` 不再显示 `undefined`
   - 确认所有必需变量都已存在

2. **触发新部署**
   - 推送代码或手动触发部署
   - 检查构建日志，确认没有环境变量错误

3. **测试功能**
   - 测试支付功能（如果已配置）
   - 检查 Stripe webhook 是否正常工作

## 📞 需要帮助？

如果问题持续存在：
1. 检查 Vercel 构建日志中的具体错误
2. 确认 Stripe webhook 配置是否正确
3. 参考 `docs/vercel-env-setup-guide.md` 获取详细配置说明


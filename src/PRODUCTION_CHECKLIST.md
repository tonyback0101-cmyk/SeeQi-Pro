# 生产环境部署检查清单

## ⚠️ 关键风险点（未测试）

### 1. LLM 环节 🔴 高风险

#### 问题点：
- **无超时控制**：`app/api/llm/chat/route.ts` 没有设置请求超时
- **错误处理不完善**：只返回 500，没有重试机制
- **无降级策略**：LLM 失败时没有规则兜底
- **API Key 暴露风险**：需要确认 `OPENAI_API_KEY` 只在服务端使用

#### 必须修复：
```typescript
// app/api/llm/chat/route.ts
// 需要添加：
1. 请求超时（建议 30 秒）
2. 重试机制（最多 2 次）
3. 更详细的错误日志
4. 监控和告警
```

#### 环境变量检查：
- ✅ `OPENAI_API_KEY` - 必须配置
- ✅ `PENAI_BASE_URL` 或 `OPENAI_BASE_URL` - 可选，默认 OpenAI
- ⚠️ `LLM_FALLBACK_ENDPOINT` - 用于降级，建议配置

#### 建议：
1. 添加请求超时控制（30秒）
2. 实现重试机制（最多2次，指数退避）
3. 添加详细的错误日志和监控
4. 实现规则兜底机制（当 LLM 失败时使用规则引擎）

---

### 2. 支付环节 🔴 高风险

#### 问题点：
- **Webhook 签名验证**：已实现 ✅
- **重复支付检查**：已实现 ✅
- **订单状态同步**：已实现 ✅
- **错误处理**：部分实现，需要加强
- **测试环境配置**：需要确认生产环境使用 live key

#### 必须检查：
1. **Stripe 密钥**：
   - ✅ `STRIPE_SECRET_KEY` - 必须使用 **live key**（生产环境）
   - ✅ `STRIPE_WEBHOOK_SECRET` - 必须使用 **生产环境 webhook secret**
   - ✅ `STRIPE_FULL_REPORT_PRICE_ID` - 必须配置生产环境价格 ID

2. **Webhook 配置**：
   - ✅ 在 Stripe Dashboard 配置 webhook endpoint: `https://your-domain.com/api/stripe/webhook`
   - ✅ 订阅以下事件：
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **订单状态处理**：
   - ✅ 已实现：`checkout.session.completed` 处理
   - ✅ 已实现：订阅状态更新
   - ⚠️ 需要测试：支付失败后的退款处理

#### 潜在问题：
1. **并发支付**：同一用户同时发起多个支付请求可能导致重复订单
2. **Webhook 延迟**：如果 webhook 延迟，用户可能看不到已支付状态
3. **部分支付失败**：需要处理部分成功的情况

#### 建议：
1. 添加支付请求去重机制（基于 reportId + userId）
2. 实现支付状态轮询（前端定期检查订单状态）
3. 添加支付失败告警
4. 实现支付日志记录（用于审计）

---

## 📋 环境变量清单

### 服务器端必需变量：
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Stripe（生产环境必须使用 live key）
STRIPE_SECRET_KEY=sk_live_xxx  # ⚠️ 必须是 live key
STRIPE_WEBHOOK_SECRET=whsec_xxx  # ⚠️ 生产环境 webhook secret
STRIPE_FULL_REPORT_PRICE_ID=price_xxx  # 生产环境价格 ID

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com  # 可选

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 客户端必需变量：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🔍 代码检查点

### 1. LLM 调用
- [ ] `app/api/llm/chat/route.ts` - 添加超时控制
- [ ] `lib/llm/service.ts` - 检查错误处理
- [ ] 所有 LLM 调用点都有 try-catch

### 2. 支付流程
- [ ] `app/api/pay/checkout/route.ts` - 检查错误处理
- [ ] `app/api/stripe/webhook/route.ts` - 验证签名验证
- [ ] 订单状态更新逻辑正确

### 3. 数据库操作
- [ ] 所有 Supabase 操作都有错误处理
- [ ] 外键约束检查（session_id, report_id）
- [ ] 事务处理（如果需要）

### 4. 安全
- [ ] API 密钥不在客户端暴露
- [ ] Webhook 签名验证
- [ ] 用户认证检查

---

## 🚨 生产环境部署前必须完成

### 高优先级：
1. ✅ 配置所有必需的环境变量
2. ⚠️ **添加 LLM 请求超时控制**
3. ⚠️ **测试 Stripe webhook（使用 Stripe CLI）**
4. ⚠️ **验证支付流程（使用测试卡）**
5. ⚠️ **配置错误监控（Sentry 或其他）**

### 中优先级：
1. 实现 LLM 重试机制
2. 添加支付去重机制
3. 实现支付状态轮询
4. 添加详细日志记录

### 低优先级：
1. 性能优化
2. 缓存策略
3. CDN 配置

---

## 🧪 测试建议

### LLM 测试：
1. 测试 LLM API 调用成功
2. 测试 LLM API 调用失败（模拟网络错误）
3. 测试 LLM API 超时
4. 测试降级机制

### 支付测试：
1. 使用 Stripe 测试卡测试支付成功
2. 测试支付取消
3. 测试 webhook 接收和处理
4. 测试重复支付处理
5. 测试支付失败处理

### 集成测试：
1. 完整流程测试（上传 → 分析 → 支付 → 查看报告）
2. 并发测试
3. 错误恢复测试

---

## 📊 监控建议

### 必须监控：
1. LLM API 调用成功率
2. LLM API 响应时间
3. 支付成功率
4. Webhook 处理成功率
5. 错误率

### 告警设置：
1. LLM API 失败率 > 10%
2. 支付失败率 > 5%
3. Webhook 处理失败
4. 数据库连接失败

---

## 🔐 安全检查

- [ ] 所有 API 密钥使用环境变量
- [ ] Webhook 签名验证已启用
- [ ] 用户输入验证和清理
- [ ] SQL 注入防护（使用参数化查询）
- [ ] XSS 防护
- [ ] CSRF 防护

---

## 📝 部署步骤

1. **准备环境变量**
   - 在 Vercel 或其他平台配置所有必需变量
   - 确认使用生产环境的密钥

2. **配置 Stripe**
   - 创建生产环境价格
   - 配置 webhook endpoint
   - 订阅必需事件

3. **部署代码**
   - 部署到生产环境
   - 验证环境变量加载

4. **测试关键流程**
   - 测试 LLM 调用
   - 测试支付流程
   - 测试 webhook 接收

5. **监控和告警**
   - 配置错误监控
   - 设置告警规则

---

## ⚠️ 已知问题

1. **LLM 无超时控制** - 需要修复
2. **支付去重机制缺失** - 建议添加
3. **错误日志不够详细** - 建议改进

---

## 📞 紧急联系

如果生产环境出现问题：
1. 检查 Vercel 日志
2. 检查 Stripe Dashboard
3. 检查 Supabase Dashboard
4. 查看错误监控系统


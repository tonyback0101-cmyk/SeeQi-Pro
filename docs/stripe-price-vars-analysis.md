# Stripe 价格变量配置分析

## 📋 当前配置的变量

根据你的 `.env.local` 文件，以下价格变量已配置：

1. `STRIPE_FULL_REPORT_PRICE_ID`: `price_1SSALbDJRSZ0uK4U4D5Chnr1_1SSAbLDrJSZ0uK4Ud52Chmr1`
2. `NEXT_PUBLIC_STRIPE_PRICE_ONE`: `price_1SSALbDJRSZ0uK4U4D5Chnr1_1SSAbLDrJSZ0uK4Ud52Chmr1`
3. `STRIPE_PRICE_REPORT_ONE_USD`: `price_1SSqnTDrJSZ0uK4UUd2KfYeY`
4. `STRIPE_PRICE_SUB_MONTH_USD`: `price_1SSqp3DrJSZ0uK4UyVyCub2`
5. `STRIPE_PRICE_SUB_YEAR_USD`: `price_1SSqs6DrJSZ0uK4UTqbBj3bH`

## ⚠️ 发现的问题

### 问题 1：价格 ID 格式异常

**问题变量**：
- `STRIPE_FULL_REPORT_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_PRICE_ONE`

**当前值**：
```
price_1SSALbDJRSZ0uK4U4D5Chnr1_1SSAbLDrJSZ0uK4Ud52Chmr1
```

**问题分析**：
- 这个值看起来像是两个价格 ID 拼接在一起
- 正常的 Stripe 价格 ID 格式应该是：`price_xxxxxxxxxxxxx`（单个 ID）
- 当前值包含两个下划线分隔的部分，格式不正确

**正确的格式应该是**：
```
price_1SSALbDJRSZ0uK4U4D5Chnr1
```
或
```
price_1SSAbLDrJSZ0uK4Ud52Chmr1
```

### 问题 2：变量命名不一致

**已配置但可能未使用**：
- `NEXT_PUBLIC_STRIPE_PRICE_ONE` - 代码中会查找，但可能不是主要使用的变量

## ✅ 正确的配置

### 代码期望的变量（按优先级）

#### 1. 单次报告价格（Lifetime/One-time）
代码会按以下顺序查找：
1. `STRIPE_FULL_REPORT_PRICE_ID` ⭐ **主要使用**
2. `NEXT_PUBLIC_STRIPE_PRICE_ONE` 
3. `NEXT_PUBLIC_STRIPE_FULL_PRICE_ID`
4. `STRIPE_PRICE_REPORT_ONE_USD` ⭐ **备用**
5. `STRIPE_PRO_PRICE_LIFETIME`
6. `STRIPE_PRO_PRICE_ID`

#### 2. 月度订阅价格
代码会按以下顺序查找：
1. `STRIPE_PRO_PRICE_MONTH`
2. `STRIPE_PRICE_SUB_MONTH_USD` ⭐ **已配置**
3. `STRIPE_PRICE_SUP_MONTH_USD`

#### 3. 年度订阅价格
代码会按以下顺序查找：
1. `STRIPE_PRO_PRICE_YEAR`
2. `STRIPE_PRICE_SUB_YEAR_USD` ⭐ **已配置**
3. `STRIPE_PRICE_SUP_YEAR_USD`

## 🔧 修复建议

### 步骤 1：修复 `STRIPE_FULL_REPORT_PRICE_ID`

**问题**：当前值格式不正确（看起来是两个 ID 拼接）

**解决方案**：
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Products** → 找到你的单次报告产品
3. 复制正确的价格 ID（格式：`price_xxxxxxxxxxxxx`）
4. 更新 `.env.local` 中的值：
   ```
   STRIPE_FULL_REPORT_PRICE_ID=price_xxxxxxxxxxxxx
   ```

### 步骤 2：修复 `NEXT_PUBLIC_STRIPE_PRICE_ONE`

**选项 A**：如果与 `STRIPE_FULL_REPORT_PRICE_ID` 相同
- 使用相同的价格 ID

**选项 B**：如果不需要，可以删除
- 代码会回退到其他变量

### 步骤 3：验证价格 ID

在 Stripe Dashboard 中验证：
1. 每个价格 ID 都应该对应一个有效的产品
2. 价格 ID 格式：`price_` + 24个字符
3. 确认价格类型（one-time 或 recurring）

## 📝 推荐的完整配置

### 必需变量（单次报告）
```env
STRIPE_FULL_REPORT_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRICE_REPORT_ONE_USD=price_1SSqnTDrJSZ0uK4UUd2KfYeY  # 已配置 ✅
```

### 必需变量（订阅）
```env
STRIPE_PRICE_SUB_MONTH_USD=price_1SSqp3DrJSZ0uK4UyVyCub2  # 已配置 ✅
STRIPE_PRICE_SUB_YEAR_USD=price_1SSqs6DrJSZ0uK4UTqbBj3bH  # 已配置 ✅
```

### 可选变量（备用）
```env
NEXT_PUBLIC_STRIPE_PRICE_ONE=price_xxxxxxxxxxxxx  # 如果需要客户端访问
```

## ✅ 验证清单

配置完成后，确认：

- [ ] `STRIPE_FULL_REPORT_PRICE_ID` 格式正确（单个 price ID）
- [ ] `STRIPE_PRICE_REPORT_ONE_USD` 已配置 ✅
- [ ] `STRIPE_PRICE_SUB_MONTH_USD` 已配置 ✅
- [ ] `STRIPE_PRICE_SUB_YEAR_USD` 已配置 ✅
- [ ] 所有价格 ID 在 Stripe Dashboard 中验证有效
- [ ] 价格类型正确（one-time vs recurring）

## 🔍 如何验证价格 ID

### 方法 1：在 Stripe Dashboard 中
1. 登录 Stripe Dashboard
2. 进入 **Products**
3. 点击产品 → 查看价格
4. 复制价格 ID（格式：`price_xxxxxxxxxxxxx`）

### 方法 2：使用 Stripe API
```bash
# 测试价格 ID 是否有效
curl https://api.stripe.com/v1/prices/price_xxxxxxxxxxxxx \
  -u sk_test_xxxxxxxxxxxxx:
```

### 方法 3：在代码中测试
部署后，检查应用日志，确认价格信息正确加载。

## 🚨 常见错误

1. **价格 ID 格式错误**：包含多个 ID 或格式不正确
2. **价格 ID 不存在**：在 Stripe 中已删除或不存在
3. **价格类型不匹配**：使用 recurring 价格作为 one-time
4. **环境不一致**：Test 和 Live 模式的价格 ID 混用

## 📞 需要帮助？

如果价格 ID 有问题：
1. 检查 Stripe Dashboard 中的实际价格 ID
2. 确认使用的是 Test 还是 Live 模式
3. 验证价格类型是否正确



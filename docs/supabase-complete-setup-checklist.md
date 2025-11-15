# Supabase 完整配置清单

## 📋 配置状态总览

本文档列出所有需要在 Supabase 上配置的内容，标注已设置和未设置的项目，并提供详细的配置步骤。

---

## 一、数据库表（Tables）

### ✅ 1.1 核心表（已创建）

#### `sessions` - 会话表
- **状态**: ✅ 已创建（`20251112_mvp_core.sql`）
- **用途**: 存储用户会话信息
- **验证**: 在 Supabase Dashboard → Table Editor 中检查是否存在

#### `uploads` - 上传记录表
- **状态**: ✅ 已创建（`20251112_mvp_core.sql`）
- **用途**: 存储图片上传记录（手掌、舌苔）
- **验证**: 检查表是否存在

#### `reports` - 报告表
- **状态**: ✅ 已创建（`20251112_mvp_core.sql`）
- **用途**: 存储分析报告数据
- **验证**: 检查表是否存在，确认包含以下字段：
  - `id`, `session_id`, `constitution`, `palm_result`, `tongue_result`
  - `solar_term`, `advice`, `dream`, `quote`, `locale`, `unlocked`
  - `qi_index`（需要确认是否已添加）

#### `orders` - 订单表
- **状态**: ⚠️ **需要合并两个版本**
- **问题**: 存在两个不同的 `orders` 表定义
  - `20251112_mvp_core.sql` - 基础版本
  - `20251110_affiliate_wallet.sql` - 扩展版本（包含 affiliate 字段）
- **操作**: 需要合并字段，确保包含以下字段：
  ```sql
  -- 基础字段（来自 mvp_core）
  id, user_id, session_id, report_id, status, currency, amount_cents
  payment_provider, provider_intent_id, metadata
  
  -- 扩展字段（来自 affiliate_wallet）
  product_id, product_type, provider_session_id, provider_customer_id
  provider_subscription_id, amount (numeric), locale, referrer_user_id
  referrer_level
  ```
- **配置位置**: Supabase Dashboard → SQL Editor
- **方法**: 执行合并 SQL（见下方）

#### `dict_constitution` - 体质字典表
- **状态**: ✅ 已创建（`20251112_mvp_core.sql`）
- **扩展字段**: ✅ 已添加（`20251112_extend_dict_tables.sql`）
- **用途**: 存储体质类型定义
- **需要数据**: ⚠️ **需要导入数据**
- **配置位置**: Supabase Dashboard → Table Editor → `dict_constitution`
- **方法**: 手动插入或导入 CSV
- **示例数据**:
  ```sql
  INSERT INTO public.dict_constitution (code, name_zh, name_en, desc_zh, desc_en, feature, advice_diet, advice_activity, advice_acupoint)
  VALUES 
    ('qi_deficiency', '气虚', 'Qi Deficiency', '气虚体质描述...', 'Qi deficiency description...', '特征描述', '饮食建议', '活动建议', '穴位建议'),
    ('yang_deficiency', '阳虚', 'Yang Deficiency', '阳虚体质描述...', 'Yang deficiency description...', '特征描述', '饮食建议', '活动建议', '穴位建议');
  ```
- **目的**: 为体质分析提供基础数据

#### `dict_solar_term` - 节气字典表
- **状态**: ✅ 已创建（`20251112_mvp_core.sql`）
- **扩展字段**: ✅ 已添加（`20251112_extend_dict_tables.sql`）
- **用途**: 存储二十四节气信息
- **需要数据**: ⚠️ **需要导入数据**
- **配置位置**: Supabase Dashboard → Table Editor → `dict_solar_term`
- **方法**: 手动插入或导入 CSV
- **示例数据**:
  ```sql
  INSERT INTO public.dict_solar_term (code, name_zh, name_en, do_zh, avoid_zh, do_en, avoid_en, element, health_tip)
  VALUES 
    ('spring_equinox', '春分', 'Spring Equinox', 
     ARRAY['早睡早起', '适度运动'], 
     ARRAY['熬夜', '过度劳累'], 
     ARRAY['Early sleep', 'Moderate exercise'], 
     ARRAY['Stay up late', 'Overwork'], 
     'wood', '春季养生建议...');
  ```
- **目的**: 为节气分析提供基础数据

#### `dream_keywords` - 梦境关键词表
- **状态**: ✅ 已创建（`20251112_mvp_core.sql`）
- **用途**: 存储梦境分析关键词
- **需要数据**: ⚠️ **需要导入数据**
- **配置位置**: Supabase Dashboard → Table Editor → `dream_keywords`
- **方法**: 批量导入关键词数据
- **示例数据**:
  ```sql
  INSERT INTO public.dream_keywords (keyword, locale, category, five_element, emotion, meaning_zh, meaning_en, health_tip_zh, health_tip_en)
  VALUES 
    ('水', 'zh', 'nature', 'water', 'calm', '水的含义...', 'Water meaning...', '健康建议...', 'Health tip...'),
    ('火', 'zh', 'nature', 'fire', 'passion', '火的含义...', 'Fire meaning...', '健康建议...', 'Health tip...');
  ```
- **目的**: 为梦境分析提供关键词匹配数据

### ✅ 1.2 用户相关表（已创建）

#### `user_profiles` - 用户资料表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 存储用户资料、推荐码、钱包余额
- **验证**: 检查表是否存在，确认包含以下字段：
  - `user_id`, `ref_code`, `inviter_id`, `locale`, `default_currency`
  - `kyc_status`, `wallet_balance`, `wallet_pending`, `payout_method`, `settings`

#### `affiliate_links` - 推荐链接表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 存储用户的推荐链接
- **验证**: 检查表是否存在

#### `wallet_transactions` - 钱包交易表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 记录所有钱包交易
- **验证**: 检查表是否存在

#### `commission_records` - 佣金记录表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 记录推荐佣金
- **验证**: 检查表是否存在

#### `payout_requests` - 提现请求表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 记录用户提现请求
- **验证**: 检查表是否存在

#### `assessment_records` - 评估记录表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 同步客户端评估数据
- **验证**: 检查表是否存在

#### `exchange_rates` - 汇率表
- **状态**: ✅ 已创建（`20251110_affiliate_wallet.sql`）
- **用途**: 存储汇率快照
- **验证**: 检查表是否存在

### ✅ 1.3 掌纹相关表（已创建）

#### `palm_prints` - 掌纹记录表
- **状态**: ✅ 已创建（`20251111_palm_prints.sql`）
- **用途**: 存储用户上传的掌纹图片记录
- **验证**: 检查表是否存在

#### `palm_features` - 掌纹特征表
- **状态**: ✅ 已创建（`20251111_palm_prints.sql`）
- **用途**: 存储掌纹特征标注
- **验证**: 检查表是否存在

#### `palm_upload_logs` - 掌纹上传日志表
- **状态**: ✅ 已创建（`supabase/policies/palm_prints_policies.sql`）
- **用途**: 记录掌纹上传和同步事件
- **验证**: 检查表是否存在

### ✅ 1.4 其他表（已创建）

#### `report_access` - 报告访问表
- **状态**: ✅ 已创建（`20251113_report_access.sql`）
- **用途**: 记录报告访问权限
- **验证**: 检查表是否存在

#### `privacy_consents` - 隐私同意表
- **状态**: ✅ 已创建（`20251113_privacy_and_cleanup.sql`）
- **用途**: 记录用户隐私同意
- **验证**: 检查表是否存在

#### `cleanup_jobs` - 清理任务表
- **状态**: ✅ 已创建（`20251113_privacy_and_cleanup.sql`）
- **用途**: 记录数据清理任务
- **验证**: 检查表是否存在

#### `app_settings` - 应用设置表
- **状态**: ✅ 已创建（`20251111_app_settings.sql`）
- **用途**: 存储应用配置
- **验证**: 检查表是否存在

#### `report_email_queue` - 报告邮件队列表
- **状态**: ✅ 已创建（`20251111_report_email_queue.sql`）
- **用途**: 存储待发送的报告邮件
- **验证**: 检查表是否存在

---

## 二、存储桶（Storage Buckets）

### ✅ 2.1 `palmprints` - 掌纹图片存储桶
- **状态**: ✅ 已创建（`20251111_palm_prints.sql`）
- **用途**: 存储用户上传的掌纹图片
- **配置位置**: Supabase Dashboard → Storage → Buckets
- **验证**: 
  1. 进入 Storage → Buckets
  2. 确认 `palmprints` 桶存在
  3. 检查是否为私有桶（`public: false`）

### ✅ 2.2 `analysis-temp` - 分析临时存储桶
- **状态**: ✅ 已创建（`20251112_analysis_storage.sql`）
- **用途**: 临时存储分析过程中的图片
- **配置位置**: Supabase Dashboard → Storage → Buckets
- **验证**: 确认 `analysis-temp` 桶存在

### ❌ 2.3 `rules` - 规则引擎存储桶
- **状态**: ❌ **未创建**
- **用途**: 存储规则引擎的 JSONL 规则文件
- **配置位置**: Supabase Dashboard → Storage → Buckets
- **方法**:
  1. 进入 Storage → Buckets
  2. 点击 "New bucket"
  3. 填写信息：
     - **Name**: `rules`
     - **Public**: `false`（私有）
  4. 点击 "Create bucket"
- **目的**: 用于存储和版本管理规则引擎的规则文件
- **后续配置**: 需要配置存储策略（见下方）

---

## 三、行级安全策略（RLS Policies）

### ⚠️ 3.1 表级 RLS
- **状态**: ⚠️ **需要检查**
- **配置位置**: Supabase Dashboard → Authentication → Policies
- **方法**: 
  1. 进入每个表
  2. 检查是否启用了 RLS
  3. 根据业务需求配置策略
- **需要配置的表**:
  - `user_profiles` - 用户只能访问自己的资料
  - `palm_prints` - 用户只能访问自己的掌纹
  - `reports` - 根据访问权限控制
  - `orders` - 用户只能访问自己的订单
  - `wallet_transactions` - 用户只能访问自己的交易
  - `commission_records` - 用户只能访问自己的佣金
  - `payout_requests` - 用户只能访问自己的提现请求

### ✅ 3.2 存储桶策略
- **状态**: ✅ 部分已配置
- **`palmprints` 桶策略**: ✅ 已配置（`palm_prints_policies.sql`）
- **`analysis-temp` 桶策略**: ⚠️ **需要配置**
- **`rules` 桶策略**: ❌ **未配置**

#### 配置 `analysis-temp` 桶策略
- **配置位置**: Supabase Dashboard → Storage → Buckets → `analysis-temp` → Policies
- **方法**: 添加以下策略
  ```sql
  -- Service Role 完全访问（用于服务器端上传）
  CREATE POLICY "Service Role Full Access"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'analysis-temp')
  WITH CHECK (bucket_id = 'analysis-temp');
  ```

#### 配置 `rules` 桶策略
- **配置位置**: Supabase Dashboard → Storage → Buckets → `rules` → Policies
- **方法**: 执行 `docs/supabase-rules-storage-setup.sql` 中的策略配置
- **或手动添加**:
  ```sql
  -- Service Role 完全访问
  CREATE POLICY "Service Role Full Access"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'rules')
  WITH CHECK (bucket_id = 'rules');
  ```

---

## 四、数据库函数（Functions）

### ✅ 4.1 已创建的函数

#### `fn_touch_user_profiles()` - 更新用户资料时间戳
- **状态**: ✅ 已创建
- **用途**: 自动更新 `updated_at` 字段

#### `fn_touch_updated_at()` - 通用更新时间戳
- **状态**: ✅ 已创建
- **用途**: 自动更新表的 `updated_at` 字段

#### `fn_create_user_profile()` - 创建用户资料
- **状态**: ✅ 已创建
- **用途**: 当新用户注册时自动创建用户资料

#### `fn_increment_wallet_balance()` - 增加钱包余额
- **状态**: ✅ 已创建
- **用途**: 原子性地增加用户钱包余额
- **参数**: `p_user_id uuid`, `p_delta numeric`
- **返回**: 新的余额

#### `fn_adjust_wallet_pending()` - 调整待处理金额
- **状态**: ✅ 已创建
- **用途**: 原子性地调整待处理金额
- **参数**: `p_user_id uuid`, `p_delta numeric`
- **返回**: 新的待处理金额

#### `touch_orders_updated_at()` - 更新订单时间戳
- **状态**: ✅ 已创建
- **用途**: 自动更新订单的 `updated_at` 字段

#### `touch_report_access_updated_at()` - 更新报告访问时间戳
- **状态**: ✅ 已创建
- **用途**: 自动更新报告访问的 `updated_at` 字段

---

## 五、触发器（Triggers）

### ✅ 5.1 已创建的触发器

#### `trg_user_profile_on_users` - 用户注册触发器
- **状态**: ✅ 已创建
- **用途**: 当 `auth.users` 表插入新用户时，自动创建 `user_profiles` 记录

#### `trg_touch_user_profiles` - 用户资料更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `user_profiles` 时自动更新 `updated_at`

#### `trg_touch_orders` - 订单更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `orders` 时自动更新 `updated_at`

#### `trg_touch_palm_prints` - 掌纹更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `palm_prints` 时自动更新 `updated_at`

#### `trg_touch_commission_records` - 佣金记录更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `commission_records` 时自动更新 `updated_at`

#### `trg_touch_assessment_records` - 评估记录更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `assessment_records` 时自动更新 `updated_at`

#### `trg_touch_affiliate_links` - 推荐链接更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `affiliate_links` 时自动更新 `updated_at`

#### `trg_touch_report_access` - 报告访问更新时间戳
- **状态**: ✅ 已创建
- **用途**: 更新 `report_access` 时自动更新 `updated_at`

---

## 六、索引（Indexes）

### ✅ 6.1 已创建的索引

所有表的主要索引已在迁移文件中创建，包括：
- `sessions_created_at_idx`
- `uploads_session_idx`
- `reports_session_idx`, `reports_created_at_idx`, `reports_expires_at_idx`, `reports_qi_index_idx`
- `orders_session_idx`, `orders_status_idx`, `idx_orders_provider_session_id`
- `palm_prints_user_idx`
- `palm_features_palmprint_idx`
- `palm_upload_logs_user_idx`
- `dream_keywords_keyword_locale_idx`
- `user_profiles` 相关索引
- `wallet_transactions` 相关索引
- `commission_records` 相关索引
- `payout_requests` 相关索引
- `assessment_records` 相关索引
- `report_email_queue` 相关索引

**验证**: 在 Supabase Dashboard → Database → Indexes 中检查所有索引是否存在

---

## 七、规则引擎配置

### ❌ 7.1 规则存储桶
- **状态**: ❌ **未创建**（见 2.3）

### ❌ 7.2 规则文件上传
- **状态**: ❌ **未上传**
- **配置位置**: Supabase Dashboard → Storage → Buckets → `rules`
- **方法**:
  1. 创建 `rules` 存储桶（见 2.3）
  2. 上传规则文件（`.jsonl` 格式）
  3. 规则文件位置：`src/lib/rules/*.jsonl`
  4. 上传到存储桶的根目录或相应子目录
- **示例规则文件**:
  ```jsonl
  {"id":"palm_ruddy_deep_life","priority":60,"when":{"palm.color":"pink","palm.lines.life":"deep"},"then":{"advice":{"lifestyle":["适度耐力训练"],"exercise":["快走或慢跑20-30分钟"]}},"merge":"append"}
  ```
- **目的**: 为规则引擎提供规则数据源

### ⚠️ 7.3 规则引擎环境变量
- **状态**: ⚠️ **需要配置**
- **变量名**: `RULES_DIR_PATH`（可选）
- **默认值**: `src/lib/rules`（本地文件系统）
- **如果使用 Supabase Storage**: 需要配置存储桶路径
- **配置位置**: Vercel Dashboard → Environment Variables
- **方法**: 
  - 如果使用本地文件：不需要配置（使用默认值）
  - 如果使用 Supabase Storage：需要配置存储桶访问路径

---

## 八、字典数据导入

### ❌ 8.1 体质字典数据
- **状态**: ❌ **未导入**
- **表**: `dict_constitution`
- **配置位置**: Supabase Dashboard → Table Editor → `dict_constitution`
- **方法**: 
  1. 准备 CSV 文件或 SQL 插入语句
  2. 在 Table Editor 中点击 "Insert" 或使用 SQL Editor 执行 INSERT
- **必需字段**: `code`, `name_zh`, `name_en`, `desc_zh`, `desc_en`
- **可选字段**: `feature`, `advice_diet`, `advice_activity`, `advice_acupoint`
- **示例数据**: 见 1.1 节
- **目的**: 为体质分析提供基础数据

### ❌ 8.2 节气字典数据
- **状态**: ❌ **未导入**
- **表**: `dict_solar_term`
- **配置位置**: Supabase Dashboard → Table Editor → `dict_solar_term`
- **方法**: 同上
- **必需字段**: `code`, `name_zh`, `name_en`, `do_zh`, `avoid_zh`, `do_en`, `avoid_en`
- **可选字段**: `element`, `health_tip`
- **示例数据**: 见 1.1 节
- **目的**: 为节气分析提供基础数据

### ❌ 8.3 梦境关键词数据
- **状态**: ❌ **未导入**
- **表**: `dream_keywords`
- **配置位置**: Supabase Dashboard → Table Editor → `dream_keywords`
- **方法**: 同上
- **必需字段**: `keyword`, `locale`
- **可选字段**: `category`, `five_element`, `emotion`, `meaning_zh`, `meaning_en`, `health_tip_zh`, `health_tip_en`
- **示例数据**: 见 1.1 节
- **目的**: 为梦境分析提供关键词匹配数据

---

## 九、合并 orders 表

### ⚠️ 9.1 合并 orders 表字段
- **状态**: ⚠️ **需要合并**
- **问题**: 两个迁移文件定义了不同的 `orders` 表结构
- **配置位置**: Supabase Dashboard → SQL Editor
- **方法**: 执行以下 SQL 合并字段

```sql
-- 合并 orders 表字段
-- 如果字段已存在，ALTER TABLE 会忽略（使用 IF NOT EXISTS）

-- 添加来自 affiliate_wallet 的字段
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS provider_session_id text,
  ADD COLUMN IF NOT EXISTS provider_customer_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS amount numeric(14, 2),
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS referrer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrer_level smallint,
  ADD COLUMN IF NOT EXISTS plan_key text,
  ADD COLUMN IF NOT EXISTS price_id text;

-- 如果 amount_cents 存在但 amount 不存在，从 amount_cents 计算 amount
UPDATE public.orders
SET amount = amount_cents / 100.0
WHERE amount IS NULL AND amount_cents IS NOT NULL;

-- 创建唯一索引（如果不存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_session_id 
ON public.orders(provider_session_id)
WHERE provider_session_id IS NOT NULL;

-- 添加其他索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
```

---

## 十、验证清单

### ✅ 数据库表验证
- [ ] 所有表都已创建
- [ ] `orders` 表字段已合并
- [ ] 所有索引都已创建
- [ ] 所有触发器都已创建
- [ ] 所有函数都已创建

### ✅ 存储桶验证
- [ ] `palmprints` 桶存在且为私有
- [ ] `analysis-temp` 桶存在且为私有
- [ ] `rules` 桶已创建（如果使用）

### ✅ 策略验证
- [ ] `palmprints` 桶策略已配置
- [ ] `analysis-temp` 桶策略已配置
- [ ] `rules` 桶策略已配置（如果使用）
- [ ] 表级 RLS 策略已配置（根据需要）

### ✅ 数据验证
- [ ] `dict_constitution` 数据已导入
- [ ] `dict_solar_term` 数据已导入
- [ ] `dream_keywords` 数据已导入

### ✅ 功能验证
- [ ] 用户注册时自动创建 `user_profiles`
- [ ] 钱包余额更新函数正常工作
- [ ] 订单时间戳自动更新
- [ ] 报告访问权限正常

---

## 十一、快速配置 SQL 脚本

### 11.1 合并 orders 表
见 九、合并 orders 表

### 11.2 创建 rules 存储桶
```sql
-- 在 Supabase Dashboard → Storage → Buckets 中手动创建
-- 或使用以下 SQL（如果支持）
INSERT INTO storage.buckets (id, name, public)
VALUES ('rules', 'rules', false)
ON CONFLICT (id) DO NOTHING;
```

### 11.3 配置存储桶策略
见 `docs/supabase-rules-storage-setup.sql`

---

## 十二、配置优先级

### 🔴 高优先级（必须配置）
1. ✅ 合并 `orders` 表字段
2. ❌ 导入字典数据（`dict_constitution`, `dict_solar_term`, `dream_keywords`）
3. ⚠️ 配置存储桶策略（`analysis-temp`）

### 🟡 中优先级（建议配置）
4. ❌ 创建 `rules` 存储桶（如果使用规则引擎存储）
5. ⚠️ 配置表级 RLS 策略（根据安全需求）

### 🟢 低优先级（可选配置）
6. ⚠️ 优化索引（根据查询性能）
7. ⚠️ 配置数据清理任务

---

## 十三、配置完成后测试

### 13.1 功能测试
1. **用户注册**: 验证 `user_profiles` 自动创建
2. **图片上传**: 验证 `uploads` 表记录
3. **报告生成**: 验证 `reports` 表记录
4. **支付流程**: 验证 `orders` 表记录
5. **钱包功能**: 验证 `wallet_transactions` 表记录
6. **推荐功能**: 验证 `commission_records` 表记录

### 13.2 数据验证
1. 检查字典数据是否正确导入
2. 检查所有表的主键和外键关系
3. 检查索引是否正常工作

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Supabase Dashboard 的日志
2. 验证 SQL 脚本执行是否成功
3. 检查表结构和字段类型
4. 验证外键关系是否正确

---

**配置完成后，你的 Supabase 数据库应该可以完全支持应用的所有功能！** 🎉


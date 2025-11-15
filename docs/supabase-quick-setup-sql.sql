-- ============================================
-- Supabase 快速配置 SQL 脚本
-- ============================================
-- 用途：一次性执行所有必需的配置
-- 执行方式：在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================
-- 注意：请按顺序执行，如果某个步骤失败，检查错误信息
-- ============================================

-- ============================================
-- 步骤 1: 合并 orders 表字段
-- ============================================

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

-- 添加其他索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================
-- 步骤 2: 创建 rules 存储桶（如果使用规则引擎存储）
-- ============================================
-- 注意：如果存储桶创建失败，请在 Dashboard 中手动创建

INSERT INTO storage.buckets (id, name, public)
VALUES ('rules', 'rules', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 步骤 3: 配置存储桶策略
-- ============================================

-- 3.1 analysis-temp 存储桶策略
DROP POLICY IF EXISTS "Service Role Full Access Analysis Temp" ON storage.objects;

CREATE POLICY "Service Role Full Access Analysis Temp"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'analysis-temp')
WITH CHECK (bucket_id = 'analysis-temp');

-- 3.2 rules 存储桶策略
DROP POLICY IF EXISTS "Service Role Full Access Rules" ON storage.objects;

CREATE POLICY "Service Role Full Access Rules"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'rules')
WITH CHECK (bucket_id = 'rules');

-- ============================================
-- 步骤 4: 验证配置
-- ============================================

-- 4.1 验证 orders 表字段
DO $$
DECLARE
  missing_columns text[];
BEGIN
  SELECT array_agg(column_name)
  INTO missing_columns
  FROM (
    SELECT 'product_id' AS column_name WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'product_id'
    )
    UNION ALL
    SELECT 'provider_session_id' WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'provider_session_id'
    )
  ) AS missing;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE '警告：以下字段可能未添加：%', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ orders 表字段配置完成';
  END IF;
END $$;

-- 4.2 验证存储桶
DO $$
DECLARE
  bucket_count int;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id IN ('palmprints', 'analysis-temp', 'rules');
  
  IF bucket_count < 2 THEN
    RAISE NOTICE '警告：部分存储桶可能未创建。请检查：palmprints, analysis-temp, rules';
  ELSE
    RAISE NOTICE '✅ 存储桶配置完成（找到 % 个存储桶）', bucket_count;
  END IF;
END $$;

-- 4.3 验证策略
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (policyname LIKE '%Analysis Temp%' OR policyname LIKE '%Rules%');
  
  IF policy_count < 2 THEN
    RAISE NOTICE '警告：部分存储桶策略可能未配置';
  ELSE
    RAISE NOTICE '✅ 存储桶策略配置完成（找到 % 个策略）', policy_count;
  END IF;
END $$;

-- ============================================
-- 完成
-- ============================================
-- 下一步：
-- 1. 在 Supabase Dashboard → Storage → Buckets 中验证存储桶
-- 2. 导入字典数据（dict_constitution, dict_solar_term, dream_keywords）
-- 3. 配置表级 RLS 策略（根据需要）
-- 4. 测试应用功能
-- ============================================


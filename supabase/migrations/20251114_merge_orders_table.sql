-- ============================================
-- 合并 orders 表字段
-- ============================================
-- 用途：合并两个迁移文件中的 orders 表定义
-- 执行方式：在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================

-- 添加来自 affiliate_wallet 的字段（如果不存在）
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

-- 验证：检查 orders 表结构
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'orders'
-- ORDER BY ordinal_position;


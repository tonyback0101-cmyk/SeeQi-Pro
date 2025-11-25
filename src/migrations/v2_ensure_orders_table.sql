-- V2 权限体系：确保 orders 表包含必要字段
-- 用于统一记账（单次 + 订阅首付 + 续费都可记录）
-- 如果表已存在，只补缺字段，不破坏历史数据

DO $$ 
BEGIN
  -- 确保 orders 表存在（如果不存在则创建）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'orders'
  ) THEN
    CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id),
      stripe_checkout_session_id TEXT,
      stripe_payment_intent_id TEXT,
      amount INTEGER NOT NULL,               -- 金额（分）
      currency TEXT NOT NULL DEFAULT 'usd',
      kind TEXT NOT NULL,                    -- 'single' | 'sub_month' | 'sub_year'
      report_id UUID NULL,                   -- kind='single' 时必填
      status TEXT NOT NULL,                  -- 'pending' | 'paid' | 'failed' | 'refunded'
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX idx_orders_user_id ON orders(user_id);
    CREATE INDEX idx_orders_report_id ON orders(report_id);
    CREATE INDEX idx_orders_status ON orders(status);
    CREATE INDEX idx_orders_kind ON orders(kind);
    CREATE INDEX idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id);
    
    -- 添加约束
    ALTER TABLE orders ADD CONSTRAINT orders_kind_check 
      CHECK (kind IN ('single', 'sub_month', 'sub_year'));
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
    
    RAISE NOTICE 'Created orders table';
  ELSE
    -- 表已存在，检查并添加缺失的字段
    
    -- stripe_checkout_session_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'stripe_checkout_session_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN stripe_checkout_session_id TEXT;
      CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id);
      RAISE NOTICE 'Added stripe_checkout_session_id column to orders table';
    END IF;
    
    -- stripe_payment_intent_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;
      RAISE NOTICE 'Added stripe_payment_intent_id column to orders table';
    END IF;
    
    -- amount (如果不存在或类型不对)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'amount'
    ) THEN
      ALTER TABLE orders ADD COLUMN amount INTEGER;
      -- 如果有旧字段，尝试迁移数据
      -- 这里假设旧字段可能叫 amount_cents 或其他名称，需要根据实际情况调整
      RAISE NOTICE 'Added amount column to orders table';
    END IF;
    
    -- currency
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'currency'
    ) THEN
      ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT 'usd';
      RAISE NOTICE 'Added currency column to orders table';
    END IF;
    
    -- kind
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'kind'
    ) THEN
      ALTER TABLE orders ADD COLUMN kind TEXT;
      -- 尝试从 product_type 迁移数据
      -- 如果 product_type = 'one_time' 则 kind = 'single'
      -- 如果 product_type = 'subscription' 则根据 metadata.planId 设置 kind
      UPDATE orders SET kind = 'single' 
        WHERE kind IS NULL AND (product_type = 'one_time' OR product_type IS NULL);
      -- 添加约束
      ALTER TABLE orders ADD CONSTRAINT orders_kind_check 
        CHECK (kind IN ('single', 'sub_month', 'sub_year'));
      RAISE NOTICE 'Added kind column to orders table';
    ELSE
      -- 确保约束存在
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_kind_check'
      ) THEN
        -- 先更新现有数据
        UPDATE orders SET kind = 'single' 
          WHERE kind IS NULL OR kind NOT IN ('single', 'sub_month', 'sub_year');
        ALTER TABLE orders ADD CONSTRAINT orders_kind_check 
          CHECK (kind IN ('single', 'sub_month', 'sub_year'));
        RAISE NOTICE 'Added kind check constraint to orders table';
      END IF;
    END IF;
    
    -- report_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'report_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN report_id UUID;
      CREATE INDEX IF NOT EXISTS idx_orders_report_id ON orders(report_id);
      RAISE NOTICE 'Added report_id column to orders table';
    END IF;
    
    -- status (如果不存在)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'status'
    ) THEN
      ALTER TABLE orders ADD COLUMN status TEXT;
      -- 尝试从旧字段迁移
      UPDATE orders SET status = 'pending' WHERE status IS NULL;
      ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
      ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
      RAISE NOTICE 'Added status column to orders table';
    ELSE
      -- 确保约束存在
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_status_check'
      ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
          CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
        RAISE NOTICE 'Added status check constraint to orders table';
      END IF;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE orders IS 'V2 权限体系：所有付费记录表，统一记账（单次 + 订阅首付 + 续费）';
COMMENT ON COLUMN orders.kind IS '订单类型：single | sub_month | sub_year';
COMMENT ON COLUMN orders.report_id IS 'kind=single 时必填，关联的报告 ID';
COMMENT ON COLUMN orders.status IS '订单状态：pending | paid | failed | refunded';


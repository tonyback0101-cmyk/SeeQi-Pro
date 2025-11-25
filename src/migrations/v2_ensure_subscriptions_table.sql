-- V2 权限体系：确保 subscriptions 表存在
-- 记录每个用户在 Stripe 上的订阅状态
-- 如果表已存在，只补缺字段，不破坏历史数据

-- 检查并创建 subscriptions 表（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscriptions'
  ) THEN
    CREATE TABLE subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id),
      stripe_customer_id TEXT NOT NULL,
      stripe_subscription_id TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL,             -- 'sub_month' | 'sub_year'
      status TEXT NOT NULL,           -- 'active' | 'canceled' | 'past_due' | 'incomplete'...
      current_period_end TIMESTAMPTZ, -- 订阅到期时间
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
    CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
    
    -- 添加约束
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
      CHECK (plan IN ('sub_month', 'sub_year'));
    
    RAISE NOTICE 'Created subscriptions table';
  ELSE
    -- 表已存在，检查并添加缺失的字段
    
    -- stripe_customer_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id'
    ) THEN
      ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT;
      -- 如果有旧字段 provider_customer_id，迁移数据
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'provider_customer_id'
      ) THEN
        UPDATE subscriptions SET stripe_customer_id = provider_customer_id 
          WHERE stripe_customer_id IS NULL;
      END IF;
      -- 更新现有记录，确保 NOT NULL
      UPDATE subscriptions SET stripe_customer_id = '' WHERE stripe_customer_id IS NULL;
      ALTER TABLE subscriptions ALTER COLUMN stripe_customer_id SET NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
      RAISE NOTICE 'Added stripe_customer_id column to subscriptions table';
    END IF;
    
    -- stripe_subscription_id（如果存在 provider_subscription_id，重命名）
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'provider_subscription_id'
      ) THEN
        -- 重命名旧字段
        ALTER TABLE subscriptions RENAME COLUMN provider_subscription_id TO stripe_subscription_id;
        RAISE NOTICE 'Renamed provider_subscription_id to stripe_subscription_id';
      ELSE
        ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT NOT NULL;
        RAISE NOTICE 'Added stripe_subscription_id column to subscriptions table';
      END IF;
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
    END IF;
    
    -- plan（如果存在 plan_id，重命名并转换值）
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'plan'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'plan_id'
      ) THEN
        -- 重命名并转换值
        ALTER TABLE subscriptions ADD COLUMN plan TEXT;
        UPDATE subscriptions SET plan = CASE 
          WHEN plan_id = 'monthly' THEN 'sub_month'
          WHEN plan_id = 'yearly' THEN 'sub_year'
          ELSE 'sub_month'
        END;
        ALTER TABLE subscriptions DROP COLUMN plan_id;
        ALTER TABLE subscriptions ALTER COLUMN plan SET NOT NULL;
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
          CHECK (plan IN ('sub_month', 'sub_year'));
        RAISE NOTICE 'Renamed plan_id to plan and converted values';
      ELSE
        ALTER TABLE subscriptions ADD COLUMN plan TEXT NOT NULL DEFAULT 'sub_month';
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
          CHECK (plan IN ('sub_month', 'sub_year'));
        RAISE NOTICE 'Added plan column to subscriptions table';
      END IF;
    ELSE
      -- 确保约束存在
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_plan_check'
      ) THEN
        -- 先更新现有数据
        UPDATE subscriptions SET plan = 'sub_month' 
          WHERE plan IS NULL OR plan NOT IN ('sub_month', 'sub_year');
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
          CHECK (plan IN ('sub_month', 'sub_year'));
        RAISE NOTICE 'Added plan check constraint to subscriptions table';
      END IF;
    END IF;
    
    -- current_period_end
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'current_period_end'
    ) THEN
      ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMPTZ;
      RAISE NOTICE 'Added current_period_end column to subscriptions table';
    END IF;
    
    -- 确保 status 约束存在（允许更多状态值）
    -- 注意：status 可能包括 'incomplete' 等，不强制约束，只做检查
  END IF;
END $$;

COMMENT ON TABLE subscriptions IS 'V2 权限体系：订阅表，记录每个用户在 Stripe 上的订阅状态';
COMMENT ON COLUMN subscriptions.plan IS '订阅计划：sub_month 或 sub_year';
COMMENT ON COLUMN subscriptions.status IS '订阅状态：active, canceled, past_due, incomplete...';
COMMENT ON COLUMN subscriptions.current_period_end IS '订阅到期时间';

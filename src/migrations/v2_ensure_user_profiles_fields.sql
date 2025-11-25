-- V2 权限体系：确保 user_profiles 表包含必要字段
-- 如果表已存在，只补缺字段，不破坏历史数据

DO $$ 
BEGIN
  -- 确保 user_profiles 表存在（如果不存在则创建，但通常已存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_profiles'
  ) THEN
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
      is_pro BOOLEAN NOT NULL DEFAULT false,
      pro_plan TEXT DEFAULT 'none' CHECK (pro_plan IN ('none', 'sub_month', 'sub_year')),
      stripe_customer_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
    RAISE NOTICE 'Created user_profiles table';
  ELSE
    -- 表已存在，检查并添加缺失的字段
    
    -- is_pro
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'is_pro'
    ) THEN
      ALTER TABLE user_profiles ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT false;
      RAISE NOTICE 'Added is_pro column to user_profiles table';
    END IF;
    
    -- pro_plan
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'pro_plan'
    ) THEN
      ALTER TABLE user_profiles ADD COLUMN pro_plan TEXT DEFAULT 'none';
      -- 更新现有记录
      UPDATE user_profiles SET pro_plan = 'none' WHERE pro_plan IS NULL;
      -- 添加约束
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_pro_plan_check 
        CHECK (pro_plan IN ('none', 'sub_month', 'sub_year'));
      RAISE NOTICE 'Added pro_plan column to user_profiles table';
    ELSE
      -- 如果字段已存在，确保约束存在
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_pro_plan_check'
      ) THEN
        -- 先更新现有数据，确保符合约束
        UPDATE user_profiles SET pro_plan = 'none' 
          WHERE pro_plan IS NULL OR pro_plan NOT IN ('none', 'sub_month', 'sub_year');
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_pro_plan_check 
          CHECK (pro_plan IN ('none', 'sub_month', 'sub_year'));
        RAISE NOTICE 'Added pro_plan check constraint to user_profiles table';
      END IF;
    END IF;
    
    -- stripe_customer_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
    ) THEN
      ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT;
      RAISE NOTICE 'Added stripe_customer_id column to user_profiles table';
    END IF;
  END IF;
END $$;

COMMENT ON TABLE user_profiles IS 'V2 权限体系：用户画像表，存储用户权益标记';
COMMENT ON COLUMN user_profiles.is_pro IS '是否任一 Pro 订阅中';
COMMENT ON COLUMN user_profiles.pro_plan IS '当前 Pro 计划：none | sub_month | sub_year';
COMMENT ON COLUMN user_profiles.stripe_customer_id IS '绑定到 Stripe Customer';


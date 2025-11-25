-- V2 权限体系：确保 report_access 表支持 user_id 字段
-- 如果表已存在但缺少 user_id 字段，添加该字段
-- 如果表不存在，创建表

-- 检查并添加 user_id 列（如果不存在）
DO $$ 
BEGIN
  -- 如果 report_access 表不存在，创建它
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'report_access'
  ) THEN
    CREATE TABLE report_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      report_id UUID NOT NULL,
      user_id UUID, -- V2 使用 user_id（可为 null 以兼容旧数据）
      session_id UUID, -- 保留 session_id 以兼容旧数据
      tier TEXT NOT NULL DEFAULT 'full',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT report_access_report_user_unique UNIQUE (report_id, user_id)
    );
    
    -- 创建索引
    CREATE INDEX idx_report_access_user_id ON report_access(user_id);
    CREATE INDEX idx_report_access_report_id ON report_access(report_id);
    CREATE INDEX idx_report_access_session_id ON report_access(session_id);
    
    RAISE NOTICE 'Created report_access table with user_id support';
  ELSE
    -- 表已存在，检查是否有 user_id 列
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'report_access' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE report_access ADD COLUMN user_id UUID;
      CREATE INDEX IF NOT EXISTS idx_report_access_user_id ON report_access(user_id);
      RAISE NOTICE 'Added user_id column to report_access table';
    ELSE
      RAISE NOTICE 'user_id column already exists in report_access table';
    END IF;
    
    -- 确保有唯一约束（如果不存在）
    -- 使用部分唯一索引，只对 user_id 不为 null 的记录生效
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'report_access_report_user_unique'
    ) THEN
      -- 创建部分唯一索引（允许 user_id 为 null 的情况，null 值不参与唯一性检查）
      CREATE UNIQUE INDEX report_access_report_user_unique 
        ON report_access(report_id, user_id) 
        WHERE user_id IS NOT NULL;
      RAISE NOTICE 'Created unique index on (report_id, user_id) where user_id IS NOT NULL';
    END IF;
  END IF;
END $$;

COMMENT ON TABLE report_access IS 'V2 权限体系：报告访问权限表，支持 user_id（V2）和 session_id（兼容旧版）';
COMMENT ON COLUMN report_access.user_id IS 'V2 使用：用户 ID，用于单次购买权限';
COMMENT ON COLUMN report_access.session_id IS '兼容旧版：会话 ID';


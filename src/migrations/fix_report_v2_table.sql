-- 修复 report_v2 表：添加缺失的列
-- 如果表已存在但缺少某些字段，执行此脚本

-- 添加 raw_features 列（如果不存在）
ALTER TABLE report_v2 
ADD COLUMN IF NOT EXISTS raw_features JSONB;

-- 添加 image_urls 列（如果不存在）
ALTER TABLE report_v2 
ADD COLUMN IF NOT EXISTS image_urls JSONB;

-- 添加 normalized 列（如果不存在）
ALTER TABLE report_v2 
ADD COLUMN IF NOT EXISTS normalized JSONB;

-- 添加其他可能缺失的列
ALTER TABLE report_v2 
ADD COLUMN IF NOT EXISTS palm_insight JSONB,
ADD COLUMN IF NOT EXISTS palm_result JSONB,
ADD COLUMN IF NOT EXISTS body_tongue JSONB,
ADD COLUMN IF NOT EXISTS constitution JSONB,
ADD COLUMN IF NOT EXISTS dream_insight JSONB,
ADD COLUMN IF NOT EXISTS qi_rhythm JSONB,
ADD COLUMN IF NOT EXISTS advice JSONB,
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'zh';

-- 添加 locale 的 CHECK 约束（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_v2_locale_check'
  ) THEN
    ALTER TABLE report_v2 
    ADD CONSTRAINT report_v2_locale_check 
    CHECK (locale IN ('zh', 'en'));
  END IF;
END $$;

-- 添加注释
COMMENT ON COLUMN report_v2.raw_features IS '原始特征数据';
COMMENT ON COLUMN report_v2.image_urls IS '上传的图片 URL';
COMMENT ON COLUMN report_v2.normalized IS '标准化的分析结果数据，包含所有分析模块的结果';



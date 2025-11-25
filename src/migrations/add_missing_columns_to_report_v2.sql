-- 为 report_v2 表添加缺失的列
-- 如果表已存在但缺少某些字段，执行此脚本

-- 检查并添加 raw_features 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'raw_features'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN raw_features JSONB;
    RAISE NOTICE 'Added column raw_features to report_v2';
  ELSE
    RAISE NOTICE 'Column raw_features already exists in report_v2';
  END IF;
END $$;

-- 检查并添加 image_urls 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN image_urls JSONB;
    RAISE NOTICE 'Added column image_urls to report_v2';
  ELSE
    RAISE NOTICE 'Column image_urls already exists in report_v2';
  END IF;
END $$;

-- 检查并添加 normalized 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'normalized'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN normalized JSONB;
    RAISE NOTICE 'Added column normalized to report_v2';
  ELSE
    RAISE NOTICE 'Column normalized already exists in report_v2';
  END IF;
END $$;

-- 检查并添加其他可能缺失的列
DO $$ 
BEGIN
  -- palm_insight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'palm_insight'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN palm_insight JSONB;
    RAISE NOTICE 'Added column palm_insight to report_v2';
  END IF;
  
  -- palm_result
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'palm_result'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN palm_result JSONB;
    RAISE NOTICE 'Added column palm_result to report_v2';
  END IF;
  
  -- body_tongue
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'body_tongue'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN body_tongue JSONB;
    RAISE NOTICE 'Added column body_tongue to report_v2';
  END IF;
  
  -- constitution
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'constitution'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN constitution JSONB;
    RAISE NOTICE 'Added column constitution to report_v2';
  END IF;
  
  -- dream_insight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'dream_insight'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN dream_insight JSONB;
    RAISE NOTICE 'Added column dream_insight to report_v2';
  END IF;
  
  -- qi_rhythm
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'qi_rhythm'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN qi_rhythm JSONB;
    RAISE NOTICE 'Added column qi_rhythm to report_v2';
  END IF;
  
  -- advice
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'advice'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN advice JSONB;
    RAISE NOTICE 'Added column advice to report_v2';
  END IF;
  
  -- locale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_v2' AND column_name = 'locale'
  ) THEN
    ALTER TABLE report_v2 ADD COLUMN locale TEXT DEFAULT 'zh' CHECK (locale IN ('zh', 'en'));
    RAISE NOTICE 'Added column locale to report_v2';
  END IF;
END $$;

-- 添加注释
COMMENT ON COLUMN report_v2.raw_features IS '原始特征数据';
COMMENT ON COLUMN report_v2.image_urls IS '上传的图片 URL';
COMMENT ON COLUMN report_v2.normalized IS '标准化的分析结果数据，包含所有分析模块的结果';



-- V2 报告表创建脚本
-- 用于存储 V2 版本的分析报告数据

CREATE TABLE IF NOT EXISTS report_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locale TEXT NOT NULL DEFAULT 'zh' CHECK (locale IN ('zh', 'en')),
  
  -- 标准化数据（JSONB，包含所有分析结果）
  normalized JSONB,
  
  -- 顶层字段（用于兼容和快速查询）
  palm_insight JSONB,
  palm_result JSONB,
  body_tongue JSONB,
  constitution JSONB,
  dream_insight JSONB,
  qi_rhythm JSONB,
  advice JSONB,
  
  -- 原始特征数据
  raw_features JSONB,
  
  -- 图片 URL
  image_urls JSONB,
  
  -- 索引
  CONSTRAINT report_v2_id_check CHECK (id IS NOT NULL),
  CONSTRAINT report_v2_created_at_check CHECK (created_at IS NOT NULL)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_report_v2_id ON report_v2(id);
CREATE INDEX IF NOT EXISTS idx_report_v2_created_at ON report_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_v2_locale ON report_v2(locale);

-- 启用 Row Level Security (RLS)
ALTER TABLE report_v2 ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许匿名用户读取（如果需要公开访问）
-- 注意：根据你的安全需求，可能需要调整这些策略
CREATE POLICY "Allow anonymous read access" ON report_v2
  FOR SELECT
  USING (true);

-- 创建策略：允许服务角色插入和更新（后端 API 使用）
-- 注意：服务角色会自动绕过 RLS，但为了明确，我们仍然创建策略
CREATE POLICY "Allow service role full access" ON report_v2
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 如果需要允许认证用户读取自己的报告，可以使用以下策略：
-- CREATE POLICY "Allow authenticated users to read their own reports" ON report_v2
--   FOR SELECT
--   USING (auth.uid()::text = user_id::text);

COMMENT ON TABLE report_v2 IS 'V2 版本的分析报告表，存储完整的分析结果数据';
COMMENT ON COLUMN report_v2.normalized IS '标准化的分析结果数据，包含所有分析模块的结果';
COMMENT ON COLUMN report_v2.palm_insight IS '掌纹洞察数据';
COMMENT ON COLUMN report_v2.palm_result IS '掌纹分析结果';
COMMENT ON COLUMN report_v2.body_tongue IS '舌象分析结果';
COMMENT ON COLUMN report_v2.constitution IS '体质分析结果';
COMMENT ON COLUMN report_v2.dream_insight IS '梦境分析结果';
COMMENT ON COLUMN report_v2.qi_rhythm IS '气运节奏分析结果';
COMMENT ON COLUMN report_v2.advice IS '建议数据';
COMMENT ON COLUMN report_v2.raw_features IS '原始特征数据';
COMMENT ON COLUMN report_v2.image_urls IS '上传的图片 URL';



-- ================================================
-- 创建 report_v2 表：用于存储 V2 报告（掌纹/舌苔/梦境/体质/气运）
-- 字段结构与 normalized.* 对齐，便于前后端直接读取
-- ================================================

CREATE TABLE IF NOT EXISTS public.report_v2 (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  locale TEXT NOT NULL DEFAULT 'zh',
  palm_insight JSONB,
  body_tongue JSONB,
  dream_insight JSONB,
  constitution JSONB,
  qi_rhythm JSONB,
  advice JSONB,
  palm_result JSONB,
  tongue_result JSONB,
  raw_features JSONB,
  normalized JSONB
);

CREATE INDEX IF NOT EXISTS report_v2_created_idx ON public.report_v2 (created_at DESC);

-- 启用 RLS（Row Level Security）
ALTER TABLE public.report_v2 ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有用户读取和写入（根据实际需求可以后续调整）
CREATE POLICY IF NOT EXISTS "Allow all operations on report_v2"
  ON public.report_v2
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 字段结构与 normalized.* 对齐，便于前后端直接读取
-- ================================================

CREATE TABLE IF NOT EXISTS public.report_v2 (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  locale TEXT NOT NULL DEFAULT 'zh',
  palm_insight JSONB,
  body_tongue JSONB,
  dream_insight JSONB,
  constitution JSONB,
  qi_rhythm JSONB,
  advice JSONB,
  palm_result JSONB,
  tongue_result JSONB,
  raw_features JSONB,
  normalized JSONB
);

CREATE INDEX IF NOT EXISTS report_v2_created_idx ON public.report_v2 (created_at DESC);

-- 启用 RLS（Row Level Security）
ALTER TABLE public.report_v2 ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有用户读取和写入（根据实际需求可以后续调整）
CREATE POLICY IF NOT EXISTS "Allow all operations on report_v2"
  ON public.report_v2
  FOR ALL
  USING (true)
  WITH CHECK (true);

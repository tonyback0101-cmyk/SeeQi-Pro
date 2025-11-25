-- ================================================
-- 创建 report_v2 表：用于存储 V2 报告（掌纹/舌苔/梦境/体质/气运）
-- 字段结构与 normalized.* 对齐，便于前后端直接读取
-- ================================================

create table if not exists public.report_v2 (
  id uuid primary key,
  created_at timestamptz not null default timezone('utc'::text, now()),
  locale text not null default 'zh',
  palm_insight jsonb,
  body_tongue jsonb,
  dream_insight jsonb,
  constitution jsonb,
  qi_rhythm jsonb,
  advice jsonb,
  palm_result jsonb,
  tongue_result jsonb,
  raw_features jsonb,
  normalized jsonb
);

create index if not exists report_v2_created_idx on public.report_v2 (created_at desc);





-- 创建 report_v2 表：用于存储 V2 报告（掌纹/舌苔/梦境/体质/气运）
-- 字段结构与 normalized.* 对齐，便于前后端直接读取
-- ================================================

create table if not exists public.report_v2 (
  id uuid primary key,
  created_at timestamptz not null default timezone('utc'::text, now()),
  locale text not null default 'zh',
  palm_insight jsonb,
  body_tongue jsonb,
  dream_insight jsonb,
  constitution jsonb,
  qi_rhythm jsonb,
  advice jsonb,
  palm_result jsonb,
  tongue_result jsonb,
  raw_features jsonb,
  normalized jsonb
);

create index if not exists report_v2_created_idx on public.report_v2 (created_at desc);






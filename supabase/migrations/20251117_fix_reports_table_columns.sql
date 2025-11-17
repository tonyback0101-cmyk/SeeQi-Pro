-- 修复 reports 表，添加缺失的列（如果不存在）

-- 添加缺失的列
alter table public.reports
  add column if not exists matched_rules text[],
  add column if not exists qi_index jsonb,
  add column if not exists solar jsonb,
  add column if not exists tags text[];

-- 如果 tz 列不存在，添加它
alter table public.reports
  add column if not exists tz text not null default 'Asia/Shanghai';

-- 验证表结构
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'reports'
order by ordinal_position;


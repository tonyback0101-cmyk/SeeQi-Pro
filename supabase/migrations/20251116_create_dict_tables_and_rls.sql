-- 创建 dict_constitution 和 dict_solar_term 表（如果不存在），并设置 RLS 策略

-- 1. 创建 dict_constitution 表
create table if not exists public.dict_constitution (
  code text primary key,
  name_zh text not null,
  name_en text not null,
  desc_zh text not null,
  desc_en text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. 添加扩展字段（如果不存在）
alter table public.dict_constitution
  add column if not exists feature text,
  add column if not exists advice_diet text,
  add column if not exists advice_activity text,
  add column if not exists advice_acupoint text;

-- 3. 创建 dict_solar_term 表
create table if not exists public.dict_solar_term (
  code text primary key,
  name_zh text not null,
  name_en text not null,
  do_zh text[] not null default '{}',
  avoid_zh text[] not null default '{}',
  do_en text[] not null default '{}',
  avoid_en text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 4. 添加扩展字段（如果不存在）
alter table public.dict_solar_term
  add column if not exists element text,
  add column if not exists health_tip text;

-- 5. 创建索引
create index if not exists dict_solar_term_created_idx on public.dict_solar_term (created_at desc);

-- 6. 设置 dict_constitution 表的 RLS 策略
alter table public.dict_constitution enable row level security;

drop policy if exists dict_constitution_service_all on public.dict_constitution;
create policy dict_constitution_service_all 
on public.dict_constitution 
for all 
to service_role 
using (true) 
with check (true);

drop policy if exists dict_constitution_public_read on public.dict_constitution;
create policy dict_constitution_public_read 
on public.dict_constitution 
for select 
to anon, authenticated 
using (true);

-- 7. 设置 dict_solar_term 表的 RLS 策略
alter table public.dict_solar_term enable row level security;

drop policy if exists dict_solar_term_service_all on public.dict_solar_term;
create policy dict_solar_term_service_all 
on public.dict_solar_term 
for all 
to service_role 
using (true) 
with check (true);

drop policy if exists dict_solar_term_public_read on public.dict_solar_term;
create policy dict_solar_term_public_read 
on public.dict_solar_term 
for select 
to anon, authenticated 
using (true);

-- 8. 验证
select 'Tables created' as status, count(*) as count
from information_schema.tables
where table_schema='public' and table_name in ('dict_constitution', 'dict_solar_term');

select 'RLS policies' as status, count(*) as count
from pg_policies
where schemaname='public' and tablename in ('dict_constitution', 'dict_solar_term');


-- ============================================
-- 最终修复脚本 - 一次性修复所有表结构问题
-- ============================================

-- ============================================
-- 第一部分：修复 reports 表
-- ============================================
create table if not exists public.reports (
  id uuid primary key,
  session_id uuid references public.sessions(id) on delete set null,
  constitution text,
  palm_result jsonb,
  tongue_result jsonb,
  dream jsonb,
  solar_term text,
  solar jsonb,
  tags text[],
  advice jsonb,
  quote text,
  locale text not null default 'zh',
  tz text not null default 'Asia/Shanghai',
  unlocked boolean not null default false,
  matched_rules text[],
  qi_index jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.reports
  add column if not exists session_id uuid,
  add column if not exists constitution text,
  add column if not exists palm_result jsonb,
  add column if not exists tongue_result jsonb,
  add column if not exists dream jsonb,
  add column if not exists solar_term text,
  add column if not exists solar jsonb,
  add column if not exists tags text[],
  add column if not exists advice jsonb,
  add column if not exists quote text,
  add column if not exists locale text,
  add column if not exists tz text,
  add column if not exists unlocked boolean,
  add column if not exists matched_rules text[],
  add column if not exists qi_index jsonb,
  add column if not exists created_at timestamptz;

-- 先更新所有 NULL 值，然后再设置 NOT NULL 约束
update public.reports set locale = 'zh' where locale is null;
update public.reports set tz = 'Asia/Shanghai' where tz is null;
update public.reports set unlocked = false where unlocked is null;
update public.reports set created_at = timezone('utc'::text, now()) where created_at is null;

-- 现在可以安全地设置 NOT NULL 约束
alter table public.reports
  alter column locale set not null,
  alter column locale set default 'zh',
  alter column tz set not null,
  alter column tz set default 'Asia/Shanghai',
  alter column unlocked set not null,
  alter column unlocked set default false,
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now());

create index if not exists reports_session_idx on public.reports (session_id, created_at desc);
create index if not exists reports_created_at_idx on public.reports (created_at desc);

-- ============================================
-- 第二部分：修复 assessment_records 表
-- ============================================
create table if not exists public.assessment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  module_type text not null,
  status text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.assessment_records
  add column if not exists module text,
  add column if not exists payload jsonb;

-- 先更新所有 NULL 值，然后再设置 NOT NULL 约束
update public.assessment_records set module_type = module where (module_type is null or module_type = '') and module is not null;
update public.assessment_records set data = payload where (data is null or data = '{}'::jsonb) and payload is not null and payload != '{}'::jsonb;
update public.assessment_records set status = 'not_started' where status is null or status = '';
update public.assessment_records set data = '{}'::jsonb where data is null;
update public.assessment_records set created_at = timezone('utc'::text, now()) where created_at is null;
update public.assessment_records set updated_at = timezone('utc'::text, now()) where updated_at is null;

-- 现在可以安全地设置 NOT NULL 约束
alter table public.assessment_records
  alter column module_type set not null,
  alter column status set not null,
  alter column data set default '{}'::jsonb,
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now()),
  alter column updated_at set not null,
  alter column updated_at set default timezone('utc'::text, now());

alter table public.assessment_records
  drop constraint if exists assessment_records_user_module_unique,
  drop constraint if exists assessment_records_user_id_module_key,
  drop constraint if exists assessment_records_user_id_module_type_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'assessment_records_user_module_unique'
  ) then
    alter table public.assessment_records
    add constraint assessment_records_user_module_unique
    unique (user_id, module_type);
  end if;
end $$;

create or replace function sync_assessment_columns()
returns trigger
language plpgsql
as $$
begin
  if new.module_type is not null and (new.module is null or new.module = '') then
    new.module := new.module_type;
  end if;
  if new.module is not null and (new.module_type is null or new.module_type = '') then
    new.module_type := new.module;
  end if;
  if new.data is not null and new.data != '{}'::jsonb and (new.payload is null or new.payload = '{}'::jsonb) then
    new.payload := new.data;
  end if;
  if new.payload is not null and new.payload != '{}'::jsonb and (new.data is null or new.data = '{}'::jsonb) then
    new.data := new.payload;
  end if;
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_sync_assessment_columns on public.assessment_records;
create trigger trg_sync_assessment_columns
before insert or update on public.assessment_records
for each row
execute procedure sync_assessment_columns();

create index if not exists assessment_records_user_idx on public.assessment_records (user_id, created_at desc);
create index if not exists assessment_records_module_idx on public.assessment_records (module_type);
create index if not exists assessment_records_user_module_idx on public.assessment_records (user_id, module_type);

alter table public.assessment_records enable row level security;

drop policy if exists assessment_records_service_all on public.assessment_records;
create policy assessment_records_service_all on public.assessment_records 
  for all to service_role using (true) with check (true);

drop policy if exists assessment_records_user_select on public.assessment_records;
create policy assessment_records_user_select on public.assessment_records 
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists assessment_records_user_insert on public.assessment_records;
create policy assessment_records_user_insert on public.assessment_records 
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists assessment_records_user_update on public.assessment_records;
create policy assessment_records_user_update on public.assessment_records 
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- 第三部分：确保字典表存在
-- ============================================
create table if not exists public.dict_constitution (
  id uuid primary key default gen_random_uuid(),
  name_zh text,
  name_en text,
  feature text,
  advice_diet text[],
  advice_activity text[],
  advice_acupoint text[],
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.dict_solar_term (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  description text,
  advice jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.dict_constitution enable row level security;
alter table public.dict_solar_term enable row level security;

drop policy if exists dict_constitution_service_all on public.dict_constitution;
create policy dict_constitution_service_all on public.dict_constitution for all to service_role using (true) with check (true);

drop policy if exists dict_constitution_public_read on public.dict_constitution;
create policy dict_constitution_public_read on public.dict_constitution for select to anon, authenticated using (true);

drop policy if exists dict_solar_term_service_all on public.dict_solar_term;
create policy dict_solar_term_service_all on public.dict_solar_term for all to service_role using (true) with check (true);

drop policy if exists dict_solar_term_public_read on public.dict_solar_term;
create policy dict_solar_term_public_read on public.dict_solar_term for select to anon, authenticated using (true);

-- ============================================
-- 验证
-- ============================================
select 'reports 表列数' as table_name, count(*) as column_count
from information_schema.columns
where table_schema = 'public' and table_name = 'reports'
union all
select 'assessment_records 表列数', count(*)
from information_schema.columns
where table_schema = 'public' and table_name = 'assessment_records'
union all
select 'dict_constitution 表列数', count(*)
from information_schema.columns
where table_schema = 'public' and table_name = 'dict_constitution'
union all
select 'dict_solar_term 表列数', count(*)
from information_schema.columns
where table_schema = 'public' and table_name = 'dict_solar_term';


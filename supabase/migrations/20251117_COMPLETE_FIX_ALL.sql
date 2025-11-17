-- ============================================
-- 一次性完整修复所有数据库问题
-- 此脚本可以安全地重复执行
-- ============================================

-- ============================================
-- 第一部分：修复 reports 表（先更新 NULL，再设置约束）
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
  locale text,
  tz text,
  unlocked boolean,
  matched_rules text[],
  qi_index jsonb,
  created_at timestamptz
);

-- 添加所有可能缺失的列
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

-- 先更新所有 NULL 值
update public.reports set locale = 'zh' where locale is null;
update public.reports set tz = 'Asia/Shanghai' where tz is null;
update public.reports set unlocked = false where unlocked is null;
update public.reports set created_at = timezone('utc'::text, now()) where created_at is null;

-- 现在设置 NOT NULL 约束和默认值
alter table public.reports
  alter column locale set default 'zh',
  alter column tz set default 'Asia/Shanghai',
  alter column unlocked set default false,
  alter column created_at set default timezone('utc'::text, now());

-- 再次更新，确保所有值都不为 NULL
update public.reports set locale = 'zh' where locale is null;
update public.reports set tz = 'Asia/Shanghai' where tz is null;
update public.reports set unlocked = false where unlocked is null;
update public.reports set created_at = timezone('utc'::text, now()) where created_at is null;

-- 最后设置 NOT NULL
do $$
begin
  alter table public.reports alter column locale set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.reports alter column tz set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.reports alter column unlocked set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.reports alter column created_at set not null;
exception when others then null;
end $$;

-- ============================================
-- 第二部分：修复 assessment_records 表
-- ============================================
create table if not exists public.assessment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  module_type text,
  status text,
  data jsonb,
  module text,
  payload jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

alter table public.assessment_records
  add column if not exists module text,
  add column if not exists payload jsonb;

-- 先更新所有 NULL 值
update public.assessment_records set module_type = module where (module_type is null or module_type = '') and module is not null;
update public.assessment_records set data = payload where (data is null or data = '{}'::jsonb) and payload is not null and payload != '{}'::jsonb;
update public.assessment_records set status = 'not_started' where status is null or status = '';
update public.assessment_records set data = '{}'::jsonb where data is null;
update public.assessment_records set created_at = timezone('utc'::text, now()) where created_at is null;
update public.assessment_records set updated_at = timezone('utc'::text, now()) where updated_at is null;
update public.assessment_records set module_type = 'palm' where module_type is null;

-- 设置默认值
alter table public.assessment_records
  alter column data set default '{}'::jsonb,
  alter column created_at set default timezone('utc'::text, now()),
  alter column updated_at set default timezone('utc'::text, now());

-- 再次更新 NULL
update public.assessment_records set data = '{}'::jsonb where data is null;
update public.assessment_records set created_at = timezone('utc'::text, now()) where created_at is null;
update public.assessment_records set updated_at = timezone('utc'::text, now()) where updated_at is null;
update public.assessment_records set module_type = 'palm' where module_type is null;
update public.assessment_records set status = 'not_started' where status is null or status = '';

-- 设置 NOT NULL
do $$
begin
  alter table public.assessment_records alter column module_type set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.assessment_records alter column status set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.assessment_records alter column created_at set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.assessment_records alter column updated_at set not null;
exception when others then null;
end $$;

-- 唯一约束
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

-- 触发器
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

-- 索引
create index if not exists assessment_records_user_idx on public.assessment_records (user_id, created_at desc);
create index if not exists assessment_records_module_idx on public.assessment_records (module_type);
create index if not exists assessment_records_user_module_idx on public.assessment_records (user_id, module_type);

-- RLS
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
-- 第三部分：修复字典表（确保所有必需的列都存在）
-- ============================================
-- dict_constitution 表
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

alter table public.dict_constitution
  add column if not exists name_zh text,
  add column if not exists name_en text,
  add column if not exists feature text,
  add column if not exists advice_diet text[],
  add column if not exists advice_activity text[],
  add column if not exists advice_acupoint text[],
  add column if not exists created_at timestamptz;

update public.dict_constitution set created_at = timezone('utc'::text, now()) where created_at is null;

alter table public.dict_constitution
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now());

alter table public.dict_constitution enable row level security;

drop policy if exists dict_constitution_service_all on public.dict_constitution;
create policy dict_constitution_service_all on public.dict_constitution for all to service_role using (true) with check (true);

drop policy if exists dict_constitution_public_read on public.dict_constitution;
create policy dict_constitution_public_read on public.dict_constitution for select to anon, authenticated using (true);

-- dict_solar_term 表（需要 code 列，不是 name）
create table if not exists public.dict_solar_term (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name_zh text,
  name_en text,
  do_zh text[],
  avoid_zh text[],
  do_en text[],
  avoid_en text[],
  element text,
  health_tip text,
  start_date date,
  end_date date,
  description text,
  advice jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.dict_solar_term
  add column if not exists code text,
  add column if not exists name_zh text,
  add column if not exists name_en text,
  add column if not exists do_zh text[],
  add column if not exists avoid_zh text[],
  add column if not exists do_en text[],
  add column if not exists avoid_en text[],
  add column if not exists element text,
  add column if not exists health_tip text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists description text,
  add column if not exists advice jsonb,
  add column if not exists created_at timestamptz;

update public.dict_solar_term set created_at = timezone('utc'::text, now()) where created_at is null;

alter table public.dict_solar_term
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now());

-- 如果 code 列有唯一约束，确保它存在
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dict_solar_term'::regclass
    and conname = 'dict_solar_term_code_key'
  ) then
    alter table public.dict_solar_term
    add constraint dict_solar_term_code_key unique (code);
  end if;
end $$;

alter table public.dict_solar_term enable row level security;

drop policy if exists dict_solar_term_service_all on public.dict_solar_term;
create policy dict_solar_term_service_all on public.dict_solar_term for all to service_role using (true) with check (true);

drop policy if exists dict_solar_term_public_read on public.dict_solar_term;
create policy dict_solar_term_public_read on public.dict_solar_term for select to anon, authenticated using (true);

-- ============================================
-- 第四部分：确保 report_access 表有所有必需的列
-- ============================================
create table if not exists public.report_access (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  accessed_at timestamptz,
  session_id uuid,
  tier text,
  updated_at timestamptz
);

-- 先添加所有可能缺失的列
alter table public.report_access
  add column if not exists report_id uuid,
  add column if not exists user_id uuid,
  add column if not exists accessed_at timestamptz,
  add column if not exists session_id uuid,
  add column if not exists tier text,
  add column if not exists updated_at timestamptz;

-- 添加外键约束（如果不存在）
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.report_access'::regclass
    and conname = 'report_access_report_id_fkey'
  ) then
    alter table public.report_access
    add constraint report_access_report_id_fkey
    foreign key (report_id) references public.reports(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.report_access'::regclass
    and conname = 'report_access_user_id_fkey'
  ) then
    alter table public.report_access
    add constraint report_access_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.report_access'::regclass
    and conname = 'report_access_session_id_fkey'
  ) then
    alter table public.report_access
    add constraint report_access_session_id_fkey
    foreign key (session_id) references public.sessions(id) on delete cascade;
  end if;
end $$;

-- 现在更新 NULL 值
update public.report_access set accessed_at = timezone('utc'::text, now()) where accessed_at is null;
update public.report_access set updated_at = timezone('utc'::text, now()) where updated_at is null;

-- 设置默认值
alter table public.report_access
  alter column accessed_at set default timezone('utc'::text, now()),
  alter column updated_at set default timezone('utc'::text, now());

-- 再次更新 NULL（确保所有值都不为 NULL）
update public.report_access set accessed_at = timezone('utc'::text, now()) where accessed_at is null;
update public.report_access set updated_at = timezone('utc'::text, now()) where updated_at is null;

-- 设置 NOT NULL（使用异常处理）
do $$
begin
  alter table public.report_access alter column accessed_at set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.report_access alter column updated_at set not null;
exception when others then null;
end $$;

-- 删除可能存在的旧唯一约束
alter table public.report_access
  drop constraint if exists report_access_report_id_user_id_key,
  drop constraint if exists report_access_pkey;

-- 确保主键存在
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.report_access'::regclass
    and contype = 'p'
  ) then
    alter table public.report_access
    add primary key (id);
  end if;
end $$;

-- 创建唯一约束（用于 upsert 的 onConflict）
-- 注意：Supabase 的 upsert onConflict 需要唯一约束，不是唯一索引
alter table public.report_access
  drop constraint if exists report_access_report_session_unique;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.report_access'::regclass
    and conname = 'report_access_report_session_unique'
  ) then
    alter table public.report_access
    add constraint report_access_report_session_unique
    unique (report_id, session_id);
  end if;
end $$;

-- 也创建唯一索引用于查询优化
create unique index if not exists report_access_report_session_idx
  on public.report_access (report_id, session_id)
  where report_id is not null and session_id is not null;

create unique index if not exists report_access_report_user_idx
  on public.report_access (report_id, user_id)
  where report_id is not null and user_id is not null;

-- ============================================
-- 第五部分：确保 orders 表有所有必需的列
-- ============================================
alter table public.orders
  add column if not exists provider_intent_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_checkout_session_id text;

-- ============================================
-- 第六部分：确保 user_profiles 表有所有必需的列
-- ============================================
alter table public.user_profiles
  add column if not exists inviter_id uuid references auth.users(id) on delete set null,
  add column if not exists ref_code text,
  add column if not exists wallet_balance integer default 0,
  add column if not exists wallet_pending integer default 0,
  add column if not exists payout_method jsonb;

-- ============================================
-- 验证
-- ============================================
select '修复完成' as status;


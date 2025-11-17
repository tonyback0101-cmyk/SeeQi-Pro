-- 最终修复 assessment_records 表 - 解决所有可能的问题

-- ============================================
-- 1. 确保表结构正确
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

-- ============================================
-- 2. 添加/修复列（向后兼容）
-- ============================================
alter table public.assessment_records
  add column if not exists module text,
  add column if not exists payload jsonb;

-- 确保必需的列不为空且有默认值
alter table public.assessment_records
  alter column module_type set not null,
  alter column status set not null,
  alter column data set default '{}'::jsonb,
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now()),
  alter column updated_at set not null,
  alter column updated_at set default timezone('utc'::text, now());

-- ============================================
-- 3. 同步旧数据
-- ============================================
update public.assessment_records
set module_type = module
where (module_type is null or module_type = '') and module is not null;

update public.assessment_records
set data = payload
where (data is null or data = '{}'::jsonb) and payload is not null and payload != '{}'::jsonb;

-- 填充空值
update public.assessment_records
set status = 'not_started'
where status is null or status = '';

update public.assessment_records
set data = '{}'::jsonb
where data is null;

update public.assessment_records
set created_at = timezone('utc'::text, now())
where created_at is null;

update public.assessment_records
set updated_at = timezone('utc'::text, now())
where updated_at is null;

-- ============================================
-- 4. 删除旧约束（如果存在），然后创建唯一约束
-- ============================================
-- 删除可能存在的旧约束
alter table public.assessment_records
  drop constraint if exists assessment_records_user_module_unique,
  drop constraint if exists assessment_records_user_id_module_key,
  drop constraint if exists assessment_records_user_id_module_type_key;

-- 创建唯一约束
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

-- ============================================
-- 5. 创建/更新触发器
-- ============================================
create or replace function sync_assessment_columns()
returns trigger
language plpgsql
as $$
begin
  -- 同步 module <-> module_type
  if new.module_type is not null and (new.module is null or new.module = '') then
    new.module := new.module_type;
  end if;
  if new.module is not null and (new.module_type is null or new.module_type = '') then
    new.module_type := new.module;
  end if;
  -- 同步 data <-> payload
  if new.data is not null and new.data != '{}'::jsonb and (new.payload is null or new.payload = '{}'::jsonb) then
    new.payload := new.data;
  end if;
  if new.payload is not null and new.payload != '{}'::jsonb and (new.data is null or new.data = '{}'::jsonb) then
    new.data := new.payload;
  end if;
  -- 自动更新 updated_at
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_sync_assessment_columns on public.assessment_records;
create trigger trg_sync_assessment_columns
before insert or update on public.assessment_records
for each row
execute procedure sync_assessment_columns();

-- ============================================
-- 6. 创建索引
-- ============================================
create index if not exists assessment_records_user_idx on public.assessment_records (user_id, created_at desc);
create index if not exists assessment_records_module_idx on public.assessment_records (module_type);
create index if not exists assessment_records_user_module_idx on public.assessment_records (user_id, module_type);

-- ============================================
-- 7. 设置 RLS 策略
-- ============================================
alter table public.assessment_records enable row level security;

-- service_role 有所有权限（用于 API 路由）
drop policy if exists assessment_records_service_all on public.assessment_records;
create policy assessment_records_service_all on public.assessment_records 
  for all 
  to service_role 
  using (true) 
  with check (true);

-- authenticated 用户可以查看自己的记录
drop policy if exists assessment_records_user_select on public.assessment_records;
create policy assessment_records_user_select on public.assessment_records 
  for select 
  to authenticated 
  using (auth.uid() = user_id);

-- authenticated 用户可以插入自己的记录
drop policy if exists assessment_records_user_insert on public.assessment_records;
create policy assessment_records_user_insert on public.assessment_records 
  for insert 
  to authenticated 
  with check (auth.uid() = user_id);

-- authenticated 用户可以更新自己的记录
drop policy if exists assessment_records_user_update on public.assessment_records;
create policy assessment_records_user_update on public.assessment_records 
  for update 
  to authenticated 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- 8. 验证表结构
-- ============================================
select 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'assessment_records'
order by ordinal_position;

-- 验证约束
select 
  conname as constraint_name,
  contype as constraint_type
from pg_constraint
where conrelid = 'public.assessment_records'::regclass
order by conname;


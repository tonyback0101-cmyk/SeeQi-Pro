-- 完整修复 assessment_records 表结构

-- 1. 确保表存在（使用新版本结构）
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

-- 2. 添加缺失的列（向后兼容旧版本）
alter table public.assessment_records
  add column if not exists module text,
  add column if not exists payload jsonb;

-- 3. 同步旧数据：如果 module 有值但 module_type 为空，复制过去
update public.assessment_records
set module_type = module
where (module_type is null or module_type = '') and module is not null;

-- 4. 同步旧数据：如果 payload 有值但 data 为空，复制过去
update public.assessment_records
set data = payload
where (data is null or data = '{}'::jsonb) and payload is not null and payload != '{}'::jsonb;

-- 5. 添加唯一约束（如果不存在）
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

-- 6. 创建同步触发器（保持 module 和 module_type 同步）
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
  return new;
end;
$$;

drop trigger if exists trg_sync_assessment_columns on public.assessment_records;
create trigger trg_sync_assessment_columns
before insert or update on public.assessment_records
for each row
execute procedure sync_assessment_columns();

-- 7. 创建索引
create index if not exists assessment_records_user_idx on public.assessment_records (user_id, created_at desc);
create index if not exists assessment_records_module_idx on public.assessment_records (module_type);

-- 8. 验证
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'assessment_records'
order by ordinal_position;


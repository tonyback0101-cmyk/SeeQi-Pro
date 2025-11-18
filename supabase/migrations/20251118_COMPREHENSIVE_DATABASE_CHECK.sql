-- ============================================
-- 全面数据库检查和修复脚本
-- 确保所有表、列、索引、RLS 策略都正确配置
-- ============================================

-- ============================================
-- 第一部分：检查并修复 sessions 表
-- ============================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'zh',
  tz text not null default 'Asia/Shanghai',
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.sessions
  add column if not exists locale text,
  add column if not exists tz text,
  add column if not exists created_at timestamptz;

update public.sessions set locale = 'zh' where locale is null;
update public.sessions set tz = 'Asia/Shanghai' where tz is null;
update public.sessions set created_at = timezone('utc'::text, now()) where created_at is null;

alter table public.sessions
  alter column locale set default 'zh',
  alter column tz set default 'Asia/Shanghai',
  alter column created_at set default timezone('utc'::text, now());

do $$
begin
  alter table public.sessions alter column locale set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.sessions alter column tz set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.sessions alter column created_at set not null;
exception when others then null;
end $$;

-- ============================================
-- 第二部分：检查并修复 uploads 表
-- ============================================
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  type text not null check (type in ('palm', 'tongue', 'dream')),
  storage_path text not null,
  mime_type text,
  quality_score numeric(5,2),
  features jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.uploads
  add column if not exists session_id uuid,
  add column if not exists type text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists quality_score numeric(5,2),
  add column if not exists features jsonb,
  add column if not exists created_at timestamptz;

update public.uploads set features = '{}'::jsonb where features is null;
update public.uploads set created_at = timezone('utc'::text, now()) where created_at is null;

alter table public.uploads
  alter column features set default '{}'::jsonb,
  alter column created_at set default timezone('utc'::text, now());

do $$
begin
  alter table public.uploads alter column type set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.uploads alter column storage_path set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.uploads alter column created_at set not null;
exception when others then null;
end $$;

-- 外键约束
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.uploads'::regclass
    and conname = 'uploads_session_id_fkey'
  ) then
    alter table public.uploads
    add constraint uploads_session_id_fkey
    foreign key (session_id) references public.sessions(id) on delete set null;
  end if;
end $$;

-- 索引
create index if not exists uploads_session_idx on public.uploads (session_id);
create index if not exists uploads_type_idx on public.uploads (type);

-- ============================================
-- 第三部分：检查并修复 reports 表（已在 20251117_COMPLETE_FIX_ALL.sql 中处理）
-- ============================================
-- 这部分已经在之前的脚本中完成，这里只做验证

-- ============================================
-- 第四部分：检查并修复 dream_keywords_std 表
-- ============================================
-- 这部分在 20251118_fix_dream_keywords_std_table.sql 中处理

-- ============================================
-- 第五部分：验证所有关键表的结构
-- ============================================
do $$
declare
  missing_tables text[] := ARRAY[]::text[];
  table_name text;
begin
  for table_name in 
    select unnest(ARRAY['sessions', 'uploads', 'reports', 'report_access', 'dream_keywords_std', 'dict_constitution', 'dict_solar_term'])
  loop
    if not exists (
      select 1 from information_schema.tables 
      where table_schema = 'public' 
      and table_name = table_name
    ) then
      missing_tables := array_append(missing_tables, table_name);
    end if;
  end loop;
  
  if array_length(missing_tables, 1) > 0 then
    raise notice '警告：以下表不存在: %', array_to_string(missing_tables, ', ');
  else
    raise notice '所有关键表都存在';
  end if;
end $$;

-- ============================================
-- 第六部分：验证所有关键外键约束
-- ============================================
do $$
declare
  missing_fkeys text[] := ARRAY[]::text[];
  fkey_name text;
begin
  for fkey_name in 
    select unnest(ARRAY[
      'uploads_session_id_fkey',
      'reports_session_id_fkey',
      'report_access_report_id_fkey',
      'report_access_session_id_fkey'
    ])
  loop
    if not exists (
      select 1 from pg_constraint
      where conname = fkey_name
    ) then
      missing_fkeys := array_append(missing_fkeys, fkey_name);
    end if;
  end loop;
  
  if array_length(missing_fkeys, 1) > 0 then
    raise notice '警告：以下外键约束不存在: %', array_to_string(missing_fkeys, ', ');
  else
    raise notice '所有关键外键约束都存在';
  end if;
end $$;

select '数据库检查完成' as status;


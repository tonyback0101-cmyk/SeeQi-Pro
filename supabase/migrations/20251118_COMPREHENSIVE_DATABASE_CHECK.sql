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
-- 第三部分：检查并修复 reports 表的关键列
-- ============================================
-- 确保 reports 表有所有必需的列
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

-- 更新 NULL 值
update public.reports set locale = 'zh' where locale is null;
update public.reports set tz = 'Asia/Shanghai' where tz is null;
update public.reports set unlocked = false where unlocked is null;
update public.reports set created_at = timezone('utc'::text, now()) where created_at is null;

-- 设置默认值
alter table public.reports
  alter column locale set default 'zh',
  alter column tz set default 'Asia/Shanghai',
  alter column unlocked set default false,
  alter column created_at set default timezone('utc'::text, now());

-- 设置 NOT NULL（如果可能）
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

-- 外键约束
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reports'::regclass
    and conname = 'reports_session_id_fkey'
  ) then
    alter table public.reports
    add constraint reports_session_id_fkey
    foreign key (session_id) references public.sessions(id) on delete set null;
  end if;
end $$;

-- ============================================
-- 第四部分：检查并修复 dream_keywords_std 表
-- ============================================
-- 这部分在 20251118_fix_dream_keywords_std_table.sql 中处理
-- 这里只做基本检查
create table if not exists public.dream_keywords_std (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  locale text not null default 'zh',
  category text,
  five_element text,
  emotion text,
  meaning_zh text,
  meaning_en text,
  health_tip_zh text,
  health_tip_en text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.dream_keywords_std
  add column if not exists id uuid,
  add column if not exists keyword text,
  add column if not exists locale text,
  add column if not exists category text,
  add column if not exists five_element text,
  add column if not exists emotion text,
  add column if not exists meaning_zh text,
  add column if not exists meaning_en text,
  add column if not exists health_tip_zh text,
  add column if not exists health_tip_en text,
  add column if not exists created_at timestamptz;

-- 更新 NULL 值
update public.dream_keywords_std set locale = 'zh' where locale is null;
update public.dream_keywords_std set created_at = timezone('utc'::text, now()) where created_at is null;

-- 设置默认值
alter table public.dream_keywords_std
  alter column locale set default 'zh',
  alter column created_at set default timezone('utc'::text, now());

-- 设置 NOT NULL
do $$
begin
  alter table public.dream_keywords_std alter column keyword set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.dream_keywords_std alter column locale set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.dream_keywords_std alter column created_at set not null;
exception when others then null;
end $$;

-- 索引
create index if not exists dream_keywords_std_keyword_locale_idx 
  on public.dream_keywords_std (keyword, locale);

-- ============================================
-- 第五部分：验证所有关键表的结构
-- ============================================
do $$
declare
  missing_tables text[] := ARRAY[]::text[];
  missing_columns text[] := ARRAY[]::text[];
  tbl_name text;
  col_name text;
  required_columns text[];
begin
  -- 检查表是否存在
  for tbl_name in 
    select unnest(ARRAY['sessions', 'uploads', 'reports', 'report_access', 'dream_keywords_std', 'dict_constitution', 'dict_solar_term'])
  loop
    if not exists (
      select 1 from information_schema.tables t
      where t.table_schema = 'public' 
      and t.table_name = tbl_name
    ) then
      missing_tables := array_append(missing_tables, tbl_name);
    end if;
  end loop;
  
  -- 检查关键列
  -- sessions 表
  for col_name in select unnest(ARRAY['id', 'locale', 'tz', 'created_at'])
  loop
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
      and c.table_name = 'sessions'
      and c.column_name = col_name
    ) then
      missing_columns := array_append(missing_columns, 'sessions.' || col_name);
    end if;
  end loop;
  
  -- uploads 表
  for col_name in select unnest(ARRAY['id', 'session_id', 'type', 'storage_path', 'created_at'])
  loop
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
      and c.table_name = 'uploads'
      and c.column_name = col_name
    ) then
      missing_columns := array_append(missing_columns, 'uploads.' || col_name);
    end if;
  end loop;
  
  -- reports 表
  for col_name in select unnest(ARRAY['id', 'session_id', 'locale', 'tz', 'unlocked', 'created_at'])
  loop
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
      and c.table_name = 'reports'
      and c.column_name = col_name
    ) then
      missing_columns := array_append(missing_columns, 'reports.' || col_name);
    end if;
  end loop;
  
  -- dream_keywords_std 表
  for col_name in select unnest(ARRAY['id', 'keyword', 'locale', 'meaning_zh', 'meaning_en'])
  loop
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
      and c.table_name = 'dream_keywords_std'
      and c.column_name = col_name
    ) then
      missing_columns := array_append(missing_columns, 'dream_keywords_std.' || col_name);
    end if;
  end loop;
  
  -- 输出结果
  if array_length(missing_tables, 1) > 0 then
    raise notice '❌ 警告：以下表不存在: %', array_to_string(missing_tables, ', ');
  else
    raise notice '✅ 所有关键表都存在';
  end if;
  
  if array_length(missing_columns, 1) > 0 then
    raise notice '❌ 警告：以下列不存在: %', array_to_string(missing_columns, ', ');
  else
    raise notice '✅ 所有关键列都存在';
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
    raise notice '❌ 警告：以下外键约束不存在: %', array_to_string(missing_fkeys, ', ');
  else
    raise notice '✅ 所有关键外键约束都存在';
  end if;
end $$;

-- ============================================
-- 第七部分：验证关键索引
-- ============================================
do $$
declare
  missing_indexes text[] := ARRAY[]::text[];
  idx_name text;
begin
  for idx_name in 
    select unnest(ARRAY[
      'uploads_session_idx',
      'uploads_type_idx',
      'dream_keywords_std_keyword_locale_idx'
    ])
  loop
    if not exists (
      select 1 from pg_indexes
      where schemaname = 'public'
      and indexname = idx_name
    ) then
      missing_indexes := array_append(missing_indexes, idx_name);
    end if;
  end loop;
  
  if array_length(missing_indexes, 1) > 0 then
    raise notice '⚠️  警告：以下索引不存在: %', array_to_string(missing_indexes, ', ');
  else
    raise notice '✅ 所有关键索引都存在';
  end if;
end $$;

-- ============================================
-- 第八部分：验证 RLS 策略
-- ============================================
do $$
declare
  tables_without_rls text[] := ARRAY[]::text[];
  tbl_name text;
begin
  for tbl_name in 
    select unnest(ARRAY['sessions', 'uploads', 'reports', 'dream_keywords_std'])
  loop
    if exists (
      select 1 from information_schema.tables t
      where t.table_schema = 'public'
      and t.table_name = tbl_name
    ) then
      -- 检查 RLS 是否启用
      if not exists (
        select 1 from pg_tables pt
        where pt.schemaname = 'public'
        and pt.tablename = tbl_name
        and pt.rowsecurity = true
      ) then
        -- 检查是否有 service_role 策略（至少应该有一个）
        if not exists (
          select 1 from pg_policies pp
          where pp.schemaname = 'public'
          and pp.tablename = tbl_name
          and pp.roles = ARRAY['service_role']
        ) then
          tables_without_rls := array_append(tables_without_rls, tbl_name);
        end if;
      end if;
    end if;
  end loop;
  
  if array_length(tables_without_rls, 1) > 0 then
    raise notice '⚠️  警告：以下表可能缺少 RLS 策略: %', array_to_string(tables_without_rls, ', ');
  else
    raise notice '✅ 所有关键表的 RLS 策略都已配置';
  end if;
end $$;

-- ============================================
-- 最终总结
-- ============================================
select 
  '数据库检查完成' as status,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('sessions', 'uploads', 'reports', 'dream_keywords_std')) as tables_found,
  (select count(*) from pg_constraint where conname in ('uploads_session_id_fkey', 'reports_session_id_fkey', 'report_access_report_id_fkey', 'report_access_session_id_fkey')) as foreign_keys_found;


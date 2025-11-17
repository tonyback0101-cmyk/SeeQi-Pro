-- 完整修复 reports 表 - 确保所有必需的列都存在

-- ============================================
-- 1. 确保表存在（使用最新结构）
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

-- ============================================
-- 2. 添加所有可能缺失的列（id 列已存在，跳过）
-- ============================================
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

-- 添加外键约束（如果不存在）
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
-- 3. 设置列的约束和默认值
-- ============================================
-- 确保 id 是主键（如果还没有）
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reports'::regclass
    and contype = 'p'
  ) then
    alter table public.reports
    add primary key (id);
  end if;
end $$;

-- 设置 NOT NULL 约束和默认值
alter table public.reports
  alter column locale set not null,
  alter column locale set default 'zh',
  alter column tz set not null,
  alter column tz set default 'Asia/Shanghai',
  alter column unlocked set not null,
  alter column unlocked set default false,
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now());

-- 更新空值
update public.reports
set locale = 'zh'
where locale is null;

update public.reports
set tz = 'Asia/Shanghai'
where tz is null;

update public.reports
set unlocked = false
where unlocked is null;

update public.reports
set created_at = timezone('utc'::text, now())
where created_at is null;

-- ============================================
-- 4. 删除可能存在的旧列（如果不需要）
-- ============================================
-- 如果旧表有 expires_at 列但新表不需要，可以选择删除
-- alter table public.reports drop column if exists expires_at;

-- ============================================
-- 5. 创建索引
-- ============================================
create index if not exists reports_session_idx on public.reports (session_id, created_at desc);
create index if not exists reports_user_idx on public.reports (session_id) where session_id is not null;
create index if not exists reports_created_at_idx on public.reports (created_at desc);

-- 如果 qi_index 列存在，创建 GIN 索引
create index if not exists reports_qi_index_idx on public.reports using gin (qi_index) where qi_index is not null;

-- ============================================
-- 6. 验证表结构
-- ============================================
select 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'reports'
order by ordinal_position;

-- 验证主键
select 
  conname as constraint_name,
  contype as constraint_type
from pg_constraint
where conrelid = 'public.reports'::regclass
and contype = 'p';


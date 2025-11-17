-- 修复 sessions 表结构，确保列名正确

-- 1. 确保表存在（标准结构）
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'zh',
  tz text not null default 'Asia/Shanghai',
  source text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. 如果存在不应该的列，删除它们（unlocked 和 expires_at 不应该在 sessions 表中）
-- 注意：如果这些列有数据，删除前请先备份
-- alter table public.sessions drop column if exists unlocked;
-- alter table public.sessions drop column if exists expires_at;

-- 3. 确保所有必需的列存在
alter table public.sessions
  add column if not exists locale text not null default 'zh',
  add column if not exists tz text not null default 'Asia/Shanghai',
  add column if not exists source text,
  add column if not exists created_at timestamptz not null default timezone('utc'::text, now());

-- 4. 如果 tz 列可以为空，但代码需要它不为空，则修复
alter table public.sessions
  alter column locale set not null,
  alter column locale set default 'zh',
  alter column tz set not null,
  alter column tz set default 'Asia/Shanghai',
  alter column created_at set not null,
  alter column created_at set default timezone('utc'::text, now());

-- 5. 更新现有 NULL 值
update public.sessions
set locale = 'zh'
where locale is null;

update public.sessions
set tz = 'Asia/Shanghai'
where tz is null;

update public.sessions
set created_at = timezone('utc'::text, now())
where created_at is null;

-- 6. 创建索引
create index if not exists sessions_created_at_idx on public.sessions (created_at desc);

-- 7. 验证表结构
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'sessions'
order by ordinal_position;


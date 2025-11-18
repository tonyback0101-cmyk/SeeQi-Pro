-- ============================================
-- 修复 dream_keywords_std 表结构
-- 确保表存在且包含所有必需的列
-- ============================================

-- 创建 dream_keywords_std 表（如果不存在）
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

-- 添加可能缺失的列
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

-- 设置默认值和约束
do $$
begin
  -- 设置 locale 默认值
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'dream_keywords_std' 
    and column_name = 'locale' 
    and column_default is not null
  ) then
    alter table public.dream_keywords_std
      alter column locale set default 'zh';
  end if;
  
  -- 设置 created_at 默认值
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'dream_keywords_std' 
    and column_name = 'created_at' 
    and column_default is not null
  ) then
    alter table public.dream_keywords_std
      alter column created_at set default timezone('utc'::text, now());
  end if;
  
  -- 设置 NOT NULL 约束
  update public.dream_keywords_std set locale = 'zh' where locale is null;
  update public.dream_keywords_std set created_at = timezone('utc'::text, now()) where created_at is null;
  
  alter table public.dream_keywords_std
    alter column keyword set not null,
    alter column locale set not null,
    alter column created_at set not null;
exception when others then
  -- 如果列不存在或其他错误，忽略
  null;
end $$;

-- 创建索引
create index if not exists dream_keywords_std_keyword_locale_idx 
  on public.dream_keywords_std (keyword, locale);

-- 启用 RLS
alter table public.dream_keywords_std enable row level security;

-- RLS 策略：service_role 可以访问所有数据
drop policy if exists dream_keywords_std_service_all on public.dream_keywords_std;
create policy dream_keywords_std_service_all on public.dream_keywords_std
  for all to service_role using (true) with check (true);

-- RLS 策略：anon 和 authenticated 用户可以读取
drop policy if exists dream_keywords_std_public_read on public.dream_keywords_std;
create policy dream_keywords_std_public_read on public.dream_keywords_std
  for select to anon, authenticated using (true);

-- 如果 dream_keywords 表存在且有数据，复制到 dream_keywords_std
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'dream_keywords') then
    insert into public.dream_keywords_std (
      keyword, locale, category, five_element, emotion, 
      meaning_zh, meaning_en, health_tip_zh, health_tip_en
    )
    select 
      keyword, locale, category, five_element, emotion,
      meaning_zh, meaning_en, health_tip_zh, health_tip_en
    from public.dream_keywords
    where not exists (
      select 1 from public.dream_keywords_std d2
      where d2.keyword = dream_keywords.keyword 
      and d2.locale = dream_keywords.locale
    )
    on conflict do nothing;
  end if;
end $$;


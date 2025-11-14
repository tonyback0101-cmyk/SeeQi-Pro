create extension if not exists "pgcrypto";

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'zh',
  tz text not null default 'Asia/Shanghai',
  source text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists sessions_created_at_idx on public.sessions (created_at desc);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  type text not null check (type in ('palm', 'tongue')),
  storage_path text not null,
  mime_type text not null,
  quality_score integer,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists uploads_session_idx on public.uploads (session_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete set null,
  constitution text,
  palm_result jsonb,
  tongue_result jsonb,
  solar_term text,
  advice jsonb,
  dream jsonb,
  quote text,
  locale text not null default 'zh',
  tz text,
  unlocked boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz not null default timezone('utc'::text, now()) + interval '30 days'
);

create index if not exists reports_session_idx on public.reports (session_id);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_expires_at_idx on public.reports (expires_at);

create table if not exists public.dict_constitution (
  code text primary key,
  name_zh text not null,
  name_en text not null,
  desc_zh text not null,
  desc_en text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

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

create index if not exists dict_solar_term_created_idx on public.dict_solar_term (created_at desc);

create table if not exists public.dream_keywords (
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

create index if not exists dream_keywords_keyword_locale_idx on public.dream_keywords (keyword, locale);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id uuid references public.sessions (id) on delete set null,
  report_id uuid references public.reports (id) on delete set null,
  status text not null default 'pending',
  currency text not null default 'USD',
  amount_cents integer not null,
  payment_provider text not null,
  provider_intent_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists orders_session_idx on public.orders (session_id);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.touch_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_touch_orders on public.orders;
create trigger trg_touch_orders
before update on public.orders
for each row
execute procedure public.touch_orders_updated_at();



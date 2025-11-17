-- 一次性创建所有需要的表、bucket 和 RLS 策略
-- 执行此文件后，所有功能模块（掌纹、舌苔、梦境、分析等）都应该能正常工作

-- ========== 1. 创建所有 Storage Buckets ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'analysis-temp',
  'analysis-temp',
  false,
  8388608, -- 8 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'palmprints',
  'palmprints',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ========== 2. 创建所有需要的表（如果不存在） ==========

-- sessions 表
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'zh',
  tz text not null default 'Asia/Shanghai',
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- uploads 表
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

-- reports 表（如果不存在）
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

-- report_access 表（如果不存在）
create table if not exists public.report_access (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  accessed_at timestamptz not null default timezone('utc'::text, now()),
  unique(report_id, user_id)
);

-- orders 表（如果不存在）
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- user_profiles 表（如果不存在）
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  subscription_status text,
  subscription_expires_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- assessment_records 表（如果不存在）
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

-- report_email_queue 表（如果不存在）
create table if not exists public.report_email_queue (
  id uuid primary key default gen_random_uuid(),
  email_to text not null,
  report_id uuid references public.reports(id) on delete set null,
  summary text,
  share_link text,
  attempts integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- app_settings 表（如果不存在）
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- payout_requests 表（如果不存在）
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  payout_method jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- wallet_transactions 表（如果不存在）
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount integer not null,
  currency text not null default 'usd',
  description text,
  reference_id uuid,
  reference_type text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- palm_prints 表（如果不存在）
create table if not exists public.palm_prints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  hand_type text not null check (hand_type in ('left', 'right')),
  palm_region text not null check (palm_region in ('full', 'palm', 'fingers')),
  quality_rating integer check (quality_rating between 1 and 5),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- palm_features 表（如果不存在）
create table if not exists public.palm_features (
  id uuid primary key default gen_random_uuid(),
  palmprint_id uuid not null references public.palm_prints (id) on delete cascade,
  feature_type text not null check (feature_type in ('mainLine', 'wrinkle', 'minutiae')),
  position_x numeric(6, 3) not null,
  position_y numeric(6, 3) not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- palm_upload_logs 表（如果不存在）
create table if not exists public.palm_upload_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  palmprint_id uuid null references public.palm_prints (id) on delete set null,
  action text not null check (action in ('upload', 'offline_queue', 'sync_success', 'sync_failure')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ========== 3. 创建所有索引 ==========
create index if not exists sessions_created_idx on public.sessions (created_at desc);
create index if not exists uploads_session_idx on public.uploads (session_id, created_at desc);
create index if not exists reports_session_idx on public.reports (session_id, created_at desc);
create index if not exists reports_user_idx on public.reports (session_id) where session_id is not null;
create index if not exists report_access_report_idx on public.report_access (report_id);
create index if not exists report_access_user_idx on public.report_access (user_id);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists assessment_records_user_idx on public.assessment_records (user_id, created_at desc);
create index if not exists report_email_queue_status_idx on public.report_email_queue (status, created_at);
create index if not exists payout_requests_user_idx on public.payout_requests (user_id, created_at desc);
create index if not exists wallet_transactions_user_idx on public.wallet_transactions (user_id, created_at desc);
create index if not exists palm_prints_user_idx on public.palm_prints (user_id, created_at desc);
create index if not exists palm_features_palmprint_idx on public.palm_features (palmprint_id);
create index if not exists palm_upload_logs_user_idx on public.palm_upload_logs (user_id, created_at desc);
create index if not exists palm_upload_logs_palmprint_idx on public.palm_upload_logs (palmprint_id);

-- ========== 4. 创建更新触发器函数 ==========
create or replace function public.fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- 为需要的表创建更新触发器
drop trigger if exists trg_touch_palm_prints on public.palm_prints;
create trigger trg_touch_palm_prints
before update on public.palm_prints
for each row
execute procedure public.fn_touch_updated_at();

drop trigger if exists trg_touch_orders on public.orders;
create trigger trg_touch_orders
before update on public.orders
for each row
execute procedure public.fn_touch_updated_at();

drop trigger if exists trg_touch_user_profiles on public.user_profiles;
create trigger trg_touch_user_profiles
before update on public.user_profiles
for each row
execute procedure public.fn_touch_updated_at();

drop trigger if exists trg_touch_assessment_records on public.assessment_records;
create trigger trg_touch_assessment_records
before update on public.assessment_records
for each row
execute procedure public.fn_touch_updated_at();

drop trigger if exists trg_touch_payout_requests on public.payout_requests;
create trigger trg_touch_payout_requests
before update on public.payout_requests
for each row
execute procedure public.fn_touch_updated_at();

-- ========== 5. 启用 RLS 并创建策略（service_role 优先） ==========

-- sessions 表
alter table public.sessions enable row level security;
drop policy if exists sessions_service_all on public.sessions;
create policy sessions_service_all on public.sessions for all to service_role using (true) with check (true);
drop policy if exists sessions_anon_insert on public.sessions;
create policy sessions_anon_insert on public.sessions for insert to anon, authenticated with check (true);

-- uploads 表
alter table public.uploads enable row level security;
drop policy if exists uploads_service_all on public.uploads;
create policy uploads_service_all on public.uploads for all to service_role using (true) with check (true);

-- reports 表
alter table public.reports enable row level security;
drop policy if exists reports_service_all on public.reports;
create policy reports_service_all on public.reports for all to service_role using (true) with check (true);
drop policy if exists reports_session_select on public.reports;
create policy reports_session_select on public.reports for select to anon, authenticated using (true);

-- report_access 表
alter table public.report_access enable row level security;
drop policy if exists report_access_service_all on public.report_access;
create policy report_access_service_all on public.report_access for all to service_role using (true) with check (true);
drop policy if exists report_access_user_select on public.report_access;
create policy report_access_user_select on public.report_access for select to authenticated using (auth.uid() = user_id);

-- orders 表
alter table public.orders enable row level security;
drop policy if exists orders_service_all on public.orders;
create policy orders_service_all on public.orders for all to service_role using (true) with check (true);
drop policy if exists orders_user_select on public.orders;
create policy orders_user_select on public.orders for select to authenticated using (auth.uid() = user_id);

-- user_profiles 表
alter table public.user_profiles enable row level security;
drop policy if exists user_profiles_service_all on public.user_profiles;
create policy user_profiles_service_all on public.user_profiles for all to service_role using (true) with check (true);
drop policy if exists user_profiles_user_select on public.user_profiles;
create policy user_profiles_user_select on public.user_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists user_profiles_user_update on public.user_profiles;
create policy user_profiles_user_update on public.user_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- assessment_records 表
alter table public.assessment_records enable row level security;
drop policy if exists assessment_records_service_all on public.assessment_records;
create policy assessment_records_service_all on public.assessment_records for all to service_role using (true) with check (true);
drop policy if exists assessment_records_user_select on public.assessment_records;
create policy assessment_records_user_select on public.assessment_records for select to authenticated using (auth.uid() = user_id);

-- report_email_queue 表
alter table public.report_email_queue enable row level security;
drop policy if exists report_email_queue_service_all on public.report_email_queue;
create policy report_email_queue_service_all on public.report_email_queue for all to service_role using (true) with check (true);

-- app_settings 表
alter table public.app_settings enable row level security;
drop policy if exists app_settings_service_all on public.app_settings;
create policy app_settings_service_all on public.app_settings for all to service_role using (true) with check (true);
drop policy if exists app_settings_public_read on public.app_settings;
create policy app_settings_public_read on public.app_settings for select to anon, authenticated using (true);

-- payout_requests 表
alter table public.payout_requests enable row level security;
drop policy if exists payout_requests_service_all on public.payout_requests;
create policy payout_requests_service_all on public.payout_requests for all to service_role using (true) with check (true);
drop policy if exists payout_requests_user_select on public.payout_requests;
create policy payout_requests_user_select on public.payout_requests for select to authenticated using (auth.uid() = user_id);

-- wallet_transactions 表
alter table public.wallet_transactions enable row level security;
drop policy if exists wallet_transactions_service_all on public.wallet_transactions;
create policy wallet_transactions_service_all on public.wallet_transactions for all to service_role using (true) with check (true);
drop policy if exists wallet_transactions_user_select on public.wallet_transactions;
create policy wallet_transactions_user_select on public.wallet_transactions for select to authenticated using (auth.uid() = user_id);

-- palm_prints 表
alter table public.palm_prints enable row level security;
drop policy if exists palm_prints_service_all on public.palm_prints;
create policy palm_prints_service_all on public.palm_prints for all to service_role using (true) with check (true);
drop policy if exists palm_prints_user_insert on public.palm_prints;
create policy palm_prints_user_insert on public.palm_prints for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists palm_prints_user_select on public.palm_prints;
create policy palm_prints_user_select on public.palm_prints for select to authenticated using (auth.uid() = user_id);
drop policy if exists palm_prints_user_update on public.palm_prints;
create policy palm_prints_user_update on public.palm_prints for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists palm_prints_user_delete on public.palm_prints;
create policy palm_prints_user_delete on public.palm_prints for delete to authenticated using (auth.uid() = user_id);

-- palm_features 表
alter table public.palm_features enable row level security;
drop policy if exists palm_features_service_all on public.palm_features;
create policy palm_features_service_all on public.palm_features for all to service_role using (true) with check (true);
drop policy if exists palm_features_user_select on public.palm_features;
create policy palm_features_user_select on public.palm_features for select to authenticated using (
  exists (select 1 from public.palm_prints where id = palm_features.palmprint_id and user_id = auth.uid())
);

-- palm_upload_logs 表
alter table public.palm_upload_logs enable row level security;
drop policy if exists palm_upload_logs_service_all on public.palm_upload_logs;
create policy palm_upload_logs_service_all on public.palm_upload_logs for all to service_role using (true) with check (true);
drop policy if exists palm_upload_logs_user_insert on public.palm_upload_logs;
create policy palm_upload_logs_user_insert on public.palm_upload_logs for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists palm_upload_logs_user_select on public.palm_upload_logs;
create policy palm_upload_logs_user_select on public.palm_upload_logs for select to authenticated using (auth.uid() = user_id);

-- ========== 6. 验证 ==========
select 'Tables created' as status, count(*) as count
from information_schema.tables
where table_schema='public' and table_name in (
  'sessions', 'uploads', 'reports', 'report_access', 'orders', 'user_profiles',
  'assessment_records', 'report_email_queue', 'app_settings', 'payout_requests',
  'wallet_transactions', 'palm_prints', 'palm_features', 'palm_upload_logs'
);

select 'Buckets created' as status, count(*) as count
from storage.buckets
where id in ('analysis-temp', 'palmprints');

select 'RLS policies' as status, count(*) as count
from pg_policies
where schemaname='public' and tablename in (
  'sessions', 'uploads', 'reports', 'report_access', 'orders', 'user_profiles',
  'assessment_records', 'report_email_queue', 'app_settings', 'payout_requests',
  'wallet_transactions', 'palm_prints', 'palm_features', 'palm_upload_logs'
);


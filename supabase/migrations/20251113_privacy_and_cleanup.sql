create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete set null,
  consented_at timestamptz not null default timezone('utc'::text, now()),
  locale text not null default 'zh',
  tz text not null default 'Asia/Shanghai',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists privacy_consents_session_idx on public.privacy_consents (session_id, consented_at desc);

create table if not exists public.cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  started_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz,
  success boolean,
  details jsonb default '{}'
);

create index if not exists cleanup_jobs_type_idx on public.cleanup_jobs (job_type, started_at desc);


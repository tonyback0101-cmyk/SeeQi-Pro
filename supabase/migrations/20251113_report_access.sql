create table if not exists public.report_access (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  tier text not null check (tier in ('lite', 'full')),
  granted_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists report_access_report_session_idx
  on public.report_access (report_id, session_id);

create unique index if not exists report_access_report_user_idx
  on public.report_access (report_id, user_id)
  where user_id is not null;

create or replace function public.touch_report_access_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_touch_report_access on public.report_access;
create trigger trg_touch_report_access
before update on public.report_access
for each row
execute procedure public.touch_report_access_updated_at();


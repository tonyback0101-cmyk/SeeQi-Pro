alter table if exists public.reports
add column if not exists qi_index jsonb default '{}'::jsonb;

create index if not exists reports_qi_index_idx
  on public.reports using gin (qi_index);


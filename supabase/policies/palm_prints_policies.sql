-- palm_prints storage RBAC and logging setup

-- storage access policy: only owner may read/write
insert into storage.policies (id, bucket_id, name, definition)
values
  (
    gen_random_uuid(),
    'palmprints',
    'Users read own palm images',
    'using ( auth.uid() = owner )'
  )
on conflict do nothing;

insert into storage.policies (id, bucket_id, name, definition)
values
  (
    gen_random_uuid(),
    'palmprints',
    'Users upload own palm images',
    'using ( auth.uid() = owner ) with check ( auth.uid() = owner )'
  )
on conflict do nothing;

-- create table for logging uploads and sync events
create table if not exists public.palm_upload_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  palmprint_id uuid references public.palm_prints (id) on delete cascade,
  action text not null check (action in ('upload', 'offline_queue', 'sync_success', 'sync_failure')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists palm_upload_logs_user_idx on public.palm_upload_logs (user_id, created_at desc);

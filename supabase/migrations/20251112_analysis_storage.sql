insert into storage.buckets (id, name, public)
values ('analysis-temp', 'analysis-temp', false)
on conflict (id) do nothing;


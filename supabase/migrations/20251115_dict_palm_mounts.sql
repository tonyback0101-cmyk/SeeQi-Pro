-- Create dict_palm_mounts table
create table if not exists public.dict_palm_mounts (
  code text primary key,
  name_zh text not null,
  name_en text not null,
  meaning_zh text not null,
  meaning_en text,
  health_risk_zh text,
  health_risk_en text,
  advice_zh text,
  advice_en text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists dict_palm_mounts_created_idx on public.dict_palm_mounts (created_at desc);






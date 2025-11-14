alter table public.dict_constitution
  add column if not exists feature text,
  add column if not exists advice_diet text,
  add column if not exists advice_activity text,
  add column if not exists advice_acupoint text;

alter table public.dict_solar_term
  add column if not exists element text,
  add column if not exists health_tip text;


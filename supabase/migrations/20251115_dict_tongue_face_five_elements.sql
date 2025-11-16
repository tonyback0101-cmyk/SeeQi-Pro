-- Create dict_tongue_features table
create table if not exists public.dict_tongue_features (
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

create index if not exists dict_tongue_features_created_idx on public.dict_tongue_features (created_at desc);

-- Create dict_face_features table
create table if not exists public.dict_face_features (
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

create index if not exists dict_face_features_created_idx on public.dict_face_features (created_at desc);

-- Create dict_five_elements table
create table if not exists public.dict_five_elements (
  element text primary key,
  organ_zh text not null,
  organ_en text not null,
  emotion_zh text not null,
  emotion_en text not null,
  personality_zh text,
  personality_en text,
  food_zh text,
  food_en text,
  action_zh text,
  action_en text,
  acupoint_zh text,
  acupoint_en text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists dict_five_elements_created_idx on public.dict_five_elements (created_at desc);






-- 创建掌纹采集相关数据结构

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

create index if not exists palm_prints_user_idx on public.palm_prints (user_id, created_at desc);

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

create index if not exists palm_features_palmprint_idx on public.palm_features (palmprint_id);

-- 更新触发器
create or replace function public.fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_touch_palm_prints on public.palm_prints;
create trigger trg_touch_palm_prints
before update on public.palm_prints
for each row
execute procedure public.fn_touch_updated_at();

-- 确保存储桶存在
insert into storage.buckets (id, name, public)
values ('palmprints', 'palmprints', false)
on conflict (id) do nothing;



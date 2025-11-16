create table public.privacy_consents (

  id uuid not null default gen_random_uuid (),

  session_id uuid null,

  consented_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),

  locale text not null default 'zh'::text,

  tz text not null default 'Asia/Shanghai'::text,

  ip_address text null,

  user_agent text null,

  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),

  constraint privacy_consents_pkey primary key (id),

  constraint privacy_consents_session_id_fkey foreign KEY (session_id) references sessions (id) on delete set null

) TABLESPACE pg_default;



create index IF not exists privacy_consents_session_idx on public.privacy_consents using btree (session_id, consented_at desc) TABLESPACE pg_default;





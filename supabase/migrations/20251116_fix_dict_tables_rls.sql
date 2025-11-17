-- 修复 dict_constitution 和 dict_solar_term 表的 RLS 策略
-- 这些字典表应该对所有用户可读

-- dict_constitution 表
alter table public.dict_constitution enable row level security;

drop policy if exists dict_constitution_service_all on public.dict_constitution;
create policy dict_constitution_service_all 
on public.dict_constitution 
for all 
to service_role 
using (true) 
with check (true);

drop policy if exists dict_constitution_public_read on public.dict_constitution;
create policy dict_constitution_public_read 
on public.dict_constitution 
for select 
to anon, authenticated 
using (true);

-- dict_solar_term 表
alter table public.dict_solar_term enable row level security;

drop policy if exists dict_solar_term_service_all on public.dict_solar_term;
create policy dict_solar_term_service_all 
on public.dict_solar_term 
for all 
to service_role 
using (true) 
with check (true);

drop policy if exists dict_solar_term_public_read on public.dict_solar_term;
create policy dict_solar_term_public_read 
on public.dict_solar_term 
for select 
to anon, authenticated 
using (true);

-- 验证策略
select tablename, policyname, cmd, roles
from pg_policies
where schemaname='public' and tablename in ('dict_constitution', 'dict_solar_term')
order by tablename, cmd;


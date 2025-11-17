-- 修复 palm_prints 表的 RLS 策略，确保 service_role 可以插入数据

-- 先删除可能存在的旧策略
drop policy if exists palm_prints_service_all on public.palm_prints;
drop policy if exists palm_prints_user_insert on public.palm_prints;

-- 重新创建 service_role 的完整权限策略（优先级最高）
create policy palm_prints_service_all
on public.palm_prints
for all
to service_role
using (true)
with check (true);

-- 用户插入策略（使用 auth.uid() 匹配 user_id）
create policy palm_prints_user_insert
on public.palm_prints
for insert
to authenticated
with check (auth.uid() = user_id);

-- 用户查询策略
drop policy if exists palm_prints_user_select on public.palm_prints;
create policy palm_prints_user_select
on public.palm_prints
for select
to authenticated
using (auth.uid() = user_id);

-- 用户更新策略
drop policy if exists palm_prints_user_update on public.palm_prints;
create policy palm_prints_user_update
on public.palm_prints
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 用户删除策略
drop policy if exists palm_prints_user_delete on public.palm_prints;
create policy palm_prints_user_delete
on public.palm_prints
for delete
to authenticated
using (auth.uid() = user_id);

-- 同样修复 palm_upload_logs 表的策略
drop policy if exists palm_upload_logs_service_all on public.palm_upload_logs;
create policy palm_upload_logs_service_all
on public.palm_upload_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists palm_upload_logs_user_insert on public.palm_upload_logs;
create policy palm_upload_logs_user_insert
on public.palm_upload_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- 验证策略是否创建成功
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname='public' and tablename in ('palm_prints', 'palm_upload_logs')
order by tablename, cmd, policyname;


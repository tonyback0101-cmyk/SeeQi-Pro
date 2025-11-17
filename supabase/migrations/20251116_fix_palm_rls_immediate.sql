-- 一键修复：确保 service_role 可以插入 palm_prints（最简单直接）

-- 方法1：暂时允许所有角色插入（仅用于测试，生产环境建议用方法2）
-- alter table public.palm_prints disable row level security;

-- 方法2：确保 service_role 策略正确（推荐）
-- 删除所有旧策略
drop policy if exists palm_prints_service_all on public.palm_prints;
drop policy if exists palm_prints_user_insert on public.palm_prints;
drop policy if exists palm_prints_user_select on public.palm_prints;
drop policy if exists palm_prints_user_update on public.palm_prints;
drop policy if exists palm_prints_user_delete on public.palm_prints;

-- 重新创建：service_role 优先（所有权限）
create policy palm_prints_service_all
on public.palm_prints
for all
to service_role
using (true)
with check (true);

-- 用户策略
create policy palm_prints_user_insert
on public.palm_prints
for insert
to authenticated
with check (auth.uid() = user_id);

create policy palm_prints_user_select
on public.palm_prints
for select
to authenticated
using (auth.uid() = user_id);

create policy palm_prints_user_update
on public.palm_prints
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy palm_prints_user_delete
on public.palm_prints
for delete
to authenticated
using (auth.uid() = user_id);

-- 同样修复 palm_upload_logs
drop policy if exists palm_upload_logs_service_all on public.palm_upload_logs;
drop policy if exists palm_upload_logs_user_insert on public.palm_upload_logs;

create policy palm_upload_logs_service_all
on public.palm_upload_logs
for all
to service_role
using (true)
with check (true);

create policy palm_upload_logs_user_insert
on public.palm_upload_logs
for insert
to authenticated
with check (auth.uid() = user_id);


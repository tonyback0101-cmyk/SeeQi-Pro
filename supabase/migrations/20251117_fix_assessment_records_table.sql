-- 修复 assessment_records 表结构，统一列名

-- 如果表使用 module_type，添加 module 列（作为别名或重命名）
-- 如果表使用 data，添加 payload 列（作为别名或重命名）

-- 方案1：如果表已有 module_type，添加 module 列（向后兼容）
alter table public.assessment_records
  add column if not exists module text;

-- 如果表已有 data，添加 payload 列（向后兼容）
alter table public.assessment_records
  add column if not exists payload jsonb;

-- 创建触发器，同步 module_type <-> module
create or replace function sync_assessment_module()
returns trigger
language plpgsql
as $$
begin
  -- 如果 module 有值但 module_type 为空，同步
  if new.module is not null and (new.module_type is null or new.module_type = '') then
    new.module_type := new.module;
  end if;
  -- 如果 module_type 有值但 module 为空，同步
  if new.module_type is not null and (new.module is null or new.module = '') then
    new.module := new.module_type;
  end if;
  -- 如果 payload 有值但 data 为空，同步
  if new.payload is not null and (new.data is null or new.data = '{}'::jsonb) then
    new.data := new.payload;
  end if;
  -- 如果 data 有值但 payload 为空，同步
  if new.data is not null and (new.data != '{}'::jsonb) and (new.payload is null or new.payload = '{}'::jsonb) then
    new.payload := new.data;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_assessment_module on public.assessment_records;
create trigger trg_sync_assessment_module
before insert or update on public.assessment_records
for each row
execute procedure sync_assessment_module();

-- 更新现有数据
update public.assessment_records
set module = module_type
where module is null and module_type is not null;

update public.assessment_records
set module_type = module
where module_type is null and module is not null;

update public.assessment_records
set payload = data
where (payload is null or payload = '{}'::jsonb) and data is not null and data != '{}'::jsonb;

update public.assessment_records
set data = payload
where (data is null or data = '{}'::jsonb) and payload is not null and payload != '{}'::jsonb;

-- 验证
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'assessment_records'
order by ordinal_position;


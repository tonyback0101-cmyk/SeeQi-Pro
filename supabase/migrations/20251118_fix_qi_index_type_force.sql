-- ============================================
-- 强制修复 qi_index 字段类型：从 integer 改为 jsonb
-- ============================================

-- 先删除可能存在的索引
drop index if exists public.reports_qi_index_idx;

-- 如果列不存在，创建它
alter table public.reports
  add column if not exists qi_index jsonb;

-- 强制转换类型（如果当前是 integer/numeric）
do $$
begin
  -- 检查当前类型
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reports'
      and column_name = 'qi_index'
      and data_type in ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision')
  ) then
    -- 转换现有数据
    update public.reports
    set qi_index = jsonb_build_object('total', qi_index::numeric)
    where qi_index is not null
      and jsonb_typeof(qi_index::jsonb) is null;
    
    -- 改变列类型
    alter table public.reports
      alter column qi_index type jsonb using 
        case 
          when qi_index is null then null
          when jsonb_typeof(qi_index::text::jsonb) = 'object' then qi_index::text::jsonb
          else jsonb_build_object('total', qi_index::numeric)
        end;
    
    raise notice 'qi_index 已从数值类型转换为 jsonb';
  else
    raise notice 'qi_index 已经是 jsonb 类型或不存在';
  end if;
exception when others then
  -- 如果转换失败，尝试直接改变类型
  begin
    alter table public.reports
      alter column qi_index type jsonb using 
        case 
          when qi_index is null then null
          else qi_index::text::jsonb
        end;
    raise notice 'qi_index 已强制转换为 jsonb';
  exception when others then
    raise notice 'qi_index 转换失败: %', sqlerrm;
  end;
end $$;

-- 确保列存在且为 jsonb
alter table public.reports
  alter column qi_index type jsonb;

-- 创建 GIN 索引
create index if not exists reports_qi_index_idx 
  on public.reports using gin (qi_index) 
  where qi_index is not null;


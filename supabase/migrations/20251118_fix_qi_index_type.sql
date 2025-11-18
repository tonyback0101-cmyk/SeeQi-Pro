-- ============================================
-- 修复 qi_index 字段类型：从 integer 改为 jsonb
-- ============================================

-- 检查当前 qi_index 列的类型
do $$
declare
  current_type text;
begin
  select data_type into current_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'reports'
    and column_name = 'qi_index';
  
  if current_type is null then
    raise notice 'qi_index 列不存在，将创建为 jsonb 类型';
    alter table public.reports
      add column qi_index jsonb;
  elsif current_type != 'jsonb' then
    raise notice 'qi_index 当前类型为 %，将转换为 jsonb', current_type;
    
    -- 如果当前是 integer 或 numeric，先转换为 jsonb
    if current_type in ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision') then
      -- 将数值转换为 JSON 对象
      alter table public.reports
        alter column qi_index type jsonb using 
          case 
            when qi_index is not null then 
              jsonb_build_object('total', qi_index::numeric)
            else null
          end;
    else
      -- 其他类型，尝试直接转换
      alter table public.reports
        alter column qi_index type jsonb using qi_index::text::jsonb;
    end if;
    
    raise notice 'qi_index 已成功转换为 jsonb 类型';
  else
    raise notice 'qi_index 已经是 jsonb 类型，无需修改';
  end if;
end $$;

-- 确保 qi_index 列存在且为 jsonb 类型
alter table public.reports
  alter column qi_index type jsonb using 
    case 
      when qi_index is null then null
      when jsonb_typeof(qi_index) = 'object' then qi_index
      else jsonb_build_object('total', qi_index::numeric)
    end;

-- 创建 GIN 索引（如果不存在）
create index if not exists reports_qi_index_idx 
  on public.reports using gin (qi_index) 
  where qi_index is not null;


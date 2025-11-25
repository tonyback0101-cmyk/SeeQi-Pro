-- 为 report_v2 表添加 user_id 和 raw_data 列
-- 如果表已存在但缺少这些字段，执行此脚本

-- 添加 user_id 列（如果不存在）
ALTER TABLE report_v2 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 添加 raw_data 列（如果不存在）
ALTER TABLE report_v2 
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- 添加注释
COMMENT ON COLUMN report_v2.user_id IS '用户 ID（可选，用于关联用户）';
COMMENT ON COLUMN report_v2.raw_data IS '原始分析数据';


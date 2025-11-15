-- ============================================
-- 创建 rules 存储桶
-- ============================================
-- 用途：为规则引擎创建存储桶
-- 执行方式：在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================

-- 注意：存储桶创建通常需要在 Dashboard 中手动操作
-- 此 SQL 仅作为参考，如果直接执行失败，请在 Dashboard 中手动创建

INSERT INTO storage.buckets (id, name, public)
VALUES ('rules', 'rules', false)
ON CONFLICT (id) DO NOTHING;

-- 配置存储桶策略：Service Role 完全访问
DROP POLICY IF EXISTS "Service Role Full Access Rules" ON storage.objects;

CREATE POLICY "Service Role Full Access Rules"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'rules')
WITH CHECK (bucket_id = 'rules');

-- 验证：检查存储桶是否存在
-- SELECT id, name, public, created_at
-- FROM storage.buckets
-- WHERE id = 'rules';


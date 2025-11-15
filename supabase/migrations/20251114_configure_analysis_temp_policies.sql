-- ============================================
-- 配置 analysis-temp 存储桶策略
-- ============================================
-- 用途：为分析临时存储桶配置访问策略
-- 执行方式：在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================

-- 配置策略：Service Role 完全访问（用于服务器端上传）
DROP POLICY IF EXISTS "Service Role Full Access Analysis Temp" ON storage.objects;

CREATE POLICY "Service Role Full Access Analysis Temp"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'analysis-temp')
WITH CHECK (bucket_id = 'analysis-temp');

-- 验证：检查策略是否创建
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND policyname LIKE '%Analysis Temp%';


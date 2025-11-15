-- ============================================
-- Supabase 规则引擎 Storage 配置 SQL 脚本
-- ============================================
-- 用途：配置规则文件的存储和访问策略
-- 执行方式：在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================

-- 1. 创建 Storage Bucket（如果不存在）
-- 注意：Bucket 创建需要在 Dashboard 中手动操作，这里只提供策略配置

-- 2. 配置 Bucket 策略：允许 Service Role 完全访问
-- 这是规则上传/下载所必需的权限

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Rules" ON storage.objects;

-- 创建策略：Service Role 完全访问
CREATE POLICY "Service Role Full Access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'rules')
WITH CHECK (bucket_id = 'rules');

-- 创建策略：认证用户只读访问（可选，通常不需要）
-- 如果需要前端也能读取规则，取消下面的注释
/*
CREATE POLICY "Authenticated Read Rules"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'rules');
*/

-- 3. 验证策略
-- 执行后，在 Supabase Dashboard 的 Storage → Policies 中应该能看到上述策略

-- ============================================
-- 验证查询（可选）
-- ============================================

-- 查看 rules bucket 的所有策略
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%rules%' OR policyname LIKE '%Rules%';

-- 查看 rules bucket 中的文件（需要 Service Role 权限）
-- SELECT name, created_at, updated_at, metadata
-- FROM storage.objects
-- WHERE bucket_id = 'rules';



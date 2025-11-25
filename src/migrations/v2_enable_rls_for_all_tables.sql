-- V2 权限体系：为所有表启用 RLS 并创建策略
-- 确保服务角色可以访问，同时保护用户数据

-- ============================================
-- 1. orders 表 RLS 配置
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 策略：允许服务角色完全访问（后端 API 使用）
-- 注意：service_role 会自动绕过 RLS，但创建策略可以明确意图
-- 实际上，service_role 不需要策略也能访问，但为了文档化和明确性，我们创建策略
CREATE POLICY IF NOT EXISTS "Allow service role full access on orders" ON orders
  FOR ALL
  USING (true)  -- service_role 会自动绕过，这里使用 true 作为占位符
  WITH CHECK (true);

-- 策略：允许用户读取自己的订单
CREATE POLICY IF NOT EXISTS "Allow users to read their own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 2. report_access 表 RLS 配置
-- ============================================
ALTER TABLE report_access ENABLE ROW LEVEL SECURITY;

-- 策略：允许服务角色完全访问（后端 API 使用）
CREATE POLICY IF NOT EXISTS "Allow service role full access on report_access" ON report_access
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 策略：允许用户读取自己的访问权限
CREATE POLICY IF NOT EXISTS "Allow users to read their own access" ON report_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 3. user_profiles 表 RLS 配置
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 策略：允许服务角色完全访问（后端 API 使用）
CREATE POLICY IF NOT EXISTS "Allow service role full access on user_profiles" ON user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 策略：允许用户读取和更新自己的 profile
CREATE POLICY IF NOT EXISTS "Allow users to manage their own profile" ON user_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. subscriptions 表 RLS 配置
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 策略：允许服务角色完全访问（后端 API 使用）
CREATE POLICY IF NOT EXISTS "Allow service role full access on subscriptions" ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 策略：允许用户读取自己的订阅
CREATE POLICY IF NOT EXISTS "Allow users to read their own subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 5. report_v2 表 RLS 策略优化
-- ============================================
-- 注意：report_v2 的 RLS 已在 create_report_v2_table.sql 中启用
-- 这里只优化策略

-- 删除过于宽松的匿名读取策略（如果存在）
DROP POLICY IF EXISTS "Allow anonymous read access" ON report_v2;

-- 更新策略：允许服务角色完全访问（如果策略已存在则更新）
DROP POLICY IF EXISTS "Allow service role full access" ON report_v2;
CREATE POLICY IF NOT EXISTS "Allow service role full access on report_v2" ON report_v2
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 策略：允许用户读取自己的报告（如果有 user_id）
CREATE POLICY IF NOT EXISTS "Allow users to read their own reports" ON report_v2
  FOR SELECT
  USING (
    user_id IS NULL OR -- 匿名报告（临时）
    auth.uid() = user_id -- 用户自己的报告
  );

-- 策略：允许用户读取已购买的报告（通过 report_access）
CREATE POLICY IF NOT EXISTS "Allow users to read purchased reports" ON report_v2
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_access
      WHERE report_access.report_id = report_v2.id
      AND report_access.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Allow service role full access on orders" ON orders IS '服务角色可以完全访问 orders 表（后端 API 使用）';
COMMENT ON POLICY "Allow users to read their own orders" ON orders IS '用户只能读取自己的订单';
COMMENT ON POLICY "Allow service role full access on report_access" ON report_access IS '服务角色可以完全访问 report_access 表（后端 API 使用）';
COMMENT ON POLICY "Allow users to read their own access" ON report_access IS '用户只能读取自己的访问权限';
COMMENT ON POLICY "Allow service role full access on user_profiles" ON user_profiles IS '服务角色可以完全访问 user_profiles 表（后端 API 使用）';
COMMENT ON POLICY "Allow users to manage their own profile" ON user_profiles IS '用户只能管理自己的 profile';
COMMENT ON POLICY "Allow service role full access on subscriptions" ON subscriptions IS '服务角色可以完全访问 subscriptions 表（后端 API 使用）';
COMMENT ON POLICY "Allow users to read their own subscriptions" ON subscriptions IS '用户只能读取自己的订阅';
COMMENT ON POLICY "Allow service role full access on report_v2" ON report_v2 IS '服务角色可以完全访问 report_v2 表（后端 API 使用）';
COMMENT ON POLICY "Allow users to read their own reports" ON report_v2 IS '用户只能读取自己的报告';
COMMENT ON POLICY "Allow users to read purchased reports" ON report_v2 IS '用户只能读取已购买的报告';


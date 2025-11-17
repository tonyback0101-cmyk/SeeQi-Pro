/**
 * 测试账号相关工具函数
 */

/**
 * 检查用户 ID 是否是测试账号
 */
export function isTestAccount(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return userId.startsWith("test-");
}

/**
 * 检查用户 ID 是否是有效的 UUID（用于数据库外键约束）
 */
export function isValidUUID(userId: string | null | undefined): boolean {
  if (!userId) return false;
  // UUID v4 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * 检查用户 ID 是否可以用于数据库操作（不是测试账号且是有效的 UUID）
 */
export function canUseInDatabase(userId: string | null | undefined): boolean {
  if (!userId) return false;
  // 如果是测试账号，不能用于需要外键约束的数据库操作
  if (isTestAccount(userId)) return false;
  // 必须是有效的 UUID
  return isValidUUID(userId);
}


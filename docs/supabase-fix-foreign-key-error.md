# 修复外键约束错误

## 错误信息

```
错误: 对于被引用的表"配置文件", 没有唯一匹配给定键的约束
```

这个错误表示：尝试创建一个外键约束时，被引用的表（`profiles` 或 `user_profiles`）中目标列不是唯一的（不是主键或唯一索引）。

---

## 问题分析

根据你的代码库，实际使用的是 `user_profiles` 表，而不是 `profiles` 表。`user_profiles` 表的结构如下：

```sql
CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 其他字段...
);
```

**主键**: `user_id`（引用 `auth.users.id`）

---

## 解决方案

### 方案 1：确保引用主键（推荐）

如果 `notes` 表（或其他表）需要引用用户资料，应该引用 `user_profiles.user_id`（主键）：

```sql
-- 正确的做法
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  -- 其他字段...
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 方案 2：如果表名是 `profiles` 而不是 `user_profiles`

如果你在 Supabase 中有一个名为 `profiles` 的表，需要确保它有一个主键：

```sql
-- 检查 profiles 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 如果 profiles 表没有主键，添加主键
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- 或者如果使用 user_id 作为主键
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
```

### 方案 3：如果需要引用 `auth.users.id` 而不是 `user_profiles`

如果 `notes.user_id` 应该直接引用 `auth.users.id`：

```sql
-- 直接引用 auth.users
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 其他字段...
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 检查步骤

### 1. 确认表是否存在

```sql
-- 检查 user_profiles 表
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'profiles', 'notes');
```

### 2. 检查主键约束

```sql
-- 检查 user_profiles 表的主键
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'user_profiles';
```

### 3. 检查外键约束

```sql
-- 检查所有外键约束
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
```

---

## 常见错误场景

### 场景 1：引用了非唯一列

```sql
-- ❌ 错误：user_profiles.ref_code 不是唯一的（虽然可能是 UNIQUE，但需要确认）
CREATE TABLE notes (
  user_id uuid REFERENCES user_profiles(ref_code)  -- 错误！
);

-- ✅ 正确：引用主键
CREATE TABLE notes (
  user_id uuid REFERENCES user_profiles(user_id)  -- 正确！
);
```

### 场景 2：表名不匹配

```sql
-- ❌ 错误：表名是 user_profiles，不是 profiles
CREATE TABLE notes (
  user_id uuid REFERENCES profiles(user_id)  -- 错误！
);

-- ✅ 正确：使用正确的表名
CREATE TABLE notes (
  user_id uuid REFERENCES user_profiles(user_id)  -- 正确！
);
```

### 场景 3：列不存在

```sql
-- ❌ 错误：user_profiles 表中没有 auth_user_id 列
CREATE TABLE notes (
  user_id uuid REFERENCES user_profiles(auth_user_id)  -- 错误！
);

-- ✅ 正确：使用存在的列（主键）
CREATE TABLE notes (
  user_id uuid REFERENCES user_profiles(user_id)  -- 正确！
);
```

---

## 修复脚本

如果你需要创建 `notes` 表并正确引用 `user_profiles`：

```sql
-- 创建 notes 表（示例）
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at DESC);
```

---

## 验证

执行以下 SQL 验证修复是否成功：

```sql
-- 1. 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notes';

-- 2. 检查外键约束
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'notes';
```

---

## 总结

**关键点**：
1. 外键必须引用主键或唯一索引列
2. 确认表名正确（`user_profiles` 而不是 `profiles`）
3. 确认列名正确（`user_id` 是主键）
4. 如果引用 `auth.users`，确保 `auth.users.id` 存在

**推荐做法**：
- 始终引用主键列
- 使用 `ON DELETE CASCADE` 或 `ON DELETE SET NULL` 处理级联删除
- 为外键列创建索引以提高查询性能


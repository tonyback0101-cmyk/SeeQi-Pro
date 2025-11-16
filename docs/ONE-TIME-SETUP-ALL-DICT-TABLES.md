# 一次性设置所有字典表 - 完整指南

## 🚀 一步到位解决方案

**只需执行一个 SQL 文件，即可创建所有字典表并插入所有数据！**

## 操作步骤

### 1. 打开 Supabase SQL Editor

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 **"SQL Editor"**

### 2. 执行 SQL 文件

1. 打开文件：`supabase/migrations/20251115_all_dict_tables_complete.sql`
2. **复制全部内容**
3. 在 Supabase SQL Editor 中**粘贴**
4. 点击 **"Run"** 或按 `Ctrl+Enter`

### 3. 验证结果

执行后，在 Supabase Table Editor 中检查以下表：

- ✅ `dict_palm_mounts` - 12 行数据
- ✅ `dict_tongue_features` - 12 行数据
- ✅ `dict_face_features` - 11 行数据
- ✅ `dict_five_elements` - 5 行数据

## 包含的表和数据

### 1. dict_palm_mounts (掌丘字典)
- **12 行数据**
- 包含：金星丘、木星丘、土星丘、太阳丘、水星丘、月丘的各种状态

### 2. dict_tongue_features (舌象字典)
- **12 行数据**
- 包含：舌色、舌苔、舌形等各种舌象特征

### 3. dict_face_features (面相字典)
- **11 行数据**
- 包含：眉型、眼型、鼻型、唇型、脸型等特征

### 4. dict_five_elements (五行配对字典)
- **5 行数据**
- 包含：木、火、土、金、水五行的完整信息

## 文件位置

**SQL 文件**：`supabase/migrations/20251115_all_dict_tables_complete.sql`

## 注意事项

1. ✅ **可以重复执行** - 使用 `ON CONFLICT DO NOTHING`，不会重复插入
2. ✅ **自动创建表** - 如果表不存在会自动创建
3. ✅ **自动创建索引** - 会自动创建必要的索引
4. ✅ **包含中英文** - 所有数据都包含中英文字段

## 如果执行失败

如果遇到错误，请检查：

1. **权限问题** - 确保有创建表的权限
2. **表已存在** - 如果表已存在但结构不同，可能需要先删除
3. **字符编码** - 确保 SQL Editor 使用 UTF-8 编码

## 验证 SQL

执行以下 SQL 验证数据：

```sql
-- 检查所有表的数据行数
SELECT 
  'dict_palm_mounts' as table_name, COUNT(*) as row_count FROM dict_palm_mounts
UNION ALL
SELECT 'dict_tongue_features', COUNT(*) FROM dict_tongue_features
UNION ALL
SELECT 'dict_face_features', COUNT(*) FROM dict_face_features
UNION ALL
SELECT 'dict_five_elements', COUNT(*) FROM dict_five_elements;
```

应该返回：
- dict_palm_mounts: 12
- dict_tongue_features: 12
- dict_face_features: 11
- dict_five_elements: 5

## 完成！

执行完成后，所有字典表都已设置好，可以直接使用了！🎉






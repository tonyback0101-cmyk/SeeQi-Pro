# 字典表设置指南

## 概述

已为以下字典表创建了数据库迁移文件和 CSV 导入文件：

1. `dict_palm_mounts` - 掌丘字典
2. `dict_tongue_features` - 舌象字典
3. `dict_face_features` - 面相字典
4. `dict_five_elements` - 五行配对字典

## 设置步骤

### 步骤 1：运行数据库迁移

在 Supabase SQL Editor 中执行以下迁移文件：

1. **创建掌丘表**：
   - 文件：`supabase/migrations/20251115_dict_palm_mounts.sql`
   - 或直接执行：
   ```sql
   create table if not exists public.dict_palm_mounts (
     code text primary key,
     name_zh text not null,
     name_en text not null,
     meaning_zh text not null,
     meaning_en text,
     health_risk_zh text,
     health_risk_en text,
     advice_zh text,
     advice_en text,
     created_at timestamptz not null default timezone('utc'::text, now())
   );
   ```

2. **创建其他字典表**：
   - 文件：`supabase/migrations/20251115_dict_tongue_face_five_elements.sql`
   - 包含：`dict_tongue_features`, `dict_face_features`, `dict_five_elements`

### 步骤 2：导入 CSV 文件

在 Supabase Table Editor 中导入以下 CSV 文件：

1. **dict_palm_mounts.csv**
   - 表：`dict_palm_mounts`
   - 列：`code`, `name_zh`, `name_en`, `meaning_zh`, `meaning_en`, `health_risk_zh`, `health_risk_en`, `advice_zh`, `advice_en`
   - 数据：12 行

2. **dict_tongue_features.csv**
   - 表：`dict_tongue_features`
   - 列：`code`, `name_zh`, `name_en`, `meaning_zh`, `meaning_en`, `health_risk_zh`, `health_risk_en`, `advice_zh`, `advice_en`
   - 数据：12 行

3. **dict_face_features.csv**
   - 表：`dict_face_features`
   - 列：`code`, `name_zh`, `name_en`, `meaning_zh`, `meaning_en`, `health_risk_zh`, `health_risk_en`, `advice_zh`, `advice_en`
   - 数据：11 行

4. **dict_five_elements.csv**
   - 表：`dict_five_elements`
   - 列：`element`, `organ_zh`, `organ_en`, `emotion_zh`, `emotion_en`, `personality_zh`, `personality_en`, `food_zh`, `food_en`, `action_zh`, `action_en`, `acupoint_zh`, `acupoint_en`
   - 数据：5 行

## 文件位置

所有文件都在：`C:\Users\cherr\Desktop\`

### 迁移文件：
- `supabase/migrations/20251115_dict_palm_mounts.sql`
- `supabase/migrations/20251115_dict_tongue_face_five_elements.sql`

### CSV 文件：
- `dict_palm_mounts.csv`
- `dict_tongue_features.csv`
- `dict_face_features.csv`
- `dict_five_elements.csv`

## 表结构说明

### dict_palm_mounts
- `code` (text, primary key) - 掌丘编码，如 `venus_rich`, `jupiter_flat`
- `name_zh` (text) - 中文名称，如 "金星丘发达"
- `name_en` (text) - 英文名称，如 "Venus Mount Rich"
- `meaning_zh` (text) - 中文含义
- `meaning_en` (text) - 英文含义
- `health_risk_zh` (text) - 中文健康风险
- `health_risk_en` (text) - 英文健康风险
- `advice_zh` (text) - 中文建议
- `advice_en` (text) - 英文建议

### dict_tongue_features
- 结构同 `dict_palm_mounts`
- `code` 如：`pale`, `red`, `deep_red`, `purple` 等

### dict_face_features
- 结构同 `dict_palm_mounts`
- `code` 如：`sword_brow`, `eight_brow`, `large_eye` 等

### dict_five_elements
- `element` (text, primary key) - 五行：木、火、土、金、水
- `organ_zh`, `organ_en` - 对应器官
- `emotion_zh`, `emotion_en` - 对应情绪
- `personality_zh`, `personality_en` - 性格特征
- `food_zh`, `food_en` - 推荐食物
- `action_zh`, `action_en` - 推荐动作
- `acupoint_zh`, `acupoint_en` - 推荐穴位

## 导入注意事项

1. **先运行迁移**：确保表已创建
2. **检查列名**：CSV 文件的列名必须与表结构完全匹配
3. **编码问题**：如果预览显示乱码，可以尝试：
   - 使用"粘贴文本"功能
   - 或直接使用 SQL INSERT 语句

## 如果导入失败

如果 CSV 导入仍然显示"数据不兼容"，可以：

1. **使用 SQL 直接插入**（最可靠）
2. **检查表结构**：确认表已正确创建
3. **验证列名**：确保 CSV 列名与表结构匹配
4. **检查数据格式**：确保没有特殊字符或格式问题

## 验证导入

导入后，在 Supabase Table Editor 中检查：

1. 打开对应的表
2. 确认行数正确
3. 检查 `code` 列的值是否正确（英文编码）
4. 检查中英文字段是否都有数据






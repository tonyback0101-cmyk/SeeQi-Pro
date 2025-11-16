# dict_palm_mounts 导入问题修复

## 问题诊断

Supabase 显示：
- 表名错误：显示为 "dict_palmprint (掌纹)" 而不是 "dict_palm_mounts"
- 列名错误：显示为 "安装"、"法典"、"意义" 而不是正确的列名
- 数据不兼容

## 原因

1. **表尚未创建** - `dict_palm_mounts` 表可能还没有在数据库中创建
2. **列名识别错误** - Supabase 可能错误解析了 CSV 文件的列名

## 解决方案

### 方案 1：先创建表，再导入（推荐）

#### 步骤 1：创建表

在 Supabase SQL Editor 中执行：

```sql
-- Create dict_palm_mounts table
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

create index if not exists dict_palm_mounts_created_idx on public.dict_palm_mounts (created_at desc);
```

#### 步骤 2：导入 CSV

1. 在 Supabase Table Editor 中，选择 `dict_palm_mounts` 表
2. 点击 "Import data from CSV"
3. 上传 `dict_palm_mounts.csv` 或 `dict_palm_mounts_simple.csv`
4. 检查预览中的列名是否匹配：
   - ✅ 应该显示：`code`, `name_zh`, `name_en`, `meaning_zh`, `meaning_en`, `health_risk_zh`, `health_risk_en`, `advice_zh`, `advice_en`
   - ❌ 如果显示 "安装"、"法典" 等，说明列名识别有问题
5. 如果列名正确，点击 "导入数据"

### 方案 2：使用 SQL 直接插入（最可靠）

如果 CSV 导入仍然有问题，直接使用 SQL：

1. 在 Supabase SQL Editor 中执行 `supabase/migrations/20251115_dict_palm_mounts_insert.sql`
2. 或者复制以下 SQL：

```sql
INSERT INTO public.dict_palm_mounts (code, name_zh, name_en, meaning_zh, meaning_en, health_risk_zh, health_risk_en, advice_zh, advice_en) VALUES
('venus_rich', '金星丘发达', 'Venus Mount Rich', '热情、活力、高能量，有领导力。', 'Passionate, energetic, high energy, leadership qualities.', '心火旺、口腔溃疡、失眠。', 'Strong heart fire, oral ulcers, insomnia.', '多喝水、早睡、避免辛辣，多做拉伸。', 'Drink more water, sleep early, avoid spicy food, do more stretching.'),
('venus_flat', '金星丘扁平', 'Venus Mount Flat', '能量弱，性格内敛。', 'Weak energy, introverted personality.', '免疫力弱、畏寒。', 'Weak immunity, aversion to cold.', '加强运动、补气血，如红枣枸杞。', 'Strengthen exercise, replenish qi and blood, such as red dates and goji berries.'),
('jupiter_rich', '木星丘发达', 'Jupiter Mount Rich', '自信、目标感强，有组织力。', 'Confident, strong sense of purpose, organizational skills.', '压力性头痛、颈椎紧。', 'Stress headaches, tight cervical spine.', '深呼吸、颈部拉伸，减少久坐。', 'Deep breathing, neck stretching, reduce prolonged sitting.'),
('jupiter_flat', '木星丘平', 'Jupiter Mount Flat', '缺乏安全感、自我怀疑。', 'Lack of security, self-doubt.', '胃气弱、食欲差。', 'Weak stomach qi, poor appetite.', '规律三餐、喝温水、少生冷。', 'Regular three meals, drink warm water, less raw and cold food.'),
('saturn_high', '土星丘高', 'Saturn Mount High', '思考深，理性强。', 'Deep thinking, strong rationality.', '易抑郁、焦虑体质。', 'Prone to depression, anxious constitution.', '适合冥想、散步、阳光照射。', 'Suitable for meditation, walking, sun exposure.'),
('saturn_low', '土星丘低', 'Saturn Mount Low', '体验型性格、易分心。', 'Experiential personality, easily distracted.', '代谢慢、体虚。', 'Slow metabolism, physical weakness.', '快走 20 分钟，提高心率。', 'Fast walk for 20 minutes to increase heart rate.'),
('apollo_rich', '太阳丘发达', 'Apollo Mount Rich', '艺术天赋、魅力强、爱表达。', 'Artistic talent, strong charm, loves expression.', '心火旺、压力大导致失眠。', 'Strong heart fire, stress-induced insomnia.', '早睡、避免咖啡因、听轻音乐。', 'Sleep early, avoid caffeine, listen to light music.'),
('apollo_weak', '太阳丘弱', 'Apollo Mount Weak', '缺乏存在感，不敢表达。', 'Lack of presence, afraid to express.', '肺弱、气短。', 'Weak lungs, shortness of breath.', '加强呼吸训练与心肺运动。', 'Strengthen breathing training and cardiopulmonary exercise.'),
('mercury_rich', '水星丘发达', 'Mercury Mount Rich', '聪明、沟通能力强。', 'Intelligent, strong communication skills.', '神经紧绷、肩颈痛。', 'Tense nerves, shoulder and neck pain.', '注意休息，少熬夜，做肩颈操。', 'Pay attention to rest, less staying up late, do shoulder and neck exercises.'),
('mercury_flat', '水星丘扁平', 'Mercury Mount Flat', '沟通弱、反应较慢。', 'Weak communication, slow reaction.', '代谢慢。', 'Slow metabolism.', '多喝热水，轻运动开启代谢。', 'Drink more hot water, light exercise to activate metabolism.'),
('moon_rich', '月丘发达', 'Moon Mount Rich', '想象力强，灵感丰富。', 'Strong imagination, rich inspiration.', '情绪波动大、睡眠差。', 'Large emotional fluctuations, poor sleep.', '保持规律作息，睡前写日记。', 'Maintain regular routine, write diary before sleep.'),
('moon_low', '月丘低', 'Moon Mount Low', '现实主义，不爱幻想。', 'Realistic, doesn''t like fantasy.', '气血弱、手脚冰凉。', 'Weak qi and blood, cold hands and feet.', '温补食物，如姜枣茶。', 'Warming tonifying foods, such as ginger and jujube tea.')
ON CONFLICT (code) DO NOTHING;
```

### 方案 3：使用简化 CSV

如果完整版本有问题，尝试使用 `dict_palm_mounts_simple.csv`（只包含必需列）。

## 验证导入

导入后，在 Supabase Table Editor 中检查：

1. 打开 `dict_palm_mounts` 表
2. 确认有 12 行数据
3. 检查 `code` 列的值是英文（venus_rich, jupiter_flat 等）
4. 检查 `name_zh` 列有中文值
5. 检查 `name_en` 列有英文值

## 文件位置

- `supabase/migrations/20251115_dict_palm_mounts.sql` - 创建表的 SQL
- `supabase/migrations/20251115_dict_palm_mounts_insert.sql` - 插入数据的 SQL
- `dict_palm_mounts.csv` - 完整版本 CSV
- `dict_palm_mounts_simple.csv` - 简化版本 CSV（只包含必需列）

## 推荐操作顺序

1. ✅ **先执行 SQL 创建表**（方案 1 步骤 1）
2. ✅ **然后使用 SQL 插入数据**（方案 2）- 这是最可靠的方法
3. 如果 SQL 插入成功，CSV 导入可以跳过






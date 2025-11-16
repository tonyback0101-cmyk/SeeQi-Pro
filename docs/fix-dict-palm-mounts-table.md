# 修复 dict_palm_mounts 表导入问题

## 问题诊断

Supabase 显示：
- ❌ 表名错误：显示为 `dict_palmprint (掌纹)` 而不是 `dict_palm_mounts`
- ❌ 数据不兼容
- ⚠️ 列名识别可能有问题

## 原因

1. **表尚未创建** - `dict_palm_mounts` 表可能还没有在数据库中创建
2. **Supabase 自动识别错误** - 当表不存在时，Supabase 可能尝试自动创建表但识别错误

## 解决方案

### 步骤 1：确认表是否存在

在 Supabase SQL Editor 中执行：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'dict_palm%';
```

### 步骤 2：创建正确的表

如果表不存在，在 Supabase SQL Editor 中执行：

```sql
-- 创建 dict_palm_mounts 表
CREATE TABLE IF NOT EXISTS public.dict_palm_mounts (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  meaning_zh TEXT NOT NULL,
  meaning_en TEXT,
  health_risk_zh TEXT,
  health_risk_en TEXT,
  advice_zh TEXT,
  advice_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 创建索引
CREATE INDEX IF NOT EXISTS dict_palm_mounts_created_idx 
ON public.dict_palm_mounts (created_at DESC);
```

### 步骤 3：使用 SQL 直接插入数据（推荐）

**这是最可靠的方法，可以避免 CSV 导入的所有问题。**

在 Supabase SQL Editor 中执行：

```sql
-- 插入数据到 dict_palm_mounts
INSERT INTO public.dict_palm_mounts 
(code, name_zh, name_en, meaning_zh, meaning_en, health_risk_zh, health_risk_en, advice_zh, advice_en) 
VALUES
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

### 步骤 4：验证数据

执行后，在 Supabase Table Editor 中检查：

```sql
-- 验证数据
SELECT COUNT(*) FROM public.dict_palm_mounts;
-- 应该返回 12

-- 查看数据
SELECT * FROM public.dict_palm_mounts LIMIT 5;
```

## 如果仍然使用 CSV 导入

如果一定要使用 CSV 导入：

1. **先确保表已创建**（执行步骤 2）
2. **在 Supabase Table Editor 中**：
   - 选择 `dict_palm_mounts` 表（不是 `dict_palmprint`）
   - 点击 "Import data from CSV"
   - 上传 `dict_palm_mounts.csv`
   - 检查预览中的列名是否匹配
   - 如果列名正确，点击 "导入数据"

## 文件位置

- SQL 文件：`supabase/migrations/20251115_dict_palm_mounts.sql` - 创建表
- SQL 文件：`supabase/migrations/20251115_dict_palm_mounts_insert.sql` - 插入数据
- CSV 文件：`dict_palm_mounts.csv` - CSV 格式（备用）

## 推荐操作

**强烈推荐使用 SQL 直接插入（步骤 3）**，因为：
- ✅ 避免 CSV 编码问题
- ✅ 避免列名识别错误
- ✅ 避免表名识别错误
- ✅ 最可靠、最快速






# Supabase CSV 导入问题排查

## 当前问题

Supabase 预览显示第一列（"法典"）的值为中文音译（"启旭"、"杨旭"等），而不是英文 code（"qixu"、"yangxu"等）。

## 可能的原因

1. **Supabase 的 CSV 解析器问题** - 可能错误识别了列名或编码
2. **文件编码问题** - 虽然文件是 UTF-8，但可能被错误解析
3. **列名识别问题** - Supabase 可能将第一列识别为"法典"而不是"code"

## 解决方案

### 方案 1：直接导入（推荐）

**即使预览显示有问题，只要列名匹配，数据应该能正确导入。**

1. 检查预览中的列名：
   - 应该显示：`code`, `name_zh`, `name_en`, `desc_zh`, `desc_en`
   - 如果列名正确，可以直接点击"导入数据"

2. 导入后验证：
   - 在 Supabase Table Editor 中查看 `dict_constitution` 表
   - 确认 `code` 列的值是英文（pinghe, qixu, yangxu 等）

### 方案 2：使用"粘贴文本"功能

如果 CSV 导入有问题，可以尝试使用 Supabase 的"粘贴文本"功能：

1. 在 Supabase 导入界面，点击"粘贴文本"标签
2. 复制以下内容并粘贴：

```
code,name_zh,name_en,desc_zh,desc_en
pinghe,平和质,Balanced Constitution,"气血调和、阴阳平衡，面色红润，精力充沛，睡眠好，适应力强。","Qi and blood harmonious, Yin and Yang balanced, rosy complexion, energetic, good sleep, strong adaptability."
qixu,气虚质,Qi Deficiency Constitution,"容易疲劳、气短懒言、声音低弱，自汗、容易感冒，活动后乏力加重。","Easily fatigued, short of breath, reluctant to speak, weak voice, spontaneous sweating, prone to colds, fatigue worsens after activity."
yangxu,阳虚质,Yang Deficiency Constitution,"手脚发凉，怕冷，喜热饮，精神偏萎靡，大便溏薄，小便清长。","Cold hands and feet, afraid of cold, prefer hot drinks, low spirit, loose stools, clear and long urination."
yinxu,阴虚质,Yin Deficiency Constitution,"手足心热、口干咽燥、易烦躁、失眠多梦，大便偏干，舌红少津。","Hot palms and soles, dry mouth and throat, easily irritable, insomnia and dreams, dry stools, red tongue with little fluid."
tanshi,痰湿质,Phlegm Dampness Constitution,"体型偏胖或浮肿，四肢困重，头身困倦，胸闷痰多，容易困倦想睡。","Body type tends to be obese or edematous, heavy limbs, head and body fatigue, chest tightness with phlegm, easily drowsy."
shire,湿热质,Damp Heat Constitution,"面部或鼻翼易出油、长痘，口苦口黏，大便黏滞不爽，小便色黄，易烦躁。","Face or nose easily oily, prone to acne, bitter and sticky taste in mouth, sticky stools, yellow urine, easily irritable."
xueyu,血瘀质,Blood Stasis Constitution,"肤色晦暗，唇色偏紫，容易出现瘀斑、痛经或刺痛固定不移，易健忘。","Dull complexion, purplish lips, prone to bruises, dysmenorrhea or fixed stabbing pain, poor memory."
qiyu,气郁质,Qi Stagnation Constitution,"情绪多忧郁、易叹气、胸胁胀满，咽部有异物感，睡眠易受情绪影响。","Often melancholic, prone to sighing, chest and hypochondriac distension, foreign body sensation in throat, sleep easily affected by emotions."
tebing,特禀质,Special Constitution,"对花粉、食物或环境易过敏，易打喷嚏、皮疹、气喘，或先天体质偏弱。","Prone to allergies to pollen, food or environment, prone to sneezing, rashes, asthma, or congenital weak constitution."
```

3. 检查预览，确认列名和数据正确
4. 点击"导入数据"

### 方案 3：使用 SQL 直接插入

如果 CSV 导入仍然有问题，可以使用 SQL 直接插入数据：

```sql
INSERT INTO public.dict_constitution (code, name_zh, name_en, desc_zh, desc_en) VALUES
('pinghe', '平和质', 'Balanced Constitution', '气血调和、阴阳平衡，面色红润，精力充沛，睡眠好，适应力强。', 'Qi and blood harmonious, Yin and Yang balanced, rosy complexion, energetic, good sleep, strong adaptability.'),
('qixu', '气虚质', 'Qi Deficiency Constitution', '容易疲劳、气短懒言、声音低弱，自汗、容易感冒，活动后乏力加重。', 'Easily fatigued, short of breath, reluctant to speak, weak voice, spontaneous sweating, prone to colds, fatigue worsens after activity.'),
('yangxu', '阳虚质', 'Yang Deficiency Constitution', '手脚发凉，怕冷，喜热饮，精神偏萎靡，大便溏薄，小便清长。', 'Cold hands and feet, afraid of cold, prefer hot drinks, low spirit, loose stools, clear and long urination.'),
('yinxu', '阴虚质', 'Yin Deficiency Constitution', '手足心热、口干咽燥、易烦躁、失眠多梦，大便偏干，舌红少津。', 'Hot palms and soles, dry mouth and throat, easily irritable, insomnia and dreams, dry stools, red tongue with little fluid.'),
('tanshi', '痰湿质', 'Phlegm Dampness Constitution', '体型偏胖或浮肿，四肢困重，头身困倦，胸闷痰多，容易困倦想睡。', 'Body type tends to be obese or edematous, heavy limbs, head and body fatigue, chest tightness with phlegm, easily drowsy.'),
('shire', '湿热质', 'Damp Heat Constitution', '面部或鼻翼易出油、长痘，口苦口黏，大便黏滞不爽，小便色黄，易烦躁。', 'Face or nose easily oily, prone to acne, bitter and sticky taste in mouth, sticky stools, yellow urine, easily irritable.'),
('xueyu', '血瘀质', 'Blood Stasis Constitution', '肤色晦暗，唇色偏紫，容易出现瘀斑、痛经或刺痛固定不移，易健忘。', 'Dull complexion, purplish lips, prone to bruises, dysmenorrhea or fixed stabbing pain, poor memory.'),
('qiyu', '气郁质', 'Qi Stagnation Constitution', '情绪多忧郁、易叹气、胸胁胀满，咽部有异物感，睡眠易受情绪影响。', 'Often melancholic, prone to sighing, chest and hypochondriac distension, foreign body sensation in throat, sleep easily affected by emotions.'),
('tebing', '特禀质', 'Special Constitution', '对花粉、食物或环境易过敏，易打喷嚏、皮疹、气喘，或先天体质偏弱。', 'Prone to allergies to pollen, food or environment, prone to sneezing, rashes, asthma, or congenital weak constitution.');
```

在 Supabase SQL Editor 中执行上述 SQL。

## 文件位置

所有 CSV 文件都在：`C:\Users\cherr\Desktop\`

- `dict_constitution_import.csv` - **最新版本**（推荐使用）
- `dict_constitution_simple.csv` - 简化版本
- `dict_constitution_basic.csv` - 基础版本
- `dict_constitution_test.csv` - 测试版本（仅一行）

## 验证导入结果

导入后，在 Supabase Table Editor 中检查：

1. 打开 `dict_constitution` 表
2. 确认 `code` 列的值是英文：
   - ✅ 正确：`pinghe`, `qixu`, `yangxu`
   - ❌ 错误：`平河`, `启旭`, `杨旭`
3. 确认所有 9 行数据都已导入
4. 检查 `name_zh` 和 `name_en` 列是否正确

## 如果仍然有问题

1. 检查数据库表结构是否匹配
2. 确认是否运行了所有必要的迁移文件
3. 尝试使用 SQL 直接插入（方案 3）
4. 联系 Supabase 支持或检查 Supabase 的 CSV 导入文档






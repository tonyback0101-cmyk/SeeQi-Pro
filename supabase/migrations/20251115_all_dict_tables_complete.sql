-- ============================================
-- 一次性创建所有字典表并插入数据
-- 在 Supabase SQL Editor 中执行此文件即可
-- ============================================

-- 1. 创建 dict_palm_mounts 表
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

CREATE INDEX IF NOT EXISTS dict_palm_mounts_created_idx ON public.dict_palm_mounts (created_at DESC);

-- 插入 dict_palm_mounts 数据
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

-- 2. 创建 dict_tongue_features 表
CREATE TABLE IF NOT EXISTS public.dict_tongue_features (
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

CREATE INDEX IF NOT EXISTS dict_tongue_features_created_idx ON public.dict_tongue_features (created_at DESC);

-- 插入 dict_tongue_features 数据
INSERT INTO public.dict_tongue_features (code, name_zh, name_en, meaning_zh, meaning_en, health_risk_zh, health_risk_en, advice_zh, advice_en) VALUES
('pale', '舌淡白', 'Pale Tongue', '阳虚或血虚，体质偏弱。', 'Yang deficiency or blood deficiency, weak constitution.', '畏寒、乏力、手脚冰冷。', 'Aversion to cold, fatigue, cold hands and feet.', '多喝热水、姜枣茶，避免生冷。', 'Drink more hot water, ginger and jujube tea, avoid raw and cold food.'),
('red', '舌红', 'Red Tongue', '有内热或情绪压力大。', 'Internal heat or high emotional stress.', '口干、心烦、失眠。', 'Dry mouth, restlessness, insomnia.', '喝菊花茶、保持早睡。', 'Drink chrysanthemum tea, maintain early sleep.'),
('deep_red', '舌绛', 'Deep Red Tongue', '体内火旺或阴虚火旺。', 'Strong internal fire or yin deficiency with fire.', '口渴、盗汗、睡眠障碍。', 'Thirst, night sweats, sleep disorders.', '滋阴食物如百合、银耳。', 'Yin-nourishing foods such as lily, white fungus.'),
('purple', '舌紫', 'Purple Tongue', '气滞血瘀。', 'Qi stagnation and blood stasis.', '经常肩颈酸痛、偏头痛。', 'Frequent shoulder and neck pain, migraines.', '做肩颈操、热敷。', 'Do shoulder and neck exercises, apply heat.'),
('teeth_mark', '齿痕舌', 'Teeth Mark Tongue', '脾虚或水湿困。', 'Spleen deficiency or dampness retention.', '浮肿、乏力、胃胀。', 'Edema, fatigue, stomach bloating.', '薏米红豆水、饮食清淡。', 'Coix seed and red bean water, light diet.'),
('crack', '裂纹舌', 'Cracked Tongue', '阴虚或压力大。', 'Yin deficiency or high stress.', '口干、胃酸、便秘。', 'Dry mouth, stomach acid, constipation.', '百合银耳汤、规律睡眠。', 'Lily and white fungus soup, regular sleep.'),
('swollen', '胖大舌', 'Swollen Tongue', '湿气重或脾虚。', 'Heavy dampness or spleen deficiency.', '身体沉重、困倦。', 'Heavy body, drowsiness.', '多运动出汗，少油炸。', 'More exercise to sweat, less fried food.'),
('thin', '瘦薄舌', 'Thin Tongue', '气血不足。', 'Insufficient qi and blood.', '容易头晕、疲倦。', 'Prone to dizziness, fatigue.', '补血食物：黑芝麻、红枣。', 'Blood-nourishing foods: black sesame, red dates.'),
('tip_red', '舌尖红', 'Red Tongue Tip', '心火旺、情绪紧绷。', 'Strong heart fire, emotional tension.', '失眠、焦虑。', 'Insomnia, anxiety.', '深呼吸、冥想、减少咖啡因。', 'Deep breathing, meditation, reduce caffeine.'),
('yellow_mid', '舌中部黄苔', 'Yellow Coating Middle', '胃热重。', 'Heavy stomach heat.', '口苦、大便干。', 'Bitter taste, dry stools.', '喝绿豆汤、少油腻。', 'Drink mung bean soup, less greasy food.'),
('white_root', '舌根白苔', 'White Coating Root', '脾虚湿盛。', 'Spleen deficiency with dampness.', '腹胀、食欲差。', 'Abdominal distension, poor appetite.', '温补脾胃，喝山药粥。', 'Warm and tonify spleen and stomach, drink yam porridge.'),
('map', '地图舌', 'Map Tongue', '长期压力大或胃阴不足。', 'Long-term stress or stomach yin deficiency.', '胃口差、便秘。', 'Poor appetite, constipation.', '规律作息、清淡饮食。', 'Regular routine, light diet.')
ON CONFLICT (code) DO NOTHING;

-- 3. 创建 dict_face_features 表
CREATE TABLE IF NOT EXISTS public.dict_face_features (
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

CREATE INDEX IF NOT EXISTS dict_face_features_created_idx ON public.dict_face_features (created_at DESC);

-- 插入 dict_face_features 数据
INSERT INTO public.dict_face_features (code, name_zh, name_en, meaning_zh, meaning_en, health_risk_zh, health_risk_en, advice_zh, advice_en) VALUES
('sword_brow', '剑眉', 'Sword Brow', '果断坚毅、有领导力。', 'Decisive, resolute, leadership qualities.', '容易紧绷、血压偏高。', 'Prone to tension, high blood pressure.', '做放松训练、减少咸食。', 'Do relaxation training, reduce salty food.'),
('eight_brow', '八字眉', 'Eight Character Brow', '温柔随和、重情重义。', 'Gentle, easygoing, values relationships.', '易情绪化。', 'Prone to emotionalism.', '保持规律作息，适当冥想。', 'Maintain regular routine, appropriate meditation.'),
('thin_brow', '眉疏', 'Thin Brow', '理性但缺乏安全感。', 'Rational but lacks sense of security.', '内分泌波动。', 'Endocrine fluctuations.', '少熬夜、补充维 B。', 'Less staying up late, supplement vitamin B.'),
('large_eye', '眼大', 'Large Eye', '感性、同理心强。', 'Sensitive, strong empathy.', '睡眠不足、黑眼圈。', 'Insufficient sleep, dark circles.', '保持早睡、少泪目。', 'Maintain early sleep, less eye strain.'),
('mono_eye', '单眼皮', 'Monolid Eye', '冷静、理性、内向。', 'Calm, rational, introverted.', '偏头痛、压力。', 'Migraines, stress.', '适度运动释放压力。', 'Moderate exercise to release stress.'),
('eagle_nose', '鹰钩鼻', 'Eagle Nose', '自信强势、商业能力强。', 'Confident, strong, strong business skills.', '肝火旺、易怒。', 'Strong liver fire, easily angry.', '喝菊花、枸杞茶。', 'Drink chrysanthemum and goji berry tea.'),
('round_nose', '圆鼻', 'Round Nose', '善良有福气。', 'Kind, blessed.', '代谢慢、易胖。', 'Slow metabolism, prone to obesity.', '轻断食、快走。', 'Light fasting, fast walking.'),
('thin_lip', '薄唇', 'Thin Lip', '理性、表达少。', 'Rational, less expression.', '便秘、皮肤干燥。', 'Constipation, dry skin.', '多喝水、补充油脂。', 'Drink more water, supplement oils.'),
('thick_lip', '厚唇', 'Thick Lip', '热情、活力强。', 'Passionate, strong vitality.', '湿气重、痘痘。', 'Heavy dampness, acne.', '清淡饮食、减少甜食。', 'Light diet, reduce sweet food.'),
('square_face', '国字脸', 'Square Face', '稳重可靠。', 'Steady, reliable.', '肩颈僵硬。', 'Stiff shoulders and neck.', '热敷、按摩。', 'Heat compress, massage.'),
('oval_face', '瓜子脸', 'Oval Face', '温柔细致。', 'Gentle, meticulous.', '贫血、气虚。', 'Anemia, qi deficiency.', '补气血食材。', 'Qi and blood tonifying foods.')
ON CONFLICT (code) DO NOTHING;

-- 4. 创建 dict_five_elements 表
CREATE TABLE IF NOT EXISTS public.dict_five_elements (
  element TEXT PRIMARY KEY,
  organ_zh TEXT NOT NULL,
  organ_en TEXT NOT NULL,
  emotion_zh TEXT NOT NULL,
  emotion_en TEXT NOT NULL,
  personality_zh TEXT,
  personality_en TEXT,
  food_zh TEXT,
  food_en TEXT,
  action_zh TEXT,
  action_en TEXT,
  acupoint_zh TEXT,
  acupoint_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS dict_five_elements_created_idx ON public.dict_five_elements (created_at DESC);

-- 插入 dict_five_elements 数据
INSERT INTO public.dict_five_elements (element, organ_zh, organ_en, emotion_zh, emotion_en, personality_zh, personality_en, food_zh, food_en, action_zh, action_en, acupoint_zh, acupoint_en) VALUES
('木', '肝', 'Liver', '怒', 'Anger', '创造力强、进取心', 'Strong creativity, enterprising', '绿叶菜、枸杞、酸味', 'Green leafy vegetables, goji berries, sour taste', '拉伸、舒展', 'Stretching, extension', '太冲', 'Taichong'),
('火', '心', 'Heart', '喜', 'Joy', '外向、热情、有感染力', 'Outgoing, passionate, infectious', '苦味、莲子、百合', 'Bitter taste, lotus seeds, lily', '快走、心肺训练', 'Fast walking, cardiopulmonary training', '内关', 'Neiguan'),
('土', '脾', 'Spleen', '思', 'Thought', '务实、稳定', 'Practical, stable', '山药、薏米、南瓜', 'Yam, coix seed, pumpkin', '腹式呼吸、核心训练', 'Abdominal breathing, core training', '足三里', 'Zusanli'),
('金', '肺', 'Lung', '悲', 'Sadness', '果断、有原则', 'Decisive, principled', '梨、百合、辛味食材', 'Pear, lily, pungent ingredients', '深呼吸训练', 'Deep breathing training', '迎香', 'Yingxiang'),
('水', '肾', 'Kidney', '恐', 'Fear', '智慧、洞察力强', 'Wisdom, strong insight', '黑豆、黑芝麻、咸味', 'Black beans, black sesame, salty taste', '缓跑、温养运动', 'Slow running, warming exercise', '太溪', 'Taixi')
ON CONFLICT (element) DO NOTHING;

-- ============================================
-- 完成！所有字典表已创建并插入数据
-- ============================================






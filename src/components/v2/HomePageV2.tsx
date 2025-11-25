"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import { V2PageContainer, V2PageTitle, V2Text, V2Card } from "@/components/v2/layout";
import { getCalendarQiInfo } from "@/lib/analysis/calendarQi";
import { buildV2AnalyzePage } from "@/lib/v2/routes";
import "@/styles/v2-theme.css";

type Locale = "zh" | "en";

const TEXT = {
  zh: {
    hero: {
      title: "准！源自东方千年玄学洞察个人状态",
      subtitle: "综合掌纹、舌苔和梦境，为你生成一份今日健康与气运报告。",
      brandIntro: "舌为心之苗，手为气血镜，梦为神魂窗——\n千年中医智慧告诉我们：身体自有其语言。SeeQi 承古启今，以科技解读身体密语，让东方养生智慧在数字时代绽放新光。",
      cta: "开始今日洞察",
    },
    features: {
      palm: {
        title: "掌纹 · 今日生命节奏",
        description: "从生命线、感情线、智慧线和财富线，看你此刻的节奏与机会。",
      },
      tongue: {
        title: "舌苔 · 今日气机状态",
        description: "参考中医保健视角，从舌色与舌苔，看气机、精力与消化状态。（非医疗）",
      },
      dream: {
        title: "梦境 · 内心在说什么",
        description: "结合周公象意与心理象，解读你最近代表性梦境的提醒。",
      },
    },
    solarTerm: {
      label: "今日节气",
      hint: "适合",
    },
    preview: {
      title: "结果预览",
      score: "今日综合分",
      scoreValue: "88",
      scoreUnit: "分",
      items: {
        overall: "综合：稳中向好",
        emotion: "情绪：敏感但有温度",
        wealth: "财运：适合稳步推进",
      },
      disclaimer: "实际报告会根据你的掌纹、舌苔和梦境生成专属内容。",
    },
    bottomCta: "开始生成今日东方洞察",
  },
  en: {
    hero: {
      title: "Accurate! Personal State Insights from Millennia of Eastern Wisdom",
      subtitle: "Combining palmistry, tongue analysis, and dreams to generate your daily health and fortune report.",
      brandIntro: "Tongue mirrors the heart, palm reflects qi-blood, dreams reveal the soul—\nA millennium of TCM wisdom tells us: the body has its own language. SeeQi bridges ancient wisdom and modern tech, decoding the body's secrets, letting Eastern wellness wisdom shine anew in the digital age.",
      cta: "Start Today's Insight",
    },
    features: {
      palm: {
        title: "Palm · Today's Life Rhythm",
        description: "Read life, heart, head and wealth lines to see today's rhythm and opportunities.",
      },
      tongue: {
        title: "Tongue · Today's Qi State",
        description: "From tongue color and coating (TCM wellness view) see qi, energy and digestion. (Not medical advice)",
      },
      dream: {
        title: "Dream · Inner Voice",
        description: "Blend Zhou Gong symbolism with psychology to decode recent dreams' reminders.",
      },
    },
    solarTerm: {
      label: "Today's Solar Term",
      hint: "Suitable for",
    },
    preview: {
      title: "Result Preview",
      score: "Today's Overall Score",
      scoreValue: "88",
      scoreUnit: "pts",
      items: {
        overall: "Overall: Steady improvement",
        emotion: "Emotion: Sensitive but warm",
        wealth: "Wealth: Suitable for steady progress",
      },
      disclaimer: "Actual reports are generated based on your palm, tongue, and dreams.",
    },
    bottomCta: "Generate Today's Eastern Insight",
  },
} as const;

type HomePageV2Props = {
  locale: Locale;
};

export default function HomePageV2({ locale }: HomePageV2Props) {
  const t = TEXT[locale];

  // 获取今日节气信息
  const calendarInfo = getCalendarQiInfo();
  const solarTerm = calendarInfo.solarTerm;
  const yiList = calendarInfo.yi.slice(0, 3); // 取前3个"宜"

  return (
    <div className="min-h-screen bg-[#FAF9F3]">
      <V2PageContainer maxWidth="2xl" className="py-8 md:py-12 space-y-8 md:space-y-12 bg-[#FAF9F3]">
        {/* Hero 区块 - 带渐变背景 */}
        <motion.section
          variants={fadeUp(0.1)}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#4a148c] via-[#6a1b9a] to-[#ff6b35] pt-20 pb-24 px-8 md:px-16"
        >
          {/* 轻微暗纹理 */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.15)_0%,transparent_70%)]" />
            <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl opacity-20" />
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-2xl opacity-15" />
          </div>

          {/* 内容区域 - 居中对齐，充足留白 */}
          <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
            {/* 主标题（大号字） */}
            <div className="space-y-2">
              <V2PageTitle 
                level="page" 
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                style={{ 
                  textShadow: "0 2px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.3)",
                  letterSpacing: "0.02em"
                }}
              >
                {t.hero.title}
              </V2PageTitle>
            </div>
            
            {/* 副标题（中号字） */}
            <div className="space-y-2">
              <V2Text className="text-lg md:text-xl max-w-2xl mx-auto text-white/95 leading-relaxed">
                {t.hero.subtitle}
              </V2Text>
            </div>
            
            {/* 品牌宣言（小一号） */}
            <div className="space-y-2 pt-2">
              <V2Text className="text-sm md:text-base max-w-3xl mx-auto text-white/85 whitespace-pre-line leading-relaxed">
                {t.hero.brandIntro}
              </V2Text>
            </div>
            
            {/* 主 CTA 按钮（居中，深绿底白字） */}
            <div className="pt-8">
              <Link
                href={buildV2AnalyzePage(locale)}
                className="v2-button inline-block px-10 py-4 text-base md:text-lg font-semibold bg-[var(--v2-color-green-primary)] text-white hover:bg-[var(--v2-color-green-hover)] transition-colors shadow-lg rounded-xl"
              >
                {t.hero.cta}
              </Link>
            </div>
          </div>
        </motion.section>

        {/* 三能力区块 */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[ 
            { key: "palm", icon: "🖐", data: t.features.palm, delay: 0.2 },
            { key: "tongue", icon: "👅", data: t.features.tongue, delay: 0.3 },
            { key: "dream", icon: "🌙", data: t.features.dream, delay: 0.4 },
          ].map((feature) => (
            <motion.div key={feature.key} variants={fadeUp(feature.delay)}>
              <V2Card className="h-full flex flex-col border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--v2-color-bg-paper)] flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>
                  <V2PageTitle level="card" className="text-left">
                    {feature.data.title}
                  </V2PageTitle>
                </div>
                <V2Text className="mt-4 flex-1 text-left">
                  {feature.data.description}
                </V2Text>
                <div className="pt-4 text-right">
                  <Link
                    href={buildV2AnalyzePage(locale)}
                    className="inline-flex items-center text-sm font-medium text-[var(--v2-color-green-primary)] hover:text-[var(--v2-color-green-dark)] transition-colors"
                  >
                    {locale === "zh" ? "立即体验" : "Try now"} →
                  </Link>
                </div>
              </V2Card>
            </motion.div>
          ))}
        </motion.div>

        {/* 结果预览卡 */}
        <motion.div
          variants={fadeUp(0.5)}
          initial="hidden"
          animate="visible"
        >
          <V2Card className="border border-slate-100">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              {/* 左侧：圆形分数 */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  {/* 外层圆环 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-200 shadow-sm" />
                  {/* 内层圆形 */}
                  <div className="absolute inset-2 rounded-full bg-white border-2 border-amber-100" />
                  {/* 分数文字 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-[var(--v2-color-green-dark)] font-serif">
                      {t.preview.scoreValue}
                    </span>
                    <span className="text-xs md:text-sm text-[var(--v2-color-text-muted)] mt-1">
                      {t.preview.scoreUnit}
                    </span>
                  </div>
                </div>
                <p className="text-center mt-3 text-sm font-medium text-[var(--v2-color-text-primary)]">
                  {t.preview.score}
                </p>
              </div>

              {/* 右侧：简短条目 */}
              <div className="flex-1 space-y-3">
                <V2PageTitle level="section" className="text-xl mb-4">
                  {t.preview.title}
                </V2PageTitle>
                <div className="space-y-2">
                  <V2Text className="text-sm">{t.preview.items.overall}</V2Text>
                  <V2Text className="text-sm">{t.preview.items.emotion}</V2Text>
                  <V2Text className="text-sm">{t.preview.items.wealth}</V2Text>
                </div>
                {/* 下方说明文字 */}
                <V2Text variant="note" className="text-xs mt-4 pt-4 border-t border-slate-100">
                  {t.preview.disclaimer}
                </V2Text>
              </div>
            </div>
          </V2Card>
        </motion.div>

        {/* 节气提示（可选） */}
        {solarTerm && (
          <motion.div
            variants={fadeUp(0.5)}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <V2Card className="inline-block">
              <div className="space-y-2">
                <V2Text variant="note" className="text-xs uppercase tracking-wide">
                  {t.solarTerm.label}
                </V2Text>
                <V2PageTitle level="section" className="text-xl">
                  {solarTerm}
                </V2PageTitle>
                {yiList.length > 0 && (
                  <V2Text className="text-sm">
                    {t.solarTerm.hint} {yiList.join("、")}
                  </V2Text>
                )}
              </div>
            </V2Card>
          </motion.div>
        )}

        {/* 底部 CTA */}
        <motion.div
          variants={fadeUp(0.6)}
          initial="hidden"
          animate="visible"
          className="text-center pt-4"
        >
          <Link
            href={buildV2AnalyzePage(locale)}
            className="v2-button inline-block px-12 py-4 text-lg font-semibold"
          >
            {t.bottomCta} →
          </Link>
        </motion.div>
      </V2PageContainer>
    </div>
  );
}

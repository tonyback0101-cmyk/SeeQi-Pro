import React from "react";
import HomePageClient from "./page-client";

const SUPPORTED_LOCALES = ["zh", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

type PageProps = {
  params: Promise<{ locale: string }>;
};

const COPY = {
  zh: {
    nav: {
      brand: "SeeQi",
      home: "首页",
      analyze: "综合测试",
      pro: "专业版",
      about: "关于我们",
    },
    hero: {
      title: "SeeQi · 千年东方智慧助你洞察人生",
      subtitleLines: [
        "舌为心之苗，手为气血镜，梦为神魂窗。",
        "千年中医智慧告诉我们：身体自有其语言。",
        "SeeQi 承古启今，帮你解读身体密语，让东方养生智慧在数字时代绽放新光。",
      ],
      guide:
        "告诉我你的掌纹、舌苔、梦境等，让东方象意与国学智慧在你身上「开示」。",
      cta: "开始今日洞察",
    },
    demoQi: {
      title: "今日东方能量场 · Demo",
      scoreLabel: "综合气场",
      scoreValue: "88 分",
      tagsTitle: "今日节奏关键词",
      tags: ["稳中带进", "情绪敏感但可调", "适合整理与推进"],
      hint: "实际评分会根据你的掌纹、舌苔和梦境生成。",
    },
    sections: {
      coreEntryTitle: "核心入口",
      worldviewTitle: "东方世界观",
      },
    cards: [
      {
        id: "tongue",
        icon: "👅",
        title: "舌问全身",
        desc: "洞悉身体发出的每个微妙信号",
        action: "开始舌相测试",
      },
      {
        id: "palm",
        icon: "✋",
        title: "掌知未来",
        desc: "预见生命脉络\n解读财富密码",
        action: "开始掌纹测试",
      },
      {
        id: "dream",
        icon: "✨",
        title: "梦境解析：潜意识深处的秘密低语",
        desc: "梦境亦真亦幻，景象皆藏其间。它是一种提醒，更是一种来自心灵深处的无声暗示。",
        action: "开展梦境解读",
      },
      {
        id: "qi",
        icon: "☯️",
        title: "今日气运：今日运势，机遇与建议",
        desc: "身体有它自己的语言，气场有它自己的流向。东方智慧为你整理今日的运气、机会与忌讳，",
        action: "查看今日气运",
      },
    ],
    worldview: {
      body: [
        "身体有它自己的语言，气机有它自己的流向。",
        "SeeQi 用东方智慧为你整理今日的节奏、趋势与提醒，让你更看得懂自己。",
        "情绪的起伏，适合推进的事，适合保留的筹码，通通会在今日报告中给出温和建议。",
      ],
      bullets: [
        "对重要的人多一点真诚表达，少一点无声消耗。",
        "对重要的事多一层慎重决策，给自己留回旋余地。",
      ],
      summary: "把精力放在 1–2 个关键推进上，避免把自己拉得太散。",
      cta: "开始生成今日东方洞察 →",
    },
    footer: {
      privacyTitle: "隐私声明",
      privacyText:
        "我们尊重并保护每一位用户的个人数据，所有上传的图片与文字仅用于生成个人洞察，不会用于广告或任何对外分享。",
      disclaimerTitle: "使用与免责说明",
      disclaimerText:
        "本产品基于东方象意体系与身心养生观，适合作为自我观察与生活参考，不构成医疗诊断或治疗建议。如有不适，请及时就医或咨询专业医生。",
      copyright: "© 2025 SeeQi",
    },
  },

  // 英文文案先简单保留占位，方便以后再细修
  en: {
    nav: {
      brand: "SeeQi",
      home: "Home",
      analyze: "Full Scan",
      pro: "Pro",
      about: "About",
    },
    hero: {
      title: "SeeQi | Smart Wellness Assistant: ",
      titleHighlight: "Decode Body, Predict Future",
      subtitleLines: [
        "Combining millennia of Eastern wisdom with cutting-edge AI vision technology, your digital health guide.",
      ],
      guide:
        "Share your palm lines, tongue and recent dream; let Eastern symbolism light up today's path.",
      cta: "Get My Personalized Report →",
      smallText: "May AI unlock your unique life code!",
    },
    demoQi: {
      title: "Today's Qi Snapshot · Demo",
      scoreLabel: "Overall Field",
      scoreValue: "88 / 100",
      tagsTitle: "Key Themes",
      tags: ["Steady progress", "Emotional but adjustable", "Good for sorting & planning"],
      hint: "Real scores are generated from your palm, tongue and dream inputs.",
    },
    sections: {
      coreEntryTitle: "Core Entries",
      worldviewTitle: "Eastern Worldview",
    },
    cards: [
      {
        id: "palm",
        icon: "🖐",
        title: "Palm · Life Rhythm",
        desc: "Lines hint at life rhythm, palm color at vitality. We read each segment of momentum in your hand.",
        action: "Start Palm Insight",
      },
      {
        id: "tongue",
        icon: "👅",
        title: "Tongue · Today's Qi",
        desc: "Coating and color reflect inner flow. A quick glimpse at your tongue can hint at energy (not medical).",
        action: "Start Tongue Insight",
      },
      {
        id: "dream",
        icon: "🌙",
        title: "Dream · Inner Code",
        desc: "Dreams carry symbols from the deep mind. They remind, nudge and sometimes gently warn you.",
        action: "Start Dream Reading",
      },
      {
        id: "qi",
        icon: "✨",
        title: "Qi · Daily Field & Rhythm",
        desc: "Blend calendar stems/branches and solar terms to suggest whether to push, hold, or quietly prepare.",
        action: "View Today's Qi",
      },
    ],
    worldview: {
      body: [
        "Your body has its own language; your qi has its own current.",
        "SeeQi uses Eastern symbolism to sort today's rhythms, trends and soft reminders.",
        "We hint what to move, what to hold, and how to treat yourself with more kindness today.",
      ],
      bullets: [
        "Speak honestly with key people instead of overthinking alone.",
        "Make careful decisions on big matters and leave space to adjust.",
      ],
      summary:
        "Focus on one or two truly important moves instead of scattering your energy everywhere.",
      cta: "Generate Today's Eastern Insight →",
    },
    footer: {
      privacyTitle: "Privacy",
      privacyText:
        "Your uploads are used only to generate your personal insight. We do not sell or share them with advertisers.",
      disclaimerTitle: "Use & Disclaimer",
      disclaimerText:
        "SeeQi is based on Eastern symbolism and wellness ideas. It is for self-reflection only and not a substitute for medical or psychological diagnosis.",
      copyright: "© 2025 SeeQi",
    },
  },
} as const;

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: PageProps) {
  let locale: Locale = "zh";
  
  try {
    const { locale: localeParam } = await params;
    locale = SUPPORTED_LOCALES.includes(
      localeParam as Locale
    )
      ? (localeParam as Locale)
      : "zh";
  } catch (error) {
    console.error("[HomePage] Error parsing params:", error);
    locale = "zh";
  }

  const t = COPY[locale];

  return <HomePageClient locale={locale} copy={t} />;
}

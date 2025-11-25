"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { buildV2AnalyzePage } from "@/lib/v2/routes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useIsPWA } from "@/hooks/useIsPWA";

const SUPPORTED_LOCALES = ["zh", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

type HomePageClientProps = {
  locale: Locale;
  copy: typeof COPY[Locale];
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

function HomePageContent({ locale, copy }: HomePageClientProps) {
  const t = copy;
  const isPWA = useIsPWA();
  const router = useRouter();
  const pathname = usePathname();

  // 语言切换处理
  const handleLanguageToggle = () => {
    const nextLocale = locale === "zh" ? "en" : "zh";
    // 获取当前路径，替换 locale 部分
    const pathSegments = pathname?.split("/").filter(Boolean) ?? [];
    const hasLocale = pathSegments[0] === "zh" || pathSegments[0] === "en";
    const contentPath = hasLocale ? pathSegments.slice(1).join("/") : pathSegments.join("/");
    const targetPath = contentPath ? `/${nextLocale}/${contentPath}` : `/${nextLocale}`;
    router.push(targetPath);
  };

  // 确保组件渲染
  React.useEffect(() => {
    console.log("[HomePageContent] Component mounted", { locale, isPWA });
  }, [locale, isPWA]);

  return (
    <div 
      className="min-h-screen homepage-container" 
      style={{ 
        backgroundColor: '#1A202C', 
        color: '#E2E8F0',
        paddingTop: isPWA ? 'env(safe-area-inset-top)' : '0',
        paddingBottom: isPWA ? 'env(safe-area-inset-bottom)' : '0',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        display: 'block',
        visibility: 'visible',
        overflow: 'visible',
      }}
    >
      {/* 调试：确保内容可见 */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '10px', 
        zIndex: 9999,
        fontSize: '12px',
        display: 'block',
      }}>
        调试：页面已加载 - {locale} - isPWA: {String(isPWA)}
      </div>
      {/* Header - PWA 模式下简化 */}
      <header style={{ 
        padding: isPWA ? '12px 16px' : undefined,
        position: isPWA ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
        backgroundColor: '#1A202C',
        width: '100%',
        display: 'block',
        visibility: 'visible',
      }}>
        <div className="header-container container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          gap: isPWA ? '12px' : undefined,
        }}>
          <div className="logo" style={{ flexShrink: 0, zIndex: 101 }}>
              <Link
              href={`/${locale}`}
              style={{ 
                color: '#FF7B54', 
                textDecoration: 'none', 
                fontSize: isPWA ? '20px' : '28px', 
                fontWeight: 'bold', 
                whiteSpace: 'nowrap',
                display: 'block',
                visibility: 'visible',
              }}
              >
              {t.nav.brand}
              </Link>
          </div>
          {!isPWA && (
            <>
              <nav>
                <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
                  <li>
                    <Link
                      href={`/${locale}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {t.nav.home}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={buildV2AnalyzePage(locale)}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {t.nav.analyze}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/pro`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {t.nav.pro}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/about`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {t.nav.about}
                    </Link>
                  </li>
                </ul>
              </nav>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* 语言切换按钮 */}
                <button
                  onClick={handleLanguageToggle}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                >
                  {locale === "zh" ? "EN" : "中文"}
                </button>
                <div className="auth-buttons">
                  <button className="register-button">注册</button>
                  <button className="login-button">登录</button>
                </div>
              </div>
            </>
          )}
          {isPWA && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {/* PWA 模式下的语言切换按钮 */}
              <button
                onClick={handleLanguageToggle}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  minHeight: '44px',
                  minWidth: '50px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {locale === "zh" ? "EN" : "中文"}
              </button>
              <Link
                href={buildV2AnalyzePage(locale)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {t.hero.cta}
              </Link>
            </div>
          )}
            </div>
      </header>

      {/* Hero Section - PWA 模式下优化布局 */}
      <section id="hero-section" style={{
        padding: isPWA ? '32px 16px' : '100px 0',
        minHeight: isPWA ? 'auto' : '600px',
        position: 'relative',
        zIndex: 10,
        display: 'block',
        visibility: 'visible',
        backgroundColor: '#1A202C',
      }}>
        <div className="hero-content-wrapper container" style={{
          display: 'flex',
          flexDirection: isPWA ? 'column' : 'row',
          gap: isPWA ? '24px' : undefined,
          alignItems: isPWA ? 'center' : undefined,
          textAlign: isPWA ? 'center' : undefined,
          position: 'relative',
          zIndex: 11,
        }}>
          <div className="hero-text-content" style={{
            flex: isPWA ? 'none' : 1,
            maxWidth: isPWA ? '100%' : undefined,
            position: 'relative',
            zIndex: 12,
          }}>
            <h1 style={{
              fontSize: isPWA ? '24px' : '52px',
              marginBottom: isPWA ? '16px' : '25px',
              lineHeight: isPWA ? '1.4' : '1.2',
              wordBreak: 'keep-all', // 保持中文词语完整
              overflowWrap: 'break-word', // 允许在单词边界换行
              color: '#F8F8F8',
              fontWeight: 700,
              display: 'block',
              visibility: 'visible',
            }}>{t.hero.title}</h1>
            <p className="subtitle" style={{
              fontSize: isPWA ? '16px' : '18px',
              marginBottom: isPWA ? '24px' : '35px',
              lineHeight: isPWA ? '1.6' : '1.7',
              color: '#CBD5E0',
              display: 'block',
              visibility: 'visible',
            }}>
              {isPWA ? t.hero.subtitleLines[0] : t.hero.subtitleLines.join(' ')} {!isPWA && t.hero.guide}
            </p>
            {!isPWA && (
              <Link
                href={buildV2AnalyzePage(locale)}
                className="primary-button"
                style={{
                  minHeight: '48px', // 触摸目标
                  fontSize: '18px',
                  padding: '14px 28px',
                }}
              >
                {t.hero.cta} →
              </Link>
            )}
          </div>
          {!isPWA && (
            <div className="hero-visual-art">
              <div className="orb-container">
                <div className="orb"></div>
                <div className="lines"></div>
                <div className="glow"></div>
              </div>
            </div>
          )}
        </div>
        </section>

      {/* Services Section - 四张卡片 - PWA 模式下优化为单列 */}
      <section id="services-section" style={{
        padding: isPWA ? '24px 16px' : '80px 0',
        backgroundColor: '#1A202C',
        position: 'relative',
        zIndex: 10,
        display: 'block',
        visibility: 'visible',
      }}>
        <div className="container" style={{
          position: 'relative',
          zIndex: 11,
        }}>
          <div 
            id="services-grid-container" 
            className="services-grid-container"
            style={{
              display: isPWA ? 'flex' : 'grid',
              flexDirection: isPWA ? 'column' : undefined,
              gap: isPWA ? '16px' : undefined,
              gridTemplateColumns: isPWA ? 'none' : undefined,
            }}
          >
            {t.cards.map((card) => (
              <div 
                key={card.id} 
                className="service-card"
                style={{
                  padding: isPWA ? '20px' : '35px',
                  minHeight: isPWA ? '120px' : undefined,
                  display: isPWA ? 'flex' : 'flex',
                  flexDirection: isPWA ? 'row' : 'column',
                  alignItems: isPWA ? 'center' : 'flex-start',
                  gap: isPWA ? '16px' : undefined,
                  backgroundColor: '#F0F2F5',
                  color: '#2D3748',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                  zIndex: 12,
                  visibility: 'visible',
                }}
              >
                {/* 图标 */}
                <div className="icon-placeholder" style={{
                  fontSize: isPWA ? '40px' : undefined,
                  flexShrink: isPWA ? 0 : undefined,
                }}>
                  {card.id === 'qi' ? (
                    <svg width={isPWA ? "40" : "55"} height={isPWA ? "40" : "55"} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="50" fill="#000000"/>
                      <path d="M 50 0 A 50 50 0 0 1 50 100 A 25 25 0 0 0 50 50 A 25 25 0 0 1 50 0 Z" fill="#FFFFFF"/>
                      <circle cx="50" cy="25" r="12.5" fill="#000000"/>
                      <circle cx="50" cy="75" r="12.5" fill="#FFFFFF"/>
                      <circle cx="50" cy="25" r="4" fill="#FFFFFF"/>
                      <circle cx="50" cy="75" r="4" fill="#000000"/>
                    </svg>
                  ) : (
                    <span>{card.icon}</span>
                  )}
                </div>
                {/* 内容 */}
                <div style={{ flex: isPWA ? 1 : undefined, width: '100%' }}>
                  <h2 style={{
                    fontSize: isPWA ? '18px' : '24px',
                    marginBottom: isPWA ? '8px' : '12px',
                    color: '#2D3748',
                    fontWeight: 700,
                    display: 'block',
                    visibility: 'visible',
                  }}>{card.title}</h2>
                  <p style={{
                    fontSize: isPWA ? '14px' : '15px',
                    marginBottom: isPWA ? '12px' : '24px',
                    whiteSpace: 'pre-line', // 支持换行符
                    lineHeight: '1.6',
                    color: '#4A5568',
                    display: 'block',
                    visibility: 'visible',
                  }}>{card.desc}</p>
                  <Link
                    href={buildV2AnalyzePage(locale)}
                    className="secondary-button"
                    style={{
                      minHeight: isPWA ? '44px' : undefined,
                      fontSize: isPWA ? '16px' : '15px',
                      padding: isPWA ? '10px 20px' : '10px 22px',
                      display: isPWA ? 'inline-block' : 'inline-flex',
                      backgroundColor: 'transparent',
                      color: '#FF7B54',
                      border: '2px solid #FF7B54',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      alignItems: 'center',
                      gap: '8px',
                      visibility: 'visible',
                    }}
                  >
                    {card.action}
                  </Link>
                </div>
              </div>
            ))}
              </div>
            </div>
        </section>

        {/* Footer */}
      <footer style={{
        backgroundColor: '#2D3748',
        color: '#A0AEC0',
        textAlign: 'center',
        padding: '40px 20px',
        fontSize: '14px',
        lineHeight: '1.6',
        marginTop: '80px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        zIndex: 10,
        display: 'block',
        visibility: 'visible',
      }}>
        <div className="container" style={{
          position: 'relative',
          zIndex: 11,
        }}>
          <div className="footer-container">
            <p style={{ margin: '6px 0', color: '#A0AEC0' }}>{t.footer.copyright}</p>
            <p style={{ margin: '6px 0', color: '#A0AEC0' }}>
              <span className="font-semibold" style={{ fontWeight: 600 }}>{t.footer.privacyTitle}</span>：{t.footer.privacyText}
            </p>
            <p style={{ margin: '6px 0', color: '#A0AEC0' }}>
              <span className="font-semibold" style={{ fontWeight: 600 }}>{t.footer.disclaimerTitle}</span>：{t.footer.disclaimerText}
            </p>
          </div>
        </div>
        </footer>
    </div>
  );
}

export default function HomePageClient({ locale, copy }: HomePageClientProps) {
  return (
    <ErrorBoundary locale={locale}>
      <HomePageContent locale={locale} copy={copy} />
    </ErrorBoundary>
  );
}


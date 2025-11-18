"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import UserAuth from "./UserAuth";

const brandColor = "#8DAE92";
const translucentWhite = "rgba(255, 255, 255, 0.85)";

type MenuItem = {
  slug: string;
  labelZh: string;
  labelEn: string;
};

const menuItems: MenuItem[] = [
  { slug: "", labelZh: "首页", labelEn: "Home" },
  { slug: "assessment", labelZh: "综合测评", labelEn: "Assessment" },
  { slug: "pricing", labelZh: "专业版", labelEn: "Pricing" },
  { slug: "about", labelZh: "关于我们", labelEn: "About Us" },
];

type NavigationProps = {
  initialLanguage?: "zh" | "en";
};

const supportedLocales = new Set(["zh", "en"]);

function buildPath(locale: "zh" | "en", slug: string) {
  return `/${locale}${slug ? `/${slug}` : ""}`;
}

export default function Navigation({ initialLanguage = "zh" }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const pathInfo = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const localeFromPath = segments[0];
    const hasLocale = localeFromPath && supportedLocales.has(localeFromPath);
    const locale = (hasLocale ? localeFromPath : initialLanguage) as "zh" | "en";
    const contentSegments = hasLocale ? segments.slice(1) : segments;

    return {
      locale,
      contentSegments,
      currentSlug: contentSegments[0] ?? "",
      pathSuffix: contentSegments.length ? `/${contentSegments.join("/")}` : "",
    };
  }, [initialLanguage, pathname]);

  const [language, setLanguage] = useState<"zh" | "en">(pathInfo.locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setLanguage(pathInfo.locale);
  }, [pathInfo.locale]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLanguageToggle = () => {
    const nextLanguage = language === "zh" ? "en" : "zh";
    const targetPath = `/${nextLanguage}${pathInfo.pathSuffix}`;

    setLanguage(nextLanguage);
    closeMenu();
    router.push(targetPath);
  };

  return (
    <header style={headerStyle}>
      <nav
        style={{
          margin: "0 auto",
          maxWidth: "1200px",
          padding: "calc(env(safe-area-inset-top, 0) + 0.5rem) 1.5rem 0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link href={buildPath(language, "")} style={logoStyle} onClick={closeMenu}>
            SeeQi
          </Link>
          <ul className="seeqi-nav__desktopMenu">
            {menuItems.map((item) => {
              const href = buildPath(language, item.slug);
              const isActive = item.slug === pathInfo.currentSlug;

              return (
                <li key={item.slug || "home"}>
                  <Link
                    href={href}
                    onClick={closeMenu}
                    aria-current={isActive ? "page" : undefined}
                    className={`seeqi-nav__desktopLink${isActive ? " seeqi-nav__desktopLink--active" : ""}`}
                  >
                    {language === "zh" ? item.labelZh : item.labelEn}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ flex: 1 }} />

        <div style={rightClusterStyle} className="seeqi-nav__rightCluster">
          <button type="button" onClick={handleLanguageToggle} style={languageButtonStyle} className="seeqi-nav__language">
            {language === "zh" ? "中 / EN" : "EN / 中"}
          </button>

          <div className="seeqi-nav__authDesktop">
            <UserAuth locale={language} />
          </div>

          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            className="seeqi-nav__hamburger"
            style={hamburgerStyle}
          >
            <span style={{ ...hamburgerLineStyle, transform: isMenuOpen ? "translateY(6px) rotate(45deg)" : undefined }} />
            <span style={{ ...hamburgerLineStyle, opacity: isMenuOpen ? 0 : 1 }} />
            <span style={{ ...hamburgerLineStyle, transform: isMenuOpen ? "translateY(-6px) rotate(-45deg)" : undefined }} />
          </button>
        </div>
      </nav>

      <div
        className={`seeqi-nav__menu${isMenuOpen ? " seeqi-nav__menu--open" : ""}`}
        style={{
          display: isMenuOpen ? "block" : "none",
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: translucentWhite,
          padding: "0.5rem 1.5rem",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(12px)",
          zIndex: 999,
        }}
      >
        <div className="seeqi-nav__mobileMeta">
          <div className="seeqi-nav__mobileAuth">
            <UserAuth context="mobile-menu" locale={language} onAuthComplete={closeMenu} />
          </div>
          <button type="button" onClick={handleLanguageToggle} className="seeqi-nav__mobileLanguage">
            {language === "zh" ? "切换到英文" : "Switch to Chinese"}
          </button>
        </div>
        <ul style={mobileMenuListStyle}>
          {menuItems.map((item) => {
            const href = buildPath(language, item.slug);
            const isActive = item.slug === pathInfo.currentSlug;
            return (
              <li key={item.slug || "home"}>
                <Link
                  href={href}
                  onClick={closeMenu}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    color: isActive ? brandColor : "#333",
                    textDecoration: "none",
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {language === "zh" ? item.labelZh : item.labelEn}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <style jsx>{`
        .seeqi-nav__desktopMenu {
          display: none;
        }
        .seeqi-nav__mobileMeta {
          display: none;
        }
        @media (max-width: 768px) {
          :global(.seeqi-nav__hamburger) {
            display: inline-flex !important;
          }
          .seeqi-nav__authDesktop {
            display: none !important;
          }
          /* 移动端也显示语言切换按钮 */
          .seeqi-nav__language {
            display: inline-flex !important;
            font-size: 0.875rem;
            padding: 0.4rem 0.85rem;
            min-height: 40px;
          }
          .seeqi-nav__mobileMeta {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem 1.5rem;
            padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0));
            border-bottom: 1px solid rgba(141, 174, 146, 0.25);
          }
          .seeqi-nav__mobileAuth {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .seeqi-nav__mobileLanguage {
            border-radius: 999px;
            border: 1px solid rgba(141, 174, 146, 0.6);
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.86);
            color: #2c3e30;
            font-weight: 600;
          }
          .seeqi-nav__menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: ${translucentWhite};
            display: none;
            padding: 0.5rem 1.5rem;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(12px);
          }
          .seeqi-nav__menu--open {
            display: block;
          }
        }
        @media (min-width: 769px) {
          .seeqi-nav__desktopMenu {
            display: flex;
            align-items: center;
            gap: 1.75rem;
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .seeqi-nav__desktopLink {
            position: relative;
            color: #2c3e30;
            text-decoration: none;
            font-weight: 500;
            letter-spacing: 0.02em;
            transition: color 0.2s ease;
          }
          .seeqi-nav__desktopLink::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: -0.35rem;
            width: 100%;
            height: 2px;
            background: transparent;
            transition: background 0.2s ease;
          }
          .seeqi-nav__desktopLink:hover {
            color: ${brandColor};
          }
          .seeqi-nav__desktopLink:hover::after {
            background: rgba(141, 174, 146, 0.5);
          }
          .seeqi-nav__desktopLink--active {
            color: ${brandColor};
            font-weight: 600;
          }
          .seeqi-nav__desktopLink--active::after {
            background: ${brandColor};
          }
          .seeqi-nav__language,
          .seeqi-nav__authDesktop {
            display: inline-flex !important;
          }
        }
        @media (orientation: landscape) and (max-height: 600px) {
          .seeqi-nav__menu {
            max-height: calc(100vh - 60px);
            overflow-y: auto;
          }
        }
      `}</style>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: translucentWhite,
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  paddingTop: "env(safe-area-inset-top, 0)",
  paddingLeft: "env(safe-area-inset-left, 0)",
  paddingRight: "env(safe-area-inset-right, 0)",
};

const logoStyle: React.CSSProperties = {
  color: brandColor,
  fontSize: "1.25rem",
  fontWeight: 700,
  textDecoration: "none",
  letterSpacing: "0.08em",
};

const rightClusterStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const languageButtonStyle: React.CSSProperties = {
  border: `1px solid ${brandColor}`,
  borderRadius: "999px",
  padding: "0.35rem 1rem",
  backgroundColor: "#fff",
  color: brandColor,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 0.2s ease, color 0.2s ease",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const hamburgerStyle: React.CSSProperties = {
  display: "none",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "0.25rem",
  flexDirection: "column" as const,
  gap: "0.3rem",
  alignItems: "center",
  justifyContent: "center",
};

const hamburgerLineStyle: React.CSSProperties = {
  width: 22,
  height: 2,
  backgroundColor: "#2c3e30",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

const mobileMenuListStyle: React.CSSProperties = {
  listStyle: "none",
  margin: "1.25rem 0",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};







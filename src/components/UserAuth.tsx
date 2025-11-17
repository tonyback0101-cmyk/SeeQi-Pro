"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Loader2, UserRound } from "lucide-react";

type AuthStatus = "authenticated" | "guest";

type UserInfo = {
  name: string;
  avatarUrl?: string;
};

type BaseAuthProps = {
  status: AuthStatus;
  user?: UserInfo;
  locale: "zh" | "en";
  onSignIn: () => void;
  onProfile: () => void;
  onReports: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onAuthComplete?: () => void;
  isProcessingUpgrade?: boolean;
};

export type UserAuthProps = {
  locale?: "zh" | "en";
  context?: "desktop" | "mobile-menu";
  onAuthComplete?: () => void;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

const copy = {
  zh: {
    signIn: "登录 / 注册",
    profile: "个人中心",
    reports: "我的报告",
    upgrade: "解锁专业版",
    logout: "退出登录",
    manage: "管理账户",
    welcomeBack: "欢迎回来",
    guestTitle: "快速登录即可同步测评记录与报告",
    guestHint: "使用手机号或邮箱（支持 Google）登录，或继续以访客模式浏览",
    continueGuest: "继续浏览",
    upgradeProcessing: "正在连接 Stripe...",
  },
  en: {
    signIn: "Sign In / Register",
    profile: "Profile",
    reports: "My Reports",
    upgrade: "Unlock Pro",
    logout: "Sign Out",
    manage: "Manage Account",
    welcomeBack: "Welcome back",
    guestTitle: "Sign in to sync your wellness insights",
    guestHint: "Use mobile number or Google account to keep your reports in sync.",
    continueGuest: "Continue as guest",
    upgradeProcessing: "Connecting to Stripe...",
  },
} as const;

export default function UserAuth({
  locale = "zh",
  context = "desktop",
  onAuthComplete,
}: UserAuthProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<Feedback | null>(null);
  const hasSyncedAfterLogin = useRef(false);

  const authStatus: AuthStatus = sessionStatus === "authenticated" && session?.user ? "authenticated" : "guest";

  useEffect(() => {
    if (authStatus === "authenticated") {
      setAuthModalOpen(false);
    }
  }, [authStatus]);

  useEffect(() => {
    if (!checkoutFeedback) {
      return;
    }
    const timer = window.setTimeout(() => setCheckoutFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [checkoutFeedback]);

  const userInfo: UserInfo | undefined = useMemo(() => {
    if (!session?.user) {
      return undefined;
    }
    const nameFallback = session.user.email?.split("@")[0] ?? (session.user as any).phone ?? "SeeQi";
    return {
      name: session.user.name ?? nameFallback,
      avatarUrl: session.user.image ?? undefined,
    };
  }, [session?.user]);

  const handleSignIn = () => {
    setAuthModalOpen(true);
  };

  const runPostSignInTasks = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }
    if (hasSyncedAfterLogin.current) {
      return;
    }
    hasSyncedAfterLogin.current = true;

    try {
      await fetch("/api/affiliate/bind", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.warn("affiliate bind failed", error);
    }

    try {
      const { exportAssessmentSnapshot } = await import("@/state/assessmentStorage");
      const snapshot = exportAssessmentSnapshot();
      await fetch("/api/assessment/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(snapshot),
        credentials: "include",
      });
    } catch (error) {
      console.warn("assessment sync failed", error);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      void runPostSignInTasks();
    } else if (authStatus === "guest") {
      hasSyncedAfterLogin.current = false;
    }
  }, [authStatus, runPostSignInTasks]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}` });
    onAuthComplete?.();
    hasSyncedAfterLogin.current = false;
  };

  const handleProfile = () => {
    router.push(`/${locale}/assessment`);
    onAuthComplete?.();
  };

  const handleReports = () => {
    router.push(`/${locale}/analysis-result`);
    onAuthComplete?.();
  };

  const handleUpgrade = useCallback(() => {
    router.push(`/${locale}/pricing?plans=open`);
    onAuthComplete?.();
  }, [locale, onAuthComplete, router]);

  const baseProps: BaseAuthProps = {
    status: authStatus,
    user: userInfo,
    locale,
    onSignIn: handleSignIn,
    onProfile: handleProfile,
    onReports: handleReports,
    onUpgrade: handleUpgrade,
    onLogout: handleLogout,
    onAuthComplete,
    isProcessingUpgrade: false,
  };

  return (
    <>
      {context === "mobile-menu" ? <MobileAuth {...baseProps} /> : <DesktopAuth {...baseProps} />}
      <AuthModal
        open={authStatus === "guest" && authModalOpen}
        locale={locale}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          onAuthComplete?.();
          void runPostSignInTasks();
        }}
      />
      {checkoutFeedback && <FeedbackToast feedback={checkoutFeedback} />}
    </>
  );
}

function DesktopAuth({
  status,
  user,
  locale,
  onSignIn,
  onProfile,
  onReports,
  onUpgrade,
  onLogout,
  isProcessingUpgrade,
}: BaseAuthProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const t = copy[locale] ?? copy.zh;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "guest") {
    return (
      <button type="button" onClick={onSignIn} className="seeqi-auth__signin">
        <UserRound size={20} />
        <span>{t.signIn}</span>
        <style jsx>{`
          .seeqi-auth__signin {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            min-height: 44px;
            padding: 0.65rem 1.5rem;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(141, 174, 146, 0.5);
            border-radius: 999px;
            color: #2c3e30;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
            backdrop-filter: blur(8px);
          }
          .seeqi-auth__signin:hover {
            background: #8dae92;
            color: #fff;
            box-shadow: 0 12px 24px rgba(141, 174, 146, 0.28);
          }
          .seeqi-auth__signin:active {
            transform: translateY(1px);
          }
        `}</style>
      </button>
    );
  }

  const menuItems = [
    { key: "profile", label: t.profile, onClick: onProfile },
    { key: "reports", label: t.reports, onClick: onReports },
    { key: "upgrade", label: t.upgrade, onClick: onUpgrade, disabled: isProcessingUpgrade },
    { key: "logout", label: t.logout, onClick: onLogout },
  ] as const;

  return (
    <div ref={popoverRef} className="seeqi-auth">
      <button type="button" onClick={() => setMenuOpen((open) => !open)} className="seeqi-auth__avatarButton">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="seeqi-auth__avatarImage" />
        ) : (
          <div className="seeqi-auth__avatarIcon">
            <UserRound size={20} />
          </div>
        )}
      </button>

      <div className={`seeqi-auth__menu ${menuOpen ? "seeqi-auth__menu--open" : ""}`}>
        <div className="seeqi-auth__menuHeader">
          <span className="seeqi-auth__userName">{user?.name ?? "Guest"}</span>
        </div>
        <div className="seeqi-auth__divider" />
        <ul className="seeqi-auth__menuList">
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`seeqi-auth__menuItem ${item.key === "upgrade" ? "seeqi-auth__menuItem--upgrade" : ""}`}
                onClick={() => {
                  if ('disabled' in item && item.disabled) {
                    return;
                  }
                  item.onClick();
                  setMenuOpen(false);
                }}
                disabled={'disabled' in item ? Boolean(item.disabled) : false}
              >
                <span>{item.label}</span>
                {'disabled' in item && item.disabled && <Loader2 size={16} className="seeqi-auth__spinner" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .seeqi-auth {
          position: relative;
          display: inline-block;
        }
        .seeqi-auth__avatarButton {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }
        .seeqi-auth__avatarImage,
        .seeqi-auth__avatarIcon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .seeqi-auth__avatarImage {
          object-fit: cover;
        }
        .seeqi-auth__avatarIcon {
          background: linear-gradient(135deg, #8dae92, #c6a969);
          color: #fff;
        }
        .seeqi-auth__avatarButton:hover .seeqi-auth__avatarImage,
        .seeqi-auth__avatarButton:hover .seeqi-auth__avatarIcon {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
        }
        .seeqi-auth__menu {
          position: absolute;
          top: calc(100% + 0.75rem);
          right: 0;
          width: 240px;
          padding: 0.75rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          box-shadow: 0 24px 48px rgba(25, 34, 28, 0.18);
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease;
          z-index: 1000;
        }
        .seeqi-auth__menu--open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .seeqi-auth__menuHeader {
          padding: 0.6rem 0.75rem;
          border-radius: 14px;
          background: rgba(141, 174, 146, 0.18);
          margin-bottom: 0.65rem;
        }
        .seeqi-auth__userName {
          font-weight: 600;
          color: #2c3e30;
        }
        .seeqi-auth__divider {
          height: 1px;
          background: rgba(198, 169, 105, 0.35);
          margin-bottom: 0.6rem;
        }
        .seeqi-auth__menuList {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .seeqi-auth__menuItem {
          width: 100%;
          min-height: 44px;
          background: rgba(255, 255, 255, 0.55);
          border: none;
          border-radius: 14px;
          text-align: left;
          padding: 0.8rem 0.9rem;
          font-weight: 500;
          color: #2c3e30;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .seeqi-auth__menuItem:hover:not(:disabled) {
          background: rgba(141, 174, 146, 0.2);
          transform: translateX(2px);
        }
        .seeqi-auth__menuItem:disabled {
          opacity: 0.7;
          cursor: default;
        }
        .seeqi-auth__menuItem--upgrade {
          font-weight: 600;
          color: #c68c39;
          background: rgba(198, 169, 105, 0.18);
        }
        .seeqi-auth__menuItem--upgrade:hover:not(:disabled) {
          background: rgba(198, 169, 105, 0.28);
        }
        .seeqi-auth__spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 768px) {
          .seeqi-auth__menu {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function MobileAuth({
  status,
  user,
  locale,
  onSignIn,
  onProfile,
  onReports,
  onUpgrade,
  onLogout,
  onAuthComplete,
  isProcessingUpgrade,
}: BaseAuthProps) {
  const [panelVisible, setPanelVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const t = copy[locale] ?? copy.zh;

  const menuItems = [
    { key: "profile", label: t.profile, onClick: onProfile },
    { key: "reports", label: t.reports, onClick: onReports },
    { key: "upgrade", label: t.upgrade, onClick: onUpgrade, disabled: isProcessingUpgrade },
    { key: "logout", label: t.logout, onClick: onLogout },
  ] as const;

  useEffect(() => {
    if (!panelVisible) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [panelVisible]);

  const closePanel = () => {
    setPanelVisible(false);
    setDragOffset(0);
    dragStartRef.current = null;
    onAuthComplete?.();
  };

  const openPanel = () => {
    setPanelVisible(true);
  };

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closePanel();
    }
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    dragStartRef.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) {
      return;
    }
    const delta = event.touches[0].clientY - dragStartRef.current;
    if (delta > 0) {
      setDragOffset(Math.min(delta, 160));
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      closePanel();
    } else {
      setDragOffset(0);
    }
    dragStartRef.current = null;
  };

  return (
    <>
      {status === "guest" ? (
        <button type="button" className="seeqi-auth-mobile__trigger" onClick={openPanel}>
          <UserRound size={22} />
          <span>{t.signIn}</span>
        </button>
      ) : (
        <button type="button" className="seeqi-auth-mobile__summary" onClick={openPanel}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="seeqi-auth-mobile__avatar" />
          ) : (
            <div className="seeqi-auth-mobile__avatarFallback">
              <UserRound size={22} />
            </div>
          )}
          <div className="seeqi-auth-mobile__summaryText">
            <span className="seeqi-auth-mobile__name">{user?.name ?? "Guest"}</span>
            <span className="seeqi-auth-mobile__hint">{locale === "zh" ? "轻触管理账户" : "Tap to manage account"}</span>
          </div>
        </button>
      )}

      {panelVisible && (
        <div className="seeqi-auth-mobile__overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
          <div
            className="seeqi-auth-mobile__sheet"
            style={{ transform: `translateY(${dragOffset}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="seeqi-auth-mobile__handle" />
            <div className="seeqi-auth-mobile__sheetHeader">
              <div className="seeqi-auth-mobile__headerInfo">
                <span className="seeqi-auth-mobile__title">
                  {status === "guest" ? t.guestTitle : t.welcomeBack}
                </span>
                {status === "authenticated" && <span className="seeqi-auth-mobile__name">{user?.name}</span>}
                {status === "guest" && <span className="seeqi-auth-mobile__hint">{t.guestHint}</span>}
              </div>
              <button type="button" className="seeqi-auth-mobile__close" onClick={closePanel} aria-label="Close auth panel">
                ×
              </button>
            </div>

            {status === "guest" ? (
              <div className="seeqi-auth-mobile__guestActions">
                <button
                  type="button"
                  className="seeqi-auth-mobile__primary"
                  onClick={() => {
                    closePanel();
                    onSignIn();
                  }}
                >
                  {t.signIn}
                </button>
                <button type="button" className="seeqi-auth-mobile__ghost" onClick={closePanel}>
                  {t.continueGuest}
                </button>
              </div>
            ) : (
              <ul className="seeqi-auth-mobile__menu">
                {menuItems.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`seeqi-auth-mobile__menuItem ${
                        item.key === "upgrade" ? "seeqi-auth-mobile__menuItem--upgrade" : ""
                      }`}
                      onClick={() => {
                        if ('disabled' in item && item.disabled) {
                          return;
                        }
                        item.onClick();
                        closePanel();
                      }}
                      disabled={'disabled' in item ? Boolean(item.disabled) : false}
                    >
                      <span>{item.label}</span>
                      {'disabled' in item && item.disabled && <Loader2 size={18} className="seeqi-auth-mobile__spinner" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .seeqi-auth-mobile__trigger,
        .seeqi-auth-mobile__summary {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          min-height: 44px;
          padding: 0.65rem 1.25rem;
          border-radius: 999px;
          border: 1px solid rgba(141, 174, 146, 0.55);
          background: rgba(255, 255, 255, 0.85);
          color: #2c3e30;
          font-weight: 600;
          cursor: pointer;
        }
        .seeqi-auth-mobile__summaryText {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
        }
        .seeqi-auth-mobile__avatar,
        .seeqi-auth-mobile__avatarFallback {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        }
        .seeqi-auth-mobile__avatar {
          object-fit: cover;
        }
        .seeqi-auth-mobile__avatarFallback {
          background: linear-gradient(135deg, #8dae92, #c6a969);
          color: #fff;
        }
        .seeqi-auth-mobile__overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          z-index: 2000;
        }
        .seeqi-auth-mobile__sheet {
          background: rgba(255, 255, 255, 0.95);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          width: 100%;
          padding: 1.5rem 1.75rem;
          padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
          box-shadow: 0 -24px 48px rgba(0, 0, 0, 0.2);
          transform: translateY(0);
          transition: transform 0.2s ease;
        }
        .seeqi-auth-mobile__handle {
          width: 48px;
          height: 5px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.12);
          margin: 0 auto 1rem;
        }
        .seeqi-auth-mobile__sheetHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .seeqi-auth-mobile__headerInfo {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .seeqi-auth-mobile__title {
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e30;
        }
        .seeqi-auth-mobile__hint {
          font-size: 0.85rem;
          color: rgba(44, 62, 48, 0.75);
        }
        .seeqi-auth-mobile__close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.45);
        }
        .seeqi-auth-mobile__guestActions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.75rem;
        }
        .seeqi-auth-mobile__primary {
          border-radius: 14px;
          background: linear-gradient(135deg, #8dae92, #7a9d7f);
          color: #fff;
          border: none;
          padding: 0.9rem;
          font-weight: 600;
          font-size: 1rem;
        }
        .seeqi-auth-mobile__ghost {
          border-radius: 14px;
          border: 1px solid rgba(141, 174, 146, 0.55);
          padding: 0.9rem;
          font-weight: 600;
          font-size: 0.95rem;
          background: rgba(255, 255, 255, 0.8);
        }
        .seeqi-auth-mobile__menu {
          list-style: none;
          margin: 1.5rem 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .seeqi-auth-mobile__menuItem {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(141, 174, 146, 0.35);
          padding: 0.9rem 1rem;
          background: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .seeqi-auth-mobile__menuItem--upgrade {
          border-color: rgba(198, 169, 105, 0.55);
          color: #c68c39;
        }
        .seeqi-auth-mobile__spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

type AuthModalProps = {
  open: boolean;
  locale: "zh" | "en";
  onClose: () => void;
  onSuccess: () => void;
};

type AuthModalFeedback = Feedback | null;

const authModalCopy = {
  zh: {
    title: "登录 SeeQi",
    subtitle: "使用 Google 账号、手机号或邮箱验证码即可完成登录。",
    google: "使用 Google 登录",
    phoneTab: "手机号登录",
    emailTab: "邮箱登录",
    testTab: "测试账号",
    phoneLabel: "手机号（包含国际区号）",
    emailLabel: "邮箱地址",
    testUsernameLabel: "测试账号",
    testPasswordLabel: "测试密码",
    emailPlaceholder: "name@example.com",
    requestCode: "获取验证码",
    requestEmailCode: "发送验证码",
    resend: "重新发送",
    codeLabel: "验证码",
    verify: "验证并登录",
    otpSent: "验证码已发送，请注意查收。",
    success: "登录成功，欢迎回来。",
    invalidPhone: "请输入有效的手机号（需包含国家区号）。",
    invalidEmail: "请输入有效的邮箱地址。",
    invalidTestCredentials: "测试账号或密码不正确。",
    close: "关闭",
    testSignIn: "登录测试账号",
  },
  en: {
    title: "Sign in to SeeQi",
    subtitle: "Use your Google account, mobile number, or email code to access your insights.",
    google: "Continue with Google",
    phoneTab: "Phone",
    emailTab: "Email",
    testTab: "Test Account",
    phoneLabel: "Mobile number (with country code)",
    emailLabel: "Email address",
    testUsernameLabel: "Test username",
    testPasswordLabel: "Test password",
    emailPlaceholder: "name@example.com",
    requestCode: "Send code",
    requestEmailCode: "Send code",
    resend: "Resend",
    codeLabel: "Verification code",
    verify: "Verify and Continue",
    otpSent: "Verification code sent. Please check your inbox.",
    success: "Signed in successfully. Welcome back!",
    invalidPhone: "Please enter a valid phone number with country code.",
    invalidEmail: "Please enter a valid email address.",
    invalidTestCredentials: "Invalid test credentials.",
    close: "Close",
    testSignIn: "Sign in with test account",
  },
} as const;

function AuthModal({ open, locale, onClose, onSuccess }: AuthModalProps) {
  const t = authModalCopy[locale] ?? authModalCopy.zh;
  const [activeMethod, setActiveMethod] = useState<"phone" | "email" | "test">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [testUsername, setTestUsername] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<AuthModalFeedback>(null);

  const normalizePhoneInput = useCallback((value: string) => value.replace(/\s+/g, "").replace(/-/g, ""), []);
  const normalizeEmailInput = useCallback((value: string) => value.trim().toLowerCase(), []);
  const normalizeUsernameInput = useCallback((value: string) => value.trim().toLowerCase(), []);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (!open) {
      setActiveMethod("phone");
      setPhone("");
      setEmail("");
      setTestUsername("");
      setTestPassword("");
      setPhoneCode("");
      setEmailCode("");
      setPhoneOtpSent(false);
      setEmailOtpSent(false);
      setPhoneCountdown(0);
      setEmailCountdown(0);
      setLoading(false);
      setFeedback(null);
    }
  }, [open]);

  useEffect(() => {
    if (phoneCountdown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setPhoneCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phoneCountdown]);

  useEffect(() => {
    if (emailCountdown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setEmailCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [emailCountdown]);

  useEffect(() => {
    setFeedback(null);
    setLoading(false);
    if (activeMethod === "phone") {
      setEmailCode("");
      setTestUsername("");
      setTestPassword("");
    } else if (activeMethod === "email") {
      setPhoneCode("");
      setTestUsername("");
      setTestPassword("");
    } else {
      setPhoneCode("");
      setEmailCode("");
    }
  }, [activeMethod]);

  const handleGoogle = async () => {
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch (error) {
      console.error("[auth] Google sign-in failed", error);
      setFeedback({
        type: "error",
        message: locale === "zh" 
          ? "Google 登录暂不可用，请使用邮箱或手机号登录" 
          : "Google sign-in unavailable, please use email or phone",
      });
    }
  };

  const handleRequestOtp = async () => {
    if (activeMethod === "test") {
      return;
    }
    const normalizedIdentifier =
      activeMethod === "phone"
        ? normalizePhoneInput(identifier)
        : normalizeEmailInput(identifier);
    console.log(
      "[auth-modal] request OTP",
      JSON.stringify({ method: activeMethod, identifier, normalizedIdentifier })
    );
    setFeedback(null);
    const isPhone = activeMethod === "phone";

    if (isPhone) {
      const normalized = normalizePhoneInput(phone);
      if (!normalized) {
        setFeedback({ type: "error", message: t.invalidPhone });
        return;
      }
      setLoading(true);
      try {
        const response = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone: normalized, locale }),
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          setFeedback({ type: "error", message: (data?.error as string | undefined) ?? "验证码发送失败" });
          return;
        }
        setFeedback({ type: "success", message: t.otpSent });
        setPhoneOtpSent(true);
        setPhoneCountdown(60);
      } catch (error) {
        const message = error instanceof Error ? error.message : "验证码发送失败";
        setFeedback({ type: "error", message });
      } finally {
        setLoading(false);
      }
      return;
    }

    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      setFeedback({ type: "error", message: t.invalidEmail });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/email/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, locale }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: (data?.error as string | undefined) ?? "验证码发送失败" });
        return;
      }
      setFeedback({ type: "success", message: t.otpSent });
      setEmailOtpSent(true);
      setEmailCountdown(60);
    } catch (error) {
      const message = error instanceof Error ? error.message : "验证码发送失败";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (activeMethod === "test") {
      return;
    }
    setFeedback(null);
    const isPhone = activeMethod === "phone";

    const normalizedPhone = normalizePhoneInput(phone);
    const normalizedEmail = normalizeEmailInput(email);

    if (isPhone) {
      if (!normalizedPhone || !phoneCode.trim()) {
        setFeedback({ type: "error", message: t.invalidPhone });
        return;
      }
    } else {
      if (!normalizedEmail || !emailRegex.test(normalizedEmail) || !emailCode.trim()) {
        setFeedback({ type: "error", message: t.invalidEmail });
        return;
      }
    }

    setLoading(true);
    try {
      const provider = isPhone ? "phone-otp" : "email-otp";
      const result = await signIn(provider, {
        redirect: false,
        ...(isPhone ? { phone: normalizedPhone, code: phoneCode } : { email: normalizedEmail, code: emailCode }),
      });

      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }

      setFeedback({ type: "success", message: t.success });
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "验证失败";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    const normalizedUsername = normalizeUsernameInput(testUsername);
    console.log(
      "[auth-modal] test login submit",
      JSON.stringify({ username: testUsername, normalizedUsername, passwordLength: testPassword.length })
    );
    setFeedback(null);
    if (!normalizedUsername || !testPassword.trim()) {
      setFeedback({ type: "error", message: t.invalidTestCredentials });
      return;
    }
    setLoading(true);
    try {
      console.log(
        "[auth-modal] signIn test-account",
        JSON.stringify({ normalizedUsername, passwordLength: testPassword.length })
      );
      const result = await signIn("test-account", {
        redirect: false,
        username: normalizedUsername,
        password: testPassword,
      });
      console.log("[auth-modal] signIn result", JSON.stringify(result));

      if (result?.error) {
        setFeedback({ type: "error", message: t.invalidTestCredentials });
        return;
      }

      setFeedback({ type: "success", message: t.success });
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.invalidTestCredentials;
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  const isPhone = activeMethod === "phone";
  const isEmail = activeMethod === "email";
  const isTest = activeMethod === "test";
  const otpSent = isPhone ? phoneOtpSent : emailOtpSent;
  const countdown = isPhone ? phoneCountdown : emailCountdown;
  const identifier = isPhone ? phone : email;
  const codeValue = isPhone ? phoneCode : emailCode;
  const requestLabel = isPhone ? t.requestCode : t.requestEmailCode;

  return (
    <div className="seeqi-auth-modal__overlay" role="dialog" aria-modal="true" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="seeqi-auth-modal__panel">
        <button type="button" className="seeqi-auth-modal__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>
        <div className="seeqi-auth-modal__header">
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className="seeqi-auth-modal__actions">
          <button type="button" className="seeqi-auth-modal__google" onClick={handleGoogle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} />
            <span>{t.google}</span>
          </button>

          <div className="seeqi-auth-modal__divider">
            <span>{locale === "zh" ? "或" : "or"}</span>
          </div>

          <div className="seeqi-auth-modal__methodSwitch">
            <button
              type="button"
              className={`seeqi-auth-modal__methodButton ${isPhone ? "seeqi-auth-modal__methodButton--active" : ""}`}
              onClick={() => setActiveMethod("phone")}
            >
              {t.phoneTab}
            </button>
            <button
              type="button"
              className={`seeqi-auth-modal__methodButton ${isEmail ? "seeqi-auth-modal__methodButton--active" : ""}`}
              onClick={() => setActiveMethod("email")}
            >
              {t.emailTab}
            </button>
            <button
              type="button"
              className={`seeqi-auth-modal__methodButton ${isTest ? "seeqi-auth-modal__methodButton--active" : ""}`}
              onClick={() => setActiveMethod("test")}
            >
              {t.testTab}
            </button>
          </div>

          {isTest ? (
            <>
              <label className="seeqi-auth-modal__label" htmlFor="auth-test-username">
                {t.testUsernameLabel}
              </label>
              <input
                id="auth-test-username"
                type="email"
                value={testUsername}
                onChange={(event) => setTestUsername(event.target.value)}
                placeholder="test@seeqi.app"
                className="seeqi-auth-modal__input"
                autoComplete="email"
              />

              <label className="seeqi-auth-modal__label" htmlFor="auth-test-password">
                {t.testPasswordLabel}
              </label>
              <input
                id="auth-test-password"
                type="password"
                value={testPassword}
                onChange={(event) => setTestPassword(event.target.value)}
                placeholder="SeeQiTest123"
                className="seeqi-auth-modal__input"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="seeqi-auth-modal__primary seeqi-auth-modal__primary--full"
                onClick={handleTestLogin}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="seeqi-auth-modal__spinner" /> : t.testSignIn}
              </button>
            </>
          ) : (
            <>
              <label className="seeqi-auth-modal__label" htmlFor="auth-identifier">
                {isPhone ? t.phoneLabel : t.emailLabel}
              </label>
              <input
                id="auth-identifier"
                type={isPhone ? "tel" : "email"}
                value={identifier}
                onChange={(event) => (isPhone ? setPhone(event.target.value) : setEmail(event.target.value))}
                placeholder={isPhone ? (locale === "zh" ? "+85212345678" : "+65 8123 4567") : t.emailPlaceholder}
                className="seeqi-auth-modal__input"
                autoComplete={isPhone ? "tel" : "email"}
              />

              {otpSent && (
                <>
                  <label className="seeqi-auth-modal__label" htmlFor="auth-code">
                    {t.codeLabel}
                  </label>
                  <input
                    id="auth-code"
                    type="text"
                    value={codeValue}
                    onChange={(event) => (isPhone ? setPhoneCode(event.target.value) : setEmailCode(event.target.value))}
                    placeholder={locale === "zh" ? "请输入验证码" : "Enter the code"}
                    className="seeqi-auth-modal__input"
                    autoComplete="one-time-code"
                  />
                </>
              )}

              <div className="seeqi-auth-modal__buttons">
                <button
                  type="button"
                  className="seeqi-auth-modal__secondary"
                  onClick={handleRequestOtp}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `${t.resend} (${countdown}s)` : requestLabel}
                </button>
                <button
                  type="button"
                  className="seeqi-auth-modal__primary"
                  onClick={handleVerifyOtp}
                  disabled={loading || !otpSent || !codeValue.trim()}
                >
                  {loading ? <Loader2 size={18} className="seeqi-auth-modal__spinner" /> : t.verify}
                </button>
              </div>
            </>
          )}

          {feedback && (
            <p
              className={`seeqi-auth-modal__feedback ${
                feedback.type === "success" ? "seeqi-auth-modal__feedback--success" : "seeqi-auth-modal__feedback--error"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .seeqi-auth-modal__overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: clamp(1.5rem, 6vh, 4rem) 1.5rem;
          z-index: 2500;
          overflow-y: auto;
          min-height: 100vh;
        }
        .seeqi-auth-modal__panel {
          position: relative;
          width: min(420px, calc(100vw - 2rem));
          background: rgba(255, 255, 255, 0.96);
          border-radius: 24px;
          padding: 2rem 2.25rem;
          box-shadow: 0 36px 80px rgba(0, 0, 0, 0.22);
          max-height: 92vh;
          overflow-y: auto;
        }
        .seeqi-auth-modal__close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          border: none;
          background: transparent;
          font-size: 1.5rem;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.4);
        }
        .seeqi-auth-modal__header h2 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: #2c3e30;
        }
        .seeqi-auth-modal__header p {
          margin: 0.5rem 0 1.5rem;
          color: rgba(44, 62, 48, 0.68);
          font-size: 0.95rem;
        }
        .seeqi-auth-modal__google {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          border: 1px solid rgba(141, 174, 146, 0.45);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-weight: 600;
          background: #fff;
          color: #2c3e30;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .seeqi-auth-modal__google:hover {
          background: rgba(141, 174, 146, 0.1);
        }
        .seeqi-auth-modal__divider {
          width: 100%;
          text-align: center;
          margin: 1.25rem 0;
          position: relative;
          color: rgba(0, 0, 0, 0.35);
          font-size: 0.85rem;
        }
        .seeqi-auth-modal__divider::before,
        .seeqi-auth-modal__divider::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
        }
        .seeqi-auth-modal__divider::before {
          left: 0;
        }
        .seeqi-auth-modal__divider::after {
          right: 0;
        }
        .seeqi-auth-modal__methodSwitch {
          display: flex;
          gap: 0.5rem;
          background: rgba(141, 174, 146, 0.12);
          padding: 0.35rem;
          border-radius: 999px;
          margin-bottom: 1.25rem;
        }
        .seeqi-auth-modal__methodButton {
          flex: 1;
          border: none;
          border-radius: 999px;
          background: transparent;
          padding: 0.55rem 0.75rem;
          font-weight: 600;
          color: rgba(34, 48, 44, 0.7);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        .seeqi-auth-modal__methodButton--active {
          background: linear-gradient(135deg, #8dae92, #7a9d7f);
          color: #fff;
          box-shadow: 0 8px 18px rgba(141, 174, 146, 0.35);
        }
        .seeqi-auth-modal__label {
          font-size: 0.85rem;
          color: rgba(44, 62, 48, 0.7);
          margin-bottom: 0.35rem;
        }
        .seeqi-auth-modal__input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(141, 174, 146, 0.35);
          padding: 0.75rem 0.9rem;
          font-size: 1rem;
          margin-bottom: 1rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .seeqi-auth-modal__input:focus {
          border-color: #8dae92;
          box-shadow: 0 0 0 3px rgba(141, 174, 146, 0.18);
        }
        .seeqi-auth-modal__buttons {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .seeqi-auth-modal__secondary {
          flex: 1;
          min-width: 140px;
          border-radius: 12px;
          border: 1px solid rgba(141, 174, 146, 0.6);
          padding: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.92);
        }
        .seeqi-auth-modal__primary {
          flex: 1;
          min-width: 160px;
          border-radius: 12px;
          border: none;
          padding: 0.75rem;
          font-weight: 600;
          background: linear-gradient(135deg, #8dae92, #7a9d7f);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .seeqi-auth-modal__primary--full {
          width: 100%;
        }
        .seeqi-auth-modal__primary:disabled {
          opacity: 0.7;
          cursor: default;
        }
        .seeqi-auth-modal__spinner {
          animation: spin 1s linear infinite;
        }
        .seeqi-auth-modal__feedback {
          margin-top: 1rem;
          font-size: 0.9rem;
          padding: 0.75rem;
          border-radius: 12px;
        }
        .seeqi-auth-modal__feedback--success {
          background: rgba(141, 174, 146, 0.15);
          color: #2c3e30;
        }
        .seeqi-auth-modal__feedback--error {
          background: rgba(198, 105, 105, 0.15);
          color: #7f1d1d;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 480px) {
          .seeqi-auth-modal__overlay {
            padding: clamp(1rem, 6vh, 3rem) 1rem;
          }
          .seeqi-auth-modal__panel {
            padding: 1.75rem 1.5rem;
            max-height: 94vh;
          }
        }
      `}</style>
    </div>
  );
}

function FeedbackToast({ feedback }: { feedback: Feedback }) {
  return (
    <div className={`seeqi-auth-toast seeqi-auth-toast--${feedback.type}`}>
      {feedback.message}
      <style jsx>{`
        .seeqi-auth-toast {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          padding: 0.85rem 1.2rem;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
          font-weight: 600;
          z-index: 2200;
        }
        .seeqi-auth-toast--success {
          background: rgba(141, 174, 146, 0.95);
          color: #0f2618;
        }
        .seeqi-auth-toast--error {
          background: rgba(198, 105, 105, 0.95);
          color: #fff;
        }
        @media (max-width: 768px) {
          .seeqi-auth-toast {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
          }
        }
      `}</style>
    </div>
  );
}

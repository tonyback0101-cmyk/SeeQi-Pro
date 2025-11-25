import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getLatestSubscriptionStatus, getCurrentUserPlan } from "@/lib/server/subscription";

type RequireEnvOptions = {
  name: string;
  optional?: boolean;
};

function requireEnv({ name, optional = false }: RequireEnvOptions): string | undefined {
  const value = process.env[name];
  if (!value && !optional) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

// 在构建时，如果环境变量不存在，使用占位值以避免构建失败
// 实际运行时会在使用前检查并抛出错误
const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

const providers: any[] = [];

const googleClientId = requireEnv({ name: "GOOGLE_CLIENT_ID", optional: true });
const googleClientSecret = requireEnv({ name: "GOOGLE_CLIENT_SECRET", optional: true });

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

providers.push(
  CredentialsProvider({
    id: "phone-otp",
    name: "Phone OTP",
    credentials: {
      phone: { label: "Phone", type: "text" },
      code: { label: "One-Time Code", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.phone || !credentials?.code) {
        throw new Error("missing_phone_or_code");
      }

      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase.auth.verifyOtp({
        type: "sms",
        phone: credentials.phone,
        token: credentials.code,
      });

      if (error || !data?.user) {
        throw new Error(error?.message ?? "invalid_code");
      }

      const user = data.user;
      return {
        id: user.id,
        email: user.email ?? `${credentials.phone}@seeqi-phone.local`,
        name: user.user_metadata?.full_name ?? `SeeQi ${user.phone ? "用户" : "Guest"}`,
        phone: user.phone ?? credentials.phone,
        image: user.user_metadata?.avatar_url ?? undefined,
      } as any;
    },
  })
);

providers.push(
  CredentialsProvider({
    id: "email-otp",
    name: "Email OTP",
    credentials: {
      email: { label: "Email", type: "text" },
      code: { label: "Verification Code", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.code) {
        throw new Error("missing_email_or_code");
      }

      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase.auth.verifyOtp({
        type: "email",
        email: credentials.email,
        token: credentials.code,
      });

      if (error || !data?.user) {
        throw new Error(error?.message ?? "invalid_code");
      }

      const user = data.user;
      return {
        id: user.id,
        email: user.email ?? credentials.email,
        name: user.user_metadata?.full_name ?? credentials.email.split("@")[0],
        phone: user.phone ?? null,
        image: user.user_metadata?.avatar_url ?? undefined,
      } as any;
    },
  })
);

// 运行时检查：如果使用占位值，说明环境变量未配置
if (supabaseUrl === "https://placeholder.supabase.co" || supabaseServiceRoleKey === "placeholder-key") {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL) {
    console.warn("[auth] 警告：Supabase 环境变量未配置，使用占位值。生产环境必须配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
  }
}

export const authOptions = {
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  cookies: {
    sessionToken: {
      // 在开发环境（HTTP）不使用 __Secure- 前缀，避免警告
      // __Secure- 前缀要求 secure 标志为 true，且只能在 HTTPS 上使用
      name: process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://")
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // 明确检查是否为 HTTPS，在开发环境（localhost）不使用 secure
        // 使用 NEXTAUTH_URL 或检查协议，明确禁用 localhost 的 secure
        secure: (() => {
          // 检查是否为 localhost 或 127.0.0.1
          const url = process.env.NEXTAUTH_URL || "";
          const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1") || !url;
          const isHttps = url.startsWith("https://");
          const isProduction = process.env.NODE_ENV === "production";
          // 如果是 localhost 或开发环境，明确禁用 secure
          if (isLocalhost || !isProduction) {
            return false;
          }
          // 只在生产环境且明确使用 HTTPS 时使用 secure
          return isProduction && isHttps;
        })(),
      },
    },
  },
  providers,
  callbacks: {
    async session({ session, token, user }: { session: Session; token: JWT; user?: any }) {
      if (session.user) {
        const phone = (user as any)?.phone ?? token.phone ?? null;
        session.user.id = user?.id ?? token.sub ?? session.user.id ?? "";
        session.user.phone = phone;
      }
      if (token.subscription) {
        session.subscription = token.subscription;
      }
      if (token.proStatus) {
        session.proStatus = token.proStatus;
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: any }) {
      const userId = user?.id ?? token.sub ?? "";
      if (user) {
        token.phone = (user as any).phone ?? null;
      }
      if (userId) {
        const shouldRefresh = Boolean(user) || !token.subscriptionCheckedAt || Date.now() - token.subscriptionCheckedAt > 5 * 60 * 1000;
        if (shouldRefresh) {
          try {
            // V2 统一使用 getCurrentUserPlan 获取 Pro 状态
            const proStatus = await getCurrentUserPlan(userId);
            token.proStatus = proStatus;
            // 保留旧的 subscription 字段以兼容现有代码
            const subscription = await getLatestSubscriptionStatus(userId);
            token.subscription = subscription;
            token.subscriptionCheckedAt = Date.now();
          } catch (error) {
            console.error("nextauth:subscription-refresh", error);
          }
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "placeholder-secret-for-build-time",
  trustHost: true,
  theme: {
    colorScheme: "auto",
    brandColor: "#8DAE92",
    logo: "/icons/icon-192.png",
  },
} as const;

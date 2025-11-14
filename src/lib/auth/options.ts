import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getLatestSubscriptionStatus } from "@/lib/server/subscription";

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

const supabaseUrl = requireEnv({ name: "SUPABASE_URL" })!;
const supabaseServiceRoleKey = requireEnv({ name: "SUPABASE_SERVICE_ROLE_KEY" })!;

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

const testUsername = requireEnv({ name: "NEXTAUTH_TEST_USERNAME", optional: true }) ?? "test@seeqi.app";
const testPassword = requireEnv({ name: "NEXTAUTH_TEST_PASSWORD", optional: true }) ?? "SeeQiTest123";

if (process.env.NODE_ENV !== "production") {
  providers.push(
    CredentialsProvider({
      id: "test-account",
      name: "Test Account",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("missing_credentials");
        }

        console.log("[test-account] attempt", {
          receivedUsername: credentials.username,
          expectedUsername: testUsername,
          receivedPassword: credentials.password,
          expectedPassword: testPassword,
        });

        if (credentials.username !== testUsername || credentials.password !== testPassword) {
          throw new Error("invalid_test_credentials");
        }

        return {
          id: `test-${Buffer.from(testUsername).toString("base64")}`,
          email: testUsername,
          name: "SeeQi QA Tester",
          phone: null,
          image: undefined,
        } as any;
      },
    })
  );
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
  secret: requireEnv({ name: "NEXTAUTH_SECRET" })!,
  trustHost: true,
  theme: {
    colorScheme: "auto",
    brandColor: "#8DAE92",
    logo: "/icons/icon-192.png",
  },
} as const;

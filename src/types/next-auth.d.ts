import type { SubscriptionStatus } from "@/lib/server/subscription";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null;
    };
    subscription?: SubscriptionStatus;
  }

  interface User {
    phone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone?: string | null;
    subscription?: SubscriptionStatus;
    subscriptionCheckedAt?: number;
  }
}

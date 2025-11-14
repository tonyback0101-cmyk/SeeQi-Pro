"use server";

import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`环境变量 ${name} 未设置，请在 .env.local 中配置 Supabase 凭据`);
  }
  return value;
}

export const supabaseAdmin = createClient(
  requiredEnv("SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "X-Client-Info": "seeqi-nextauth-admin",
      },
    },
  }
);

export type SupabaseAdminClient = typeof supabaseAdmin;

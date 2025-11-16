import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

// 在构建时，如果环境变量不存在，使用占位值以避免构建失败
// 实际运行时会在使用前检查并抛出错误
const supabaseUrl = getSupabaseUrl();
const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
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

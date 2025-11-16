import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

type AdminClient = SupabaseClient;

let adminClient: AdminClient | null = null;

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

export function getSupabaseAdminClient(): AdminClient {
  if (adminClient) {
    return adminClient;
  }
  
  // 在构建时，如果环境变量不存在，返回一个模拟客户端以避免构建失败
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  
  if (!url || !serviceRoleKey || url.includes("placeholder.supabase.co") || serviceRoleKey === "placeholder-key") {
    // 构建时环境变量可能不存在，创建一个占位客户端
    // 实际运行时会在第一次使用时检查并抛出错误
    const placeholderUrl = url || getSupabaseUrl();
    const placeholderKey = serviceRoleKey || getSupabaseServiceRoleKey();
    
    adminClient = createClient(placeholderUrl, placeholderKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
    });
    
    return adminClient;
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });

  return adminClient;
}

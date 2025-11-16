// Unified environment variable access to reduce ops friction.
// For URLs we accept both NEXT_PUBLIC_* and server-only names.

function firstDefined(names: string[]): string | undefined {
  for (const name of names) {
    const v = process.env[name];
    if (v && v.trim().length > 0 && v !== "undefined") {
      return v.trim();
    }
  }
  return undefined;
}

export function getSupabaseUrl(): string {
  const url =
    firstDefined(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]) ||
    // keep placeholder during build; runtime code paths should validate again
    "https://placeholder.supabase.co";
  return url;
}

export function getSupabaseAnonKey(): string | undefined {
  return firstDefined(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"]);
}

export function getSupabaseServiceRoleKey(): string {
  const key =
    firstDefined(["SUPABASE_SERVICE_ROLE_KEY"]) ||
    // placeholder to avoid build crashes; do not use in runtime
    "placeholder-key";
  return key;
}

const SERVER_REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXTAUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const PUBLIC_REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
];

export function getMissingServerEnvVars(): string[] {
  if (typeof process === "undefined") {
    return [];
  }
  return SERVER_REQUIRED_VARS.filter((key) => !process.env[key] || process.env[key]?.trim() === "");
}

export function getMissingPublicEnvVars(): string[] {
  if (typeof process === "undefined") {
    return [];
  }
  return PUBLIC_REQUIRED_VARS.filter((key) => !process.env[key] || process.env[key]?.trim() === "");
}







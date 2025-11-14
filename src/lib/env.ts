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







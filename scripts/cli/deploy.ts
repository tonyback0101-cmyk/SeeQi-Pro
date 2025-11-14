import { logStep, loadEnvFile, resolveFromRoot, runCommand } from "./utils";

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_REPORT_ONE_USD",
  "NEXT_PUBLIC_BASE_URL",
];

function assertEnv() {
  const missing = REQUIRED_VARS.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const price = process.env.STRIPE_PRICE_REPORT_ONE_USD ?? "";
  if (!price.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_REPORT_ONE_USD 应为有效的 Stripe 价格 ID（形如 price_xxx）");
  }
}

async function main() {
  await loadEnvFile(resolveFromRoot(".env.local"));
  assertEnv();

  logStep("Running lint");
  runCommand("npm", ["run", "lint"]);

  logStep("Running tests");
  runCommand("npm", ["run", "test", "--", "--run"]);

  logStep("Triggering Vercel production deployment");
  runCommand("npx", ["vercel", "deploy", "--prod", "--yes"]);

  logStep("Deployment command finished. Please monitor Vercel dashboard for status.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


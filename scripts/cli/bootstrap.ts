import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { getSupabaseAdminClient } from "../../src/lib/supabaseAdmin";
import { logStep, runCommand, ensureFileWithTemplate, loadEnvFile, resolveFromRoot } from "./utils";

const ENV_TEMPLATE = `# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Stripe Prices (update with your live/test price IDs)
STRIPE_PRICE_REPORT_ONE_USD=
STRIPE_PRICE_SUB_MONTH_USD=
STRIPE_PRICE_SUB_YEAR_USD=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
IMAGE_TTL_MINUTES=3
REPORT_TTL_DAYS=30
`;

async function createDemoData() {
  try {
    const client = getSupabaseAdminClient();
    const demoEmail = "demo@seeqi.app";
    const demoPassword = "SeeQiDemo123";

    const { data: existing } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    const existingUser = existing?.users?.find(
      (user: { email?: string | null }) => user.email === demoEmail
    );
    let userId: string | undefined = existingUser?.id;
    if (!userId) {
      const { data, error } = await client.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user?.id;
      logStep(`Created demo user ${demoEmail}`);
    } else {
      logStep(`Demo user ${demoEmail} already exists`);
    }

    if (!userId) return;

    const reportId = randomUUID();
    const { error: insertReportError } = await client.from("reports").upsert(
      {
        id: reportId,
        session_id: null,
        constitution: "平和体质",
        advice: {
          diet: ["清淡饮食", "多食新鲜时蔬"],
          lifestyle: ["保证充足睡眠", "适度运动"],
        },
        solar_term: "立春",
        quote: "气和则百脉畅。",
        matched_rules: ["demo_fallback"],
        has_full: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (insertReportError) throw insertReportError;

    logStep("Inserted demo report for preview");
  } catch (error) {
    logStep("Skip demo data (Supabase credentials missing or user already exists).");
    if (error instanceof Error) {
      console.warn(error.message);
    }
  }
}

async function ensureExampleDataFiles() {
  const rulesDir = resolveFromRoot("src", "lib", "rules");
  const exampleDir = resolveFromRoot("examples", "rules");
  if (!existsSync(exampleDir)) return;

  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(exampleDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .map(async (entry) => {
        const srcPath = path.join(exampleDir, entry.name);
        const targetPath = path.join(rulesDir, entry.name);
        if (!existsSync(targetPath)) {
          const content = await fs.readFile(srcPath, "utf8");
          await fs.writeFile(targetPath, content, "utf8");
        }
      }),
  );
}

async function main() {
  logStep("Ensuring .env.local exists");
  const created = await ensureFileWithTemplate(resolveFromRoot(".env.local"), ENV_TEMPLATE);
  if (created) {
    logStep("Created .env.local with placeholders. Please fill in before deploy.");
  } else {
    logStep(".env.local already exists");
  }

  await loadEnvFile(resolveFromRoot(".env.local"));

  logStep("Running database migrations (supabase db push)");
  runCommand("npx", ["supabase", "db", "push"]);

  logStep("Importing seed data");
  runCommand("npm", ["run", "import:seed"]);

  await ensureExampleDataFiles();
  await createDemoData();

  logStep("Bootstrap complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


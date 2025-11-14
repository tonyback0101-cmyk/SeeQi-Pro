import { logStep, runCommand } from "./utils";

async function main() {
  logStep("Rolling back Vercel deployment to previous production");
  runCommand("npx", ["vercel", "rollback"]);
  logStep("Rollback command issued. Verify status in Vercel dashboard.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


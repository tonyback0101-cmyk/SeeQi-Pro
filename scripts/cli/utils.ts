import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function logStep(message: string) {
  // eslint-disable-next-line no-console
  console.log(`\n› ${message}`);
}

export function runCommand(command: string, args: string[], options: { cwd?: string } = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: options.cwd ?? process.cwd(),
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command "${command} ${args.join(" ")}" failed with exit code ${result.status}`);
  }
}

export async function ensureFileWithTemplate(filePath: string, template: string) {
  if (existsSync(filePath)) {
    return false;
  }
  await writeFile(filePath, template, "utf8");
  return true;
}

export async function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = await readFile(filePath, "utf8");
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (!key) return;
      const value = rest.join("=").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
}

export function resolveFromRoot(...segments: string[]) {
  return path.join(process.cwd(), ...segments);
}


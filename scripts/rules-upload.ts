import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY 均需配置才能上传规则文件。");
  }

  const sourceDir = process.env.RULES_SOURCE_DIR ?? "src/lib/rules";
  const bucket = process.env.RULES_BUCKET ?? "rules";
  const prefix = process.env.RULES_BUCKET_PREFIX ?? "rules";

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const entries = await readdir(sourceDir);
  if (!entries || entries.length === 0) {
    console.warn(`[rules-upload] 目录 ${sourceDir} 中未找到规则文件。`);
    return;
  }

  for (const entry of entries) {
    if (!entry.endsWith(".jsonl")) {
      continue;
    }

    const filePath = join(sourceDir, entry);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      continue;
    }

    const buffer = await readFile(filePath);
    const storagePath = `${prefix}/${entry}`;
    const { error } = await client.storage
      .from(bucket)
      .upload(storagePath, buffer, { upsert: true, contentType: "application/json" });

    if (error) {
      throw error;
    }

    console.log(`[rules-upload] uploaded ${filePath} -> ${bucket}/${storagePath}`);
  }
}

main().catch((error) => {
  console.error("[rules-upload] failed", error);
  process.exitCode = 1;
});


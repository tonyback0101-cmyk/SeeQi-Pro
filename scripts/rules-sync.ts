import { createClient } from "@supabase/supabase-js";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY 均需配置才能同步规则文件。");
  }

  const bucket = process.env.RULES_BUCKET ?? "rules";
  const prefix = process.env.RULES_BUCKET_PREFIX ?? "rules";
  const downloadDir = process.env.RULES_DOWNLOAD_DIR ?? "rules";

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: list, error: listError } = await client.storage.from(bucket).list(prefix, { limit: 100 });
  if (listError) {
    throw listError;
  }

  if (!list || list.length === 0) {
    console.warn(`[rules-sync] bucket "${bucket}" 下未找到前缀 ${prefix} 的文件。`);
    return;
  }

  await rm(downloadDir, { recursive: true, force: true });
  await mkdir(downloadDir, { recursive: true });

  for (const item of list) {
    if (!item.name?.endsWith(".jsonl")) {
      continue;
    }

    const key = `${prefix}/${item.name}`;
    const { data, error } = await client.storage.from(bucket).download(key);
    if (error) {
      throw error;
    }

    const arrayBuffer = await data.arrayBuffer();
    const filePath = join(downloadDir, item.name);
    await writeFile(filePath, Buffer.from(arrayBuffer));
    console.log(`[rules-sync] downloaded ${item.name} -> ${filePath}`);
  }
}

main().catch((error) => {
  console.error("[rules-sync] failed", error);
  process.exitCode = 1;
});


import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../src/lib/supabaseAdmin";

interface ConstitutionCsvRow {
  id: string;
  constitution_zh: string;
  constitution_en: string;
  feature: string;
  advice_diet: string;
  advice_activity: string;
  advice_acupoint: string;
}

interface SolarCsvRow {
  id: string;
  solar_zh: string;
  solar_en: string;
  element: string;
  do_list: string;
  avoid_list: string;
  health_tip: string;
}

interface DreamCsvRow {
  id: string;
  keyword_zh: string;
  keyword_en: string;
  category: string;
  emotion: string;
  five_element: string;
  meaning: string;
  health_tip: string;
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "item";
}

async function readCsv<T>(filePath: string, mapRow: (columns: string[]) => T): Promise<T[]> {
  const content = await readFile(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const [, ...rows] = lines;
  return rows.map((line) => {
    const columns = line.split(",").map((cell) => cell.trim());
    return mapRow(columns);
  });
}

function parseList(list: string): string[] {
  if (!list) return [];
  return list
    .replace(/[“”"]/g, "")
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function importConstitutions(client: SupabaseClient) {
  const filePath = resolve("data/seed/constitutions.csv");
  const rows = await readCsv<ConstitutionCsvRow>(filePath, (columns) => {
    const [id, constitution_zh, constitution_en, feature, advice_diet, advice_activity, advice_acupoint] = columns;
    return {
      id,
      constitution_zh,
      constitution_en,
      feature,
      advice_diet,
      advice_activity,
      advice_acupoint,
    };
  });

  if (!rows.length) {
    console.warn("No constitution rows found, skipping.");
    return;
  }

  const mapped = rows.map((row) => {
    const code = toSlug(row.constitution_en);
    return {
      code,
      name_zh: row.constitution_zh,
      name_en: row.constitution_en,
      desc_zh: row.feature,
      desc_en: row.feature,
      feature: row.feature,
      advice_diet: row.advice_diet,
      advice_activity: row.advice_activity,
      advice_acupoint: row.advice_acupoint,
    };
  });

  const { error } = await client.from("dict_constitution").upsert(mapped, {
    onConflict: "code",
  });

  if (error) {
    throw new Error(`Failed to import constitutions: ${error.message}`);
  }

  console.log(`Imported ${rows.length} constitution rows.`);
}

async function importSolarTerms(client: SupabaseClient) {
  const codeMap = [
    "lichun",
    "yushui",
    "jingzhe",
    "chunfen",
    "qingming",
    "guyu",
    "lixia",
    "xiaoman",
    "mangzhong",
    "xiazhi",
    "xiaoshu",
    "dashu",
    "liqiu",
    "chushu",
    "bailu",
    "qiufen",
    "hanlu",
    "shuangjiang",
    "lidong",
    "xiaoxue",
    "daxue",
    "dongzhi",
    "xiaohan",
    "dahan",
  ];

  const filePath = resolve("data/seed/solar_terms.csv");
  const rows = await readCsv<SolarCsvRow>(filePath, (columns) => {
    const [id, solar_zh, solar_en, element, do_list, avoid_list, health_tip] = columns;
    return {
      id,
      solar_zh,
      solar_en,
      element,
      do_list,
      avoid_list,
      health_tip,
    };
  });

  if (!rows.length) {
    console.warn("No solar term rows found, skipping.");
    return;
  }

  const mapped = rows.map((row, index) => {
    const code = codeMap[index] ?? toSlug(row.solar_en);
    return {
      code,
      name_zh: row.solar_zh,
      name_en: row.solar_en,
      do_zh: parseList(row.do_list),
      avoid_zh: parseList(row.avoid_list),
      do_en: parseList(row.do_list),
      avoid_en: parseList(row.avoid_list),
      element: row.element,
      health_tip: row.health_tip,
    };
  });

  const { error } = await client.from("dict_solar_term").upsert(mapped, {
    onConflict: "code",
  });

  if (error) {
    throw new Error(`Failed to import solar terms: ${error.message}`);
  }

  console.log(`Imported ${rows.length} solar term rows.`);
}

async function importDreamKeywords(client: SupabaseClient) {
  const filePath = resolve("data/seed/dream_keywords.csv");
  const rows = await readCsv<DreamCsvRow>(filePath, (columns) => {
    const [id, keyword_zh, keyword_en, category, emotion, five_element, meaning, health_tip] = columns;
    return { id, keyword_zh, keyword_en, category, emotion, five_element, meaning, health_tip };
  });

  if (!rows.length) {
    console.warn("No dream keyword rows found, skipping.");
    return;
  }

  const mapped = rows.flatMap((row) => {
    const entries = [];
    entries.push({
      keyword: row.keyword_zh,
      locale: "zh",
      category: row.category,
      five_element: row.five_element,
      emotion: row.emotion,
      meaning_zh: row.meaning,
      meaning_en: row.meaning,
      health_tip_zh: row.health_tip,
      health_tip_en: row.health_tip,
    });
    entries.push({
      keyword: row.keyword_en,
      locale: "en",
      category: row.category,
      five_element: row.five_element,
      emotion: row.emotion,
      meaning_zh: row.meaning,
      meaning_en: row.meaning,
      health_tip_zh: row.health_tip,
      health_tip_en: row.health_tip,
    });
    return entries;
  });

  const { error } = await client.from("dream_keywords").upsert(mapped, {
    onConflict: "keyword,locale",
  });

  if (error) {
    throw new Error(`Failed to import dream keywords: ${error.message}`);
  }

  console.log(`Imported ${mapped.length} dream keyword rows.`);
}

async function main() {
  try {
    const client = getSupabaseAdminClient();
    await importConstitutions(client);
    await importSolarTerms(client);
    await importDreamKeywords(client);
    console.log("All seed data imported successfully.");
  } catch (error) {
    console.error("Import failed:", error);
    process.exitCode = 1;
  }
}

void main();


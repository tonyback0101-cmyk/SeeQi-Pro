import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";
import { analyzeDream, type DreamAnalysisResult } from "@/lib/analysis/dreamAnalyzer";

export interface DreamAnalysisInput {
  text: string;
  locale?: "zh" | "en";
  emotion?: string;
  category?: string | null;
  tags?: string[];
}

let cachedKeywords: Record<string, { five_element?: string; emotion?: string; meaning?: string; tip?: string }> | null =
  null;

async function loadDreamKeywordMap() {
  if (cachedKeywords) {
    return cachedKeywords;
  }
  const client = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("[dreamFeatures] Loading keywords from dream_keywords_std");
  const { data, error } = await client
    .from("dream_keywords_std")
    .select("keyword,locale,five_element,emotion,meaning_zh,meaning_en,health_tip_zh,health_tip_en");

  if (error) {
    console.error("[dreamFeatures] Failed to load keywords:", error);
    throw error;
  }

  cachedKeywords = {};
  data.forEach((row) => {
    const key = `${row.keyword}:${row.locale}`;
    cachedKeywords![key] = {
      five_element: row.five_element ?? undefined,
      emotion: row.emotion ?? undefined,
      meaning: row.locale === "en" ? row.meaning_en ?? undefined : row.meaning_zh ?? undefined,
      tip: row.locale === "en" ? row.health_tip_en ?? undefined : row.health_tip_zh ?? undefined,
    };
  });

  return cachedKeywords!;
}

export async function analyzeDreamText({
  text,
  locale = "zh",
  emotion = "unknown",
  category = null,
  tags = [],
}: DreamAnalysisInput) {
  const keywordsMap = await loadDreamKeywordMap();
  const analysis: DreamAnalysisResult = analyzeDream(text, emotion, locale);
  const normalizedTags = Array.isArray(tags)
    ? Array.from(new Set(tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0))).slice(0, 8)
    : [];

  const enrichedDetails = analysis.symbolDetails.map((detail) => {
    const key = `${detail.key}:${locale}`;
    const additions = keywordsMap[key];
    return {
      ...detail,
      meaning: additions?.meaning ?? detail.meaning,
      advice: additions?.tip ?? detail.advice,
    };
  });

  return {
    ...analysis,
    symbolDetails: enrichedDetails,
    category: category ?? analysis.category ?? null,
    tags: normalizedTags,
    mood: emotion,
    rawText: text,
  };
}

export function resetDreamKeywordCache() {
  cachedKeywords = null;
}


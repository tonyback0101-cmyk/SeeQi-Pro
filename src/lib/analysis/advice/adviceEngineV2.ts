import type { ConstitutionMeta } from "@/lib/analysis/constitution";
import type { QiRhythmV2 } from "@/lib/analysis/qi/types";

export interface ModuleSuggestionSource {
  palmSuggestions?: string[];
  tongueSuggestions?: string[];
  dreamSuggestions?: string[];
}

export interface GenerateAdviceV2Input extends ModuleSuggestionSource {
  constitution: ConstitutionMeta;
  qi?: QiRhythmV2 | null;
  maxItems?: number;
}

export interface AdviceV2Result {
  items: string[];
}

export function generateAdviceV2(input: GenerateAdviceV2Input): AdviceV2Result {
  const {
    constitution,
    palmSuggestions = [],
    tongueSuggestions = [],
    dreamSuggestions = [],
    maxItems = 5,
  } = input;

  const pool: string[] = [];

  const pushBatch = (list?: string[]) => {
    if (!list) return;
    for (const raw of list) {
      const s = (raw || "").trim();
      if (!s) continue;
      const normalized = s.replace(/[。\.!\s]+$/g, "").toLowerCase();
      const exists = pool.some(
        (item) => item.replace(/[。\.!\s]+$/g, "").toLowerCase() === normalized,
      );
      if (!exists) {
        pool.push(s);
      }
      if (pool.length >= maxItems) return;
    }
  };

  pushBatch(constitution.advice);

  if (pool.length < maxItems) {
    pushBatch(tongueSuggestions);
  }

  if (pool.length < maxItems) {
    pushBatch(dreamSuggestions);
  }

  if (pool.length < maxItems) {
    pushBatch(palmSuggestions);
  }

  while (pool.length < 3 && constitution.advice.length > 0) {
    pool.push(constitution.advice[pool.length % constitution.advice.length]);
  }

  return { items: pool.slice(0, maxItems) };
}


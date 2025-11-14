import path from "node:path";
import { RuleEngine, type RuleExecutionResult, getDefaultRulesPath } from "@/lib/rule-engine";

export interface RuleFacts {
  palm?: Record<string, unknown>;
  tongue?: Record<string, unknown>;
  dream?: {
    keywords?: string[];
    emotion?: string;
    five_element?: string;
    tip?: string;
  };
  solar?: {
    code?: string;
    name?: string;
  };
  locale?: string;
  [key: string]: unknown;
}

export interface RuleAdvice {
  diet?: string[];
  lifestyle?: string[];
  exercise?: string[];
  acupoints?: Array<Record<string, string>>;
  mindset?: string[];
  [key: string]: unknown;
}

export interface RuleResult {
  constitution?: string;
  advice?: RuleAdvice;
  dream?: Record<string, unknown> | null;
  quote?: string;
  solar_term?: string;
  [key: string]: unknown;
}

export interface ExecuteRulesResult {
  result: RuleResult;
  matchedRules: string[];
}

let engine: RuleEngine | null = null;

function getEngine() {
  if (!engine) {
    const rulesDir = process.env.RULES_DIR_PATH ?? getDefaultRulesPath();
    engine = new RuleEngine(rulesDir);
  }
  return engine;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return undefined;
}

function normalizeAdvice(value: unknown): RuleAdvice | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const advice: RuleAdvice = {};

  Object.keys(raw).forEach((key) => {
    const arr = toStringArray(raw[key]);
    if (arr && arr.length > 0) {
      advice[key] = arr;
    } else if (Array.isArray(raw[key])) {
      advice[key] = raw[key] as unknown[];
    } else if (typeof raw[key] === "object" && raw[key] !== null) {
      advice[key] = raw[key] as unknown;
    }
  });

  return Object.keys(advice).length > 0 ? advice : undefined;
}

function normalizeResult(raw: Record<string, unknown>): RuleResult {
  const constitution = typeof raw.constitution === "string" ? raw.constitution : undefined;
  const quote = typeof raw.quote === "string" ? raw.quote : undefined;
  const advice = normalizeAdvice(raw.advice);
  const dream = raw.dream && typeof raw.dream === "object" ? (raw.dream as Record<string, unknown>) : null;
  const solarTerm = typeof raw.solar_term === "string" ? raw.solar_term : undefined;

  return {
    ...raw,
    constitution,
    quote,
    advice,
    dream,
    solar_term: solarTerm,
  };
}

export async function executeRules(facts: RuleFacts): Promise<ExecuteRulesResult> {
  const engineInstance = getEngine();
  const { result, matchedRules }: RuleExecutionResult = await engineInstance.execute(facts);
  return {
    result: normalizeResult(result),
    matchedRules,
  };
}

export async function reloadRules() {
  const engineInstance = getEngine();
  await engineInstance.reload();
}


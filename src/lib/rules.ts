import path from "node:path";
import { promises as fs } from "node:fs";
import { RuleEngine, type RuleExecutionResult, getDefaultRulesPath } from "@/lib/rule-engine";
import get from "lodash.get";

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

/**
 * 按顺序执行多个规则文件
 * @param facts 规则事实
 * @param ruleFiles 要执行的规则文件列表（按顺序）
 * @returns 合并后的规则执行结果
 */
export async function executeRulesSequentially(
  facts: RuleFacts,
  ruleFiles: string[],
): Promise<ExecuteRulesResult> {
  const engineInstance = getEngine();
  let mergedResult: Record<string, unknown> = {};
  const allMatchedRules: string[] = [];

  // 准备上下文：将 facts 扁平化，支持顶层字段匹配
  const context: Record<string, unknown> = {
    ...facts,
    // 扁平化字段，支持直接匹配（优先使用 facts 中已有的扁平字段）
    tongue_color: (facts as any).tongue_color ?? facts.tongue?.color,
    coating: (facts as any).coating ?? facts.tongue?.coating,
    palm_color: (facts as any).palm_color ?? facts.palm?.color,
    line_depth: (facts as any).line_depth ?? facts.palm?.line_depth,
    life_line: (facts as any).life_line ?? (facts.palm?.lines as any)?.life,
    head_line: (facts as any).head_line ?? (facts.palm?.lines as any)?.head,
    emotion_line: (facts as any).emotion_line ?? (facts.palm?.lines as any)?.heart,
    mount_tags: (facts as any).mount_tags ?? facts.palm?.mount_tags,
    dream_keywords: (facts as any).dream_keywords ?? facts.dream?.keywords ?? [],
    solar_term: (facts as any).solar_term ?? facts.solar?.code,
    // 保留嵌套结构
    tongue: facts.tongue,
    palm: facts.palm,
    dream: facts.dream,
    solar: facts.solar,
    locale: facts.locale,
  };

  // 按顺序执行每个规则文件
  for (const ruleFile of ruleFiles) {
    try {
      // 创建临时引擎实例，只加载指定文件
      const rulesDir = process.env.RULES_DIR_PATH ?? getDefaultRulesPath();
      const tempEngine = new RuleEngine(rulesDir);
      
      // 读取规则文件
      const filePath = path.join(rulesDir, ruleFile);
      let fileContent: string;
      try {
        fileContent = await fs.readFile(filePath, "utf8");
      } catch (readError) {
        console.warn(`[executeRulesSequentially] Failed to read rule file ${ruleFile}:`, readError);
        // 如果文件不存在或读取失败，跳过该文件，继续执行其他文件
        continue;
      }
    
    // 解析该文件的规则
    const lines = fileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    
    const rules = lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse rule ${ruleFile}#${index + 1}: ${message}`);
      }
    });

    // 按优先级排序
    rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // 执行该文件的规则
    const result: Record<string, unknown> = {};
    const matchedRules: string[] = [];
    const currentContext = { ...context, ...mergedResult };

    rules.forEach((rule: any) => {
      // 简化的匹配逻辑（使用 lodash.get）
      const matches = Object.entries(rule.when ?? {}).every(([pathExpression, expected]) => {
        const actual = get(currentContext, pathExpression);
        
        // 如果 actual 是 undefined 或 null，且 expected 不是 undefined/null，则不匹配
        if (actual === undefined || actual === null) {
          return expected === undefined || expected === null || (Array.isArray(expected) && expected.length === 0);
        }
        
        // 如果 expected 是数组，检查 actual 是否包含数组中的任意值
        if (Array.isArray(expected)) {
          if (expected.length === 0) {
            // 空数组表示不匹配任何值
            return false;
          }
          if (Array.isArray(actual)) {
            // 如果 actual 也是数组，检查是否有交集
            if (actual.length === 0) {
              return false;
            }
            return expected.some((value) => actual.includes(value));
          }
          // 如果 actual 不是数组，检查 actual 是否在 expected 中
          return expected.includes(actual);
        }
        
        // 如果 expected 不是数组，直接比较（支持字符串和数字）
        // 对于字符串，进行 trim 和大小写不敏感比较
        if (typeof expected === "string" && typeof actual === "string") {
          return expected.trim().toLowerCase() === actual.trim().toLowerCase();
        }
        
        return actual === expected;
      });

      if (matches) {
        matchedRules.push(rule.id);
        const mergeStrategy = rule.strategy ?? rule.merge ?? "append";
        
        Object.entries(rule.then ?? {}).forEach(([key, value]) => {
          const current = (result as any)[key];
          const mergedValue = mergeValues(current, value, mergeStrategy);
          (result as any)[key] = mergedValue;
        });
      }
    });

      // 合并结果
      mergedResult = mergeResults(mergedResult, result);
      allMatchedRules.push(...matchedRules);
    } catch (ruleFileError) {
      console.error(`[executeRulesSequentially] Error processing rule file ${ruleFile}:`, ruleFileError);
      // 单个规则文件失败不影响其他文件，继续执行
      continue;
    }
  }

  return {
    result: normalizeResult(mergedResult),
    matchedRules: allMatchedRules,
  };
}

/**
 * 合并两个值（简化版 merge）
 */
function mergeValues(target: any, source: any, strategy: "append" | "replace" | "skip"): any {
  if (strategy === "skip" && target !== undefined) {
    return target;
  }

  const hasValue = (v: unknown) => {
    if (v === undefined || v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length > 0;
    return true;
  };

  if (Array.isArray(target) && Array.isArray(source)) {
    if (strategy === "replace" && hasValue(target)) return target;
    if (!hasValue(target)) return [...source];
    const set = new Set(target);
    source.forEach((item) => set.add(item));
    return Array.from(set);
  }

  if (typeof target === "object" && target !== null && typeof source === "object" && source !== null) {
    const result = { ...(target as Record<string, unknown>) };
    Object.entries(source).forEach(([key, value]) => {
      const existing = (result as any)[key];
      if (strategy === "replace" && hasValue(existing)) return;
      if (!hasValue(existing)) {
        result[key] = Array.isArray(value) ? [...value] : typeof value === "object" && value !== null ? mergeValues({}, value, strategy) : value;
      } else {
        result[key] = mergeValues(existing, value, strategy);
      }
    });
    return result;
  }

  if (strategy === "replace") {
    return hasValue(target) ? target : source ?? target;
  }
  if (strategy === "skip") {
    return hasValue(target) ? target : source ?? target;
  }
  // append 默认：已有值则保留，否则使用 source
  if (hasValue(target)) {
    return target;
  }
  return source ?? target;
}

/**
 * 合并两个结果对象（使用 append 策略）
 */
function mergeResults(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  Object.entries(source).forEach(([key, value]) => {
    result[key] = mergeValues(result[key], value, "append");
  });
  return result;
}

export async function executeRules(facts: RuleFacts): Promise<ExecuteRulesResult> {
  // 按顺序执行规则文件：舌相 → 手相 → 梦境 → 节气 → global
  return executeRulesSequentially(facts, ["tongue.jsonl", "palm.jsonl", "dream.jsonl", "solar.jsonl", "global.jsonl"]);
}

export async function reloadRules() {
  const engineInstance = getEngine();
  await engineInstance.reload();
}


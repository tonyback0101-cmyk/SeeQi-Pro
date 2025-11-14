import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import get from "lodash.get";

export type MergeStrategy = "append" | "replace" | "skip";

export interface RuleDefinition {
  id: string;
  priority: number;
  when: Record<string, unknown>;
  then: Record<string, unknown>;
  merge?: MergeStrategy;
}

export type RuleContext = Record<string, unknown>;

export interface RuleExecutionResult<T = Record<string, unknown>> {
  result: T;
  matchedRules: string[];
}

type FileSnapshot = {
  mtimeMs: number;
  hash: string;
};

export class RuleEngine<TContext extends RuleContext = RuleContext> {
  private rulesDir: string;

  private rules: RuleDefinition[] = [];

  private fileSnapshot: Map<string, FileSnapshot> = new Map();

  constructor(rulesDir: string) {
    this.rulesDir = rulesDir;
  }

  /**
   * Return the current rules, reloading from disk when any file has changed.
   */
  private async ensureRulesLoaded() {
    const files = await this.readRuleFiles();
    let shouldReload = false;

    if (files.length !== this.fileSnapshot.size) {
      shouldReload = true;
    } else {
      for (const file of files) {
        const prev = this.fileSnapshot.get(file.name);
        if (!prev || prev.mtimeMs !== file.mtimeMs || prev.hash !== file.hash) {
          shouldReload = true;
          break;
        }
      }
    }

    if (!shouldReload) {
      return;
    }

    const rules: RuleDefinition[] = [];
    const newSnapshot: Map<string, FileSnapshot> = new Map();

    for (const file of files) {
      const lines = file.content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));

      lines.forEach((line, index) => {
        try {
          const parsed = JSON.parse(line) as RuleDefinition;
          rules.push(parsed);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to parse rule ${file.name}#${index + 1}: ${message}`);
        }
      });

      newSnapshot.set(file.name, { mtimeMs: file.mtimeMs, hash: file.hash });
    }

    rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    this.rules = rules;
    this.fileSnapshot = newSnapshot;
  }

  private async readRuleFiles() {
    const entries = await fs.readdir(this.rulesDir, { withFileTypes: true });
    const jsonlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));

    const files = await Promise.all(
      jsonlFiles.map(async (entry) => {
        const fullPath = path.join(this.rulesDir, entry.name);
        const stat = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, "utf8");
        const hash = crypto.createHash("md5").update(content).digest("hex");
        return {
          name: entry.name,
          fullPath,
          mtimeMs: stat.mtimeMs,
          hash,
          content,
        };
      }),
    );

    // keep deterministic order by filename to resolve same priority ties
    files.sort((a, b) => a.name.localeCompare(b.name));
    return files;
  }

  private merge(target: any, source: any, strategy: MergeStrategy) {
    if (strategy === "skip" && target !== undefined) {
      return target;
    }

    const hasExistingValue = (value: unknown) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
      return true;
    };

    if (Array.isArray(target) && Array.isArray(source)) {
      if (strategy === "replace" && hasExistingValue(target)) {
        return target;
      }
      if (!hasExistingValue(target)) {
        return [...source];
      }
      const set = new Set(target);
      source.forEach((item) => set.add(item));
      return Array.from(set);
    }

    if (typeof target === "object" && target !== null && typeof source === "object" && source !== null) {
      const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

      Object.entries(source).forEach(([key, value]) => {
        const existing = (result as any)[key];
        if (strategy === "replace" && hasExistingValue(existing)) {
          return;
        }
        if (!hasExistingValue(existing)) {
          result[key] = Array.isArray(value)
            ? [...value]
            : typeof value === "object" && value !== null
            ? this.merge({}, value, strategy)
            : value;
        } else {
          result[key] = this.merge(existing, value, strategy);
        }
      });

      return result;
    }

    if (strategy === "replace" && hasExistingValue(target)) {
      return target;
    }

    if (!hasExistingValue(target)) {
      return source;
    }

    return target;
  }

  private matches(rule: RuleDefinition, ctx: TContext): boolean {
    return Object.entries(rule.when ?? {}).every(([pathExpression, expected]) => {
      const actual = get(ctx, pathExpression);
      if (Array.isArray(expected)) {
        if (Array.isArray(actual)) {
          return expected.every((value) => actual.includes(value));
        }
        return expected.includes(actual);
      }
      if (typeof expected === "object" && expected !== null) {
        if (typeof actual !== "object" || actual === null) return false;
        return Object.entries(expected).every(([key, value]) =>
          this.matches(
            {
              id: rule.id,
              priority: rule.priority,
              when: { [key]: value },
              then: {},
            },
            actual as TContext,
          ),
        );
      }
      return actual === expected;
    });
  }

  async execute(ctx: TContext): Promise<RuleExecutionResult> {
    await this.ensureRulesLoaded();

    const result: Record<string, unknown> = {};
    const matchedRules: string[] = [];
    const context: Record<string, unknown> = { ...ctx };

    this.rules.forEach((rule) => {
      if (!this.matches(rule, context as TContext)) {
        return;
      }

      matchedRules.push(rule.id);
      const mergeStrategy: MergeStrategy = rule.merge ?? "append";
      Object.entries(rule.then ?? {}).forEach(([key, value]) => {
        const current = (result as any)[key];
        const mergedValue = this.merge(current, value, mergeStrategy);
        (result as any)[key] = mergedValue;
        context[key] = this.merge(context[key], value, mergeStrategy);
      });
    });

    return { result, matchedRules };
  }

  /**
   * Used in tests or when manually wanting to reload rules.
   */
  async reload() {
    this.fileSnapshot.clear();
    await this.ensureRulesLoaded();
  }

  /**
   * Export execution context for AI prompt (pre-reserved).
   */
  async exportContext(ctx: TContext) {
    const { result, matchedRules } = await this.execute(ctx);
    return { context: ctx, result, matchedRules };
  }
}

export function getDefaultRulesPath() {
  return path.join(process.cwd(), "src", "lib", "rules");
}


import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { RuleEngine } from "@/lib/rule-engine";

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "rules");

describe("RuleEngine", () => {
  let engine: RuleEngine;

  beforeEach(async () => {
    engine = new RuleEngine(fixtureDir);
    await engine.reload();
  });

  it("matches highest priority rule first", async () => {
    const { result, matchedRules } = await engine.execute({
      tongue: { color: "pale" },
    });
    expect(result.constitution).toBe("阳虚");
    expect(matchedRules[0]).toBe("test_tongue_pale");
  });

  it("falls back when no rule matches", async () => {
    const { result, matchedRules } = await engine.execute({
      tongue: { color: "unknown" },
    });
    expect(result.constitution).toBe("平和");
    expect(matchedRules).toContain("test_global_fallback");
  });

  it("appends advice arrays without duplicates", async () => {
    const { result } = await engine.execute({
      palm: { lines: { life: "deep" } },
    });

    expect(result.advice?.lifestyle).toEqual(["耐力训练", "晨练"]);
  });

  it("supports condition chaining across modules", async () => {
    const { result } = await engine.execute({
      tongue: { color: "red" },
      solar: { name: "夏至" },
    });

    expect(result.constitution).toBe("阴虚");
    expect(result.advice?.diet).toContain("银耳羹");
  });
});


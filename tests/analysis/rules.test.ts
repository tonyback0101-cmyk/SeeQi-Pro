import path from "node:path";
import { describe, expect, beforeAll, afterAll, it } from "vitest";
import { executeRules, reloadRules } from "@/lib/rules";

const fixtureRulesDir = path.join(process.cwd(), "tests", "fixtures", "rules");

describe("rules engine integration", () => {
  beforeAll(async () => {
    process.env.RULES_DIR_PATH = fixtureRulesDir;
    await reloadRules();
  });

  afterAll(async () => {
    delete process.env.RULES_DIR_PATH;
    await reloadRules();
  });

  it("applies matching rules in priority order", async () => {
    const { result, matchedRules } = await executeRules({
      tongue: { color: "pale" },
    });

    expect(result.constitution).toBe("阳虚");
    expect(result.advice?.diet).toEqual(["羊肉汤"]);
    expect(matchedRules[0]).toBe("test_tongue_pale");
  });

  it("falls back when no conditions match", async () => {
    const { result, matchedRules } = await executeRules({
      tongue: { color: "unknown" },
    });

    expect(result.constitution).toBe("平和");
    expect(result.advice?.lifestyle).toEqual(["保持节律"]);
    expect(matchedRules).toContain("test_global_fallback");
  });
});


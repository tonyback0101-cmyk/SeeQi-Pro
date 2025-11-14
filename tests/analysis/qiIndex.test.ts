import { describe, expect, it } from "vitest";
import { computeQiIndex } from "@/lib/analysis/qiIndex";

describe("computeQiIndex", () => {
  it("returns balanced scores with full inputs", () => {
    const result = computeQiIndex({
      constitution: "平和体质",
      palm: { qualityScore: 78, color: "pink", texture: "smooth" },
      tongue: { qualityScore: 72, color: "淡红", coating: "thin" },
      dream: { emotion: "希望", keywords: ["彩虹"] },
      solar: { element: "木", name: "立春" },
      matchedRules: ["palm_balance"],
    });

    expect(result.total).toBeGreaterThanOrEqual(70);
    expect(result.vitality).toBeGreaterThan(result.mindset);
    expect(result.level).toBe("high");
    expect(result.advice.length).toBeGreaterThan(0);
  });

  it("decreases when palm and tongue indicate deficiencies", () => {
    const result = computeQiIndex({
      constitution: "阳虚体质",
      palm: { qualityScore: 40, color: "pale", texture: "dry", lines: { heart: "broken" } },
      tongue: { qualityScore: 38, color: "pale", coating: "thick" },
      dream: { emotion: "焦虑" },
      solar: { element: "水" },
    });

    expect(result.total).toBeLessThan(60);
    expect(result.level).toBe("low");
    expect(result.trend).toBe("down");
    expect(result.advice.some((text) => text.includes("作息") || text.includes("保暖"))).toBeTruthy();
  });

  it("handles missing inputs with safe defaults", () => {
    const result = computeQiIndex({});
    expect(result.total).toBeGreaterThan(50);
    expect(result.level).toBe("medium");
  });
});


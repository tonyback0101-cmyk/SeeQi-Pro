import { describe, expect, it } from "vitest";
import { resolveSolarTermCode } from "@/lib/solar/resolve";

describe("resolveSolarTermCode", () => {
  it("returns lichun for early February dates", () => {
    const date = new Date(Date.UTC(2025, 1, 10));
    expect(resolveSolarTermCode(date)).toBe("lichun");
  });

  it("returns xiaohan for early January dates", () => {
    const date = new Date(Date.UTC(2025, 0, 6));
    expect(resolveSolarTermCode(date)).toBe("xiaohan");
  });

  it("returns dongzhi for late December dates", () => {
    const date = new Date(Date.UTC(2025, 11, 25));
    expect(resolveSolarTermCode(date)).toBe("dongzhi");
  });
});


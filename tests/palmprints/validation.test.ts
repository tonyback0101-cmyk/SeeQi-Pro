import { describe, expect, it } from "vitest";
import {
  ensureString,
  parseHandType,
  parsePalmRegion,
  parseQualityRatingEntry,
  parseQualityRatingValue,
  resolveImageExtension,
  normalizeFeaturePayloads,
  createPalmprintMetadata,
} from "../../src/lib/palmprints/validation";

describe("palmprints validation helpers", () => {
  it("should normalize string inputs", () => {
    expect(ensureString(" test ")).toBe("test");
    expect(ensureString("")).toBeNull();
    expect(ensureString("   ")).toBeNull();
    expect(ensureString(null)).toBeNull();
  });

  it("should parse valid hand type and palm region", () => {
    expect(parseHandType("left")).toBe("left");
    expect(parseHandType("right")).toBe("right");
    expect(parseHandType("invalid")).toBeNull();
    expect(parsePalmRegion("palm")).toBe("palm");
    expect(parsePalmRegion("full")).toBe("full");
    expect(parsePalmRegion("unknown")).toBeNull();
  });

  it("should parse quality rating from multiple inputs", () => {
    expect(parseQualityRatingEntry("3")).toBe(3);
    expect(parseQualityRatingEntry("5.2")).toBe(5);
    expect(parseQualityRatingEntry("0")).toBe(1);
    expect(parseQualityRatingEntry("  ")).toBeNull();
    expect(parseQualityRatingValue(4.6)).toBe(5);
    expect(parseQualityRatingValue("2")).toBe(2);
    expect(parseQualityRatingValue("abc")).toBeNull();
  });

  it("should resolve image extensions from mime type or file name", () => {
    expect(resolveImageExtension({ type: "image/png" })).toEqual({ ext: "png", mime: "image/png" });
    expect(resolveImageExtension({ name: "photo.jpeg" })).toEqual({ ext: "jpg", mime: "image/jpeg" });
    expect(resolveImageExtension({ name: "hand.HEIC" })).toEqual({ ext: "heic", mime: "image/heic" });
    expect(resolveImageExtension({})).toEqual({ ext: "jpg", mime: "image/jpeg" });
  });

  it("should validate and normalize feature payloads", () => {
    const { data, error } = normalizeFeaturePayloads("id-1", [
      { type: "mainLine", position: { x: 0.12, y: 0.34 }, description: "Main line" },
      { type: "wrinkle", position: { x: 0.56, y: 0.78 } },
    ]);
    expect(error).toBeUndefined();
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      palmprint_id: "id-1",
      feature_type: "mainLine",
      position_x: 0.12,
      position_y: 0.34,
      description: "Main line",
    });
  });

  it("should reject invalid feature payloads", () => {
    const invalidType = normalizeFeaturePayloads("id-1", [{ type: "unknown", position: { x: 0, y: 0 } }]);
    expect(invalidType.error).toMatch(/类型无效/);

    const invalidPosition = normalizeFeaturePayloads("id-1", [{ type: "mainLine", position: { x: "bad", y: 0 } }]);
    expect(invalidPosition.error).toMatch(/坐标无效/);
  });

  it("should merge palmprint metadata correctly", () => {
    const merged = createPalmprintMetadata({ existing: true, qualityRating: 3 }, { featuresCount: 5, qualityRating: 4 });
    expect(merged).toEqual({ existing: true, qualityRating: 4, featuresCount: 5 });

    const removed = createPalmprintMetadata({ qualityRating: 4 }, { featuresCount: 1, qualityRating: null });
    expect(removed).toEqual({ featuresCount: 1 });
  });
});



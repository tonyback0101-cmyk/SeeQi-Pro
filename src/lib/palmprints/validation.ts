import type { PalmHandType, PalmRegion, PalmFeatureType } from "@/types/palmprint";

export const PALM_BUCKET = "palmprints";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const HAND_TYPES: readonly PalmHandType[] = ["left", "right"];
const PALM_REGIONS: readonly PalmRegion[] = ["full", "palm", "fingers"];
const FEATURE_TYPES: readonly PalmFeatureType[] = ["mainLine", "wrinkle", "minutiae"];

export const HAND_TYPE_SET = new Set<PalmHandType>(HAND_TYPES);
export const PALM_REGION_SET = new Set<PalmRegion>(PALM_REGIONS);
export const FEATURE_TYPE_SET = new Set<PalmFeatureType>(FEATURE_TYPES);

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heic",
};

export function ensureString(entry: FormDataEntryValue | null | undefined): string | null {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export function parseHandType(entry: FormDataEntryValue | null | undefined): PalmHandType | null {
  const value = ensureString(entry);
  if (!value) return null;
  return HAND_TYPE_SET.has(value as PalmHandType) ? (value as PalmHandType) : null;
}

export function parsePalmRegion(entry: FormDataEntryValue | null | undefined): PalmRegion | null {
  const value = ensureString(entry);
  if (!value) return null;
  return PALM_REGION_SET.has(value as PalmRegion) ? (value as PalmRegion) : null;
}

export function parseQualityRatingEntry(entry: FormDataEntryValue | null | undefined): number | null {
  const value = ensureString(entry);
  if (!value) return null;
  return parseQualityRatingValue(value);
}

export function parseQualityRatingValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeRating(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return normalizeRating(numeric);
    }
  }
  return null;
}

function normalizeRating(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function resolveImageExtension(file: { type?: string; name?: string | null }): { ext: string; mime: string } {
  const type = typeof file.type === "string" ? file.type : "";
  const detected = CONTENT_TYPE_EXTENSION[type];
  if (detected) {
    return { ext: detected, mime: type };
  }

  const name = typeof file.name === "string" ? file.name : "";
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex > -1) {
    const ext = name.slice(dotIndex + 1).toLowerCase();
    if (["jpg", "jpeg", "png", "heic", "heif"].includes(ext)) {
      const normalizedExt = ext === "jpeg" ? "jpg" : ext;
      const mime =
        Object.entries(CONTENT_TYPE_EXTENSION).find(([, value]) => value === normalizedExt)?.[0] ??
        `image/${normalizedExt}`;
      return { ext: normalizedExt, mime };
    }
  }

  return { ext: "jpg", mime: "image/jpeg" };
}

export interface FeaturePayload {
  type?: string;
  position?: { x?: unknown; y?: unknown };
  description?: unknown;
  metadata?: unknown;
}

export interface NormalizedFeatureInsert {
  palmprint_id: string;
  feature_type: PalmFeatureType;
  position_x: number;
  position_y: number;
  description: string | null;
  metadata: Record<string, unknown>;
}

export function normalizeFeaturePayloads(
  palmprintId: string,
  features: FeaturePayload[]
): { data: NormalizedFeatureInsert[]; error?: string } {
  const data: NormalizedFeatureInsert[] = [];

  for (let index = 0; index < features.length; index += 1) {
    const feature = features[index] ?? {};
    const rawType = typeof feature.type === "string" ? feature.type.trim() : "";
    if (!FEATURE_TYPE_SET.has(rawType as PalmFeatureType)) {
      return { data: [], error: `掌纹特征第 ${index + 1} 项类型无效` };
    }

    const position = feature.position ?? {};
    const positionX = Number((position as { x?: unknown }).x);
    const positionY = Number((position as { y?: unknown }).y);
    if (!Number.isFinite(positionX) || !Number.isFinite(positionY)) {
      return { data: [], error: `掌纹特征第 ${index + 1} 项坐标无效` };
    }

    const description =
      typeof feature.description === "string" && feature.description.trim().length > 0
        ? feature.description.trim()
        : null;

    const metadata =
      feature.metadata && typeof feature.metadata === "object" && !Array.isArray(feature.metadata)
        ? (feature.metadata as Record<string, unknown>)
        : {};

    data.push({
      palmprint_id: palmprintId,
      feature_type: rawType as PalmFeatureType,
      position_x: positionX,
      position_y: positionY,
      description,
      metadata,
    });
  }

  return { data };
}

export function createPalmprintMetadata(
  existing: unknown,
  updates: { featuresCount: number; qualityRating: number | null }
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  base.featuresCount = updates.featuresCount;

  if (updates.qualityRating !== null) {
    base.qualityRating = updates.qualityRating;
  } else if ("qualityRating" in base) {
    delete base.qualityRating;
  }

  return base;
}



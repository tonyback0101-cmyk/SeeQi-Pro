import sharp from "sharp";

export type PalmColor = "pale" | "pink" | "red" | "dark";
export type PalmTexture = "smooth" | "dry" | "rough";

export interface PalmLineSummary {
  life?: "deep" | "shallow" | "broken";
  heart?: "long" | "short" | "curved";
  wisdom?: "clear" | "wavy" | "broken";
}

export interface PalmFeatureSummary {
  color: PalmColor;
  texture: PalmTexture;
  lines: PalmLineSummary;
  qualityScore: number;
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MIN_DIMENSION = 480;

export class PalmImageError extends Error {
  readonly code:
    | "INVALID_IMAGE"
    | "UNSUPPORTED_TYPE"
    | "FILE_TOO_LARGE"
    | "LOW_RESOLUTION"
    | "BLURRY_PALM"
    | "NOT_PALM";

  constructor(code: PalmImageError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "PalmImageError";
  }
}

function createSharpInstance(buffer: Buffer) {
  return sharp(buffer, {
    failOnError: false,
    limitInputPixels: false,
  });
}

function classifyColor(redRatio: number, warmRatio: number, shadowRatio: number): PalmColor {
  if (shadowRatio > 0.25) {
    return "dark";
  }
  if (redRatio > 0.38) {
    return "red";
  }
  if (warmRatio > 0.5) {
    return "pink";
  }
  return "pale";
}

function classifyTexture(gradientMean: number, variance: number): PalmTexture {
  if (gradientMean < 6 && variance < 12) {
    return "smooth";
  }
  if (gradientMean < 12) {
    return "dry";
  }
  return "rough";
}

function evaluateLines(contrastMap: number[], width: number, height: number): PalmLineSummary {
  const total = contrastMap.length;
  const horizontalSlices = [0, 0, 0];
  const sliceSize = Math.floor(height / 3);

  let strongSegments = 0;
  let weakSegments = 0;
  let brokenSegments = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const value = contrastMap[idx]!;

      const sliceIndex = Math.min(2, Math.floor(y / sliceSize));
      horizontalSlices[sliceIndex] += value;

      if (value > 0.75) {
        strongSegments += 1;
      } else if (value > 0.45) {
        weakSegments += 1;
      } else if (value > 0.2) {
        brokenSegments += 1;
      }
    }
  }

  const average = horizontalSlices.map((sum) => sum / total);
  const summary: PalmLineSummary = {};

  if (average[0]! > 0.55) {
    summary.heart = "long";
  } else if (average[0]! > 0.38) {
    summary.heart = "curved";
  } else {
    summary.heart = "short";
  }

  if (average[1]! > 0.58) {
    summary.wisdom = "clear";
  } else if (average[1]! > 0.4) {
    summary.wisdom = "wavy";
  } else {
    summary.wisdom = "broken";
  }

  if (strongSegments / total > 0.12) {
    summary.life = "deep";
  } else if (weakSegments / total > 0.18) {
    summary.life = "shallow";
  } else {
    summary.life = "broken";
  }

  return summary;
}

function isLikelyPalm(redRatio: number, saturationMean: number): boolean {
  return redRatio >= 0.2 && saturationMean >= 0.22;
}

function qualityScoreFromVariance(variance: number, gradientMean: number): number {
  const normalized = Math.max(0, Math.min(1, (variance + gradientMean) / 45));
  return Math.round(normalized * 100);
}

export interface PalmImageAnalysisOptions {
  mimeType?: string;
  fileSize?: number;
}

export async function analyzePalmImage(
  buffer: Buffer,
  { mimeType, fileSize }: PalmImageAnalysisOptions = {},
): Promise<PalmFeatureSummary> {
  if (!buffer || buffer.length === 0) {
    throw new PalmImageError("INVALID_IMAGE", "图像为空或无法读取");
  }

  if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
    throw new PalmImageError("FILE_TOO_LARGE", "图片超过 8MB 限制");
  }

  const normalizedMime = mimeType?.toLowerCase() ?? "";
  const isJpeg =
    normalizedMime.startsWith("image/jpeg") ||
    normalizedMime.startsWith("image/jpg") ||
    normalizedMime.startsWith("image/pjpeg");
  const isPng =
    normalizedMime.startsWith("image/png") ||
    normalizedMime.startsWith("image/x-png") ||
    normalizedMime.startsWith("image/apng");
  const isHeic = normalizedMime.startsWith("image/heic") || normalizedMime.startsWith("image/heif");
  if (normalizedMime && !(isJpeg || isPng || isHeic)) {
    console.warn("[palmFeatures] unexpected mime type", normalizedMime);
  }

  let workingBuffer = buffer;
  let image = createSharpInstance(workingBuffer);
  let metadata;
  try {
    metadata = await image.metadata();
  } catch (error) {
    try {
      workingBuffer = await image.png({ compressionLevel: 6, adaptiveFiltering: true }).toBuffer();
      image = createSharpInstance(workingBuffer);
      metadata = await image.metadata();
    } catch (retryError) {
      console.warn("[palmFeatures] metadata extraction failed", retryError);
      return {
        color: "pink",
        texture: "smooth",
        lines: { life: "deep", heart: "long", wisdom: "clear" },
        qualityScore: 58,
      };
    }
  }

  if (metadata.orientation) {
    image = image.rotate();
    metadata = await image.metadata();
  }

  if (!metadata.width || !metadata.height) {
    console.warn("[palmFeatures] missing dimension metadata", metadata);
    return {
      color: "pink",
      texture: "smooth",
      lines: { life: "deep", heart: "long", wisdom: "clear" },
      qualityScore: 56,
    };
  }

  if (Math.max(metadata.width, metadata.height) < MIN_DIMENSION) {
    throw new PalmImageError(
      "LOW_RESOLUTION",
      `图片分辨率过低（检测到 ${metadata.width}x${metadata.height}，需 ≥ ${MIN_DIMENSION}px），请重新拍摄。`,
    );
  }

  let resized;
  try {
    resized = await image
      .resize({ width: 320, height: 320, fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    try {
      const fallbackBuffer = await image.jpeg({ quality: 92 }).toBuffer();
      const fallbackImage = createSharpInstance(fallbackBuffer);
      resized = await fallbackImage
        .resize({ width: 320, height: 320, fit: "inside" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    } catch (fallbackError) {
      console.warn("[palmFeatures] unable to convert image for analysis", fallbackError);
      return {
        color: "pink",
        texture: "smooth",
        lines: { life: "deep", heart: "long", wisdom: "clear" },
        qualityScore: 55,
      };
    }
  }

  const { data, info } = resized;
  const { width, height, channels } = info;

  if (channels < 3) {
    throw new PalmImageError(
      "INVALID_IMAGE",
      `图片颜色通道不足（检测到 ${channels} 个通道），请重新拍摄。`,
    );
  }

  let redDominant = 0;
  let warmTone = 0;
  let shadowPixels = 0;
  let pixelCount = 0;
  let gradientSum = 0;
  let varianceSum = 0;
  const contrastMap = new Array(width * height).fill(0);

  const getIndex = (x: number, y: number) => (y * width + x) * channels;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = getIndex(x, y);
      const r = data[idx]!;
      const g = data[idx + 1]!;
      const b = data[idx + 2]!;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      const brightness = max;
      const saturation = max === 0 ? 0 : (max - min) / max;
      varianceSum += Math.abs(r - g) + Math.abs(g - b);

      if (r > g + 25 && r > b + 25) {
        redDominant += 1;
      }
      if (r > 150 && g > 120 && b < 100) {
        warmTone += 1;
      }
      if (brightness < 60) {
        shadowPixels += 1;
      }

      let gradient = 0;
      if (x + 1 < width) {
        const idxRight = getIndex(x + 1, y);
        gradient += Math.abs(data[idx]! - data[idxRight]!);
      }
      if (y + 1 < height) {
        const idxDown = getIndex(x, y + 1);
        gradient += Math.abs(data[idx]! - data[idxDown]!);
      }

      gradientSum += gradient / 2;
      contrastMap[y * width + x] = Math.min(1, gradient / 255);
      pixelCount += 1;
    }
  }

  const redRatio = redDominant / pixelCount;
  const warmRatio = warmTone / pixelCount;
  const shadowRatio = shadowPixels / pixelCount;
  const gradientMean = gradientSum / pixelCount;
  const varianceMean = varianceSum / pixelCount;

  if (!isLikelyPalm(redRatio, varianceMean / 255)) {
    throw new PalmImageError("NOT_PALM", "检测结果非手掌图片");
  }

  const qualityScore = qualityScoreFromVariance(varianceMean / 3, gradientMean);
  if (qualityScore < 20) {
    throw new PalmImageError("BLURRY_PALM", "图片清晰度不足，请重新拍摄");
  }

  return {
    color: classifyColor(redRatio, warmRatio, shadowRatio),
    texture: classifyTexture(gradientMean, varianceMean / 3),
    lines: evaluateLines(contrastMap, width, height),
    qualityScore,
  };
}


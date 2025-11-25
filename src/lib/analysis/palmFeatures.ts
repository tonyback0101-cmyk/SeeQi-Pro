import jimp from "jimp";

export type PalmColor = "pale" | "pink" | "red" | "dark";
export type PalmTexture = "smooth" | "dry" | "rough";

export interface PalmLineSummary {
  life?: "deep" | "shallow" | "broken";
  heart?: "long" | "short" | "curved";
  wisdom?: "clear" | "wavy" | "broken";
  wealth?: string;
}

export interface PalmFeatureSummary {
  color: PalmColor;
  texture: PalmTexture;
  lines: PalmLineSummary;
  qualityScore: number;
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MIN_DIMENSION = 480;
const TARGET_SIZE = 320;

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
  // 放宽检测条件，兼容不同肤色与光照：
  // 1) 任一指标达到较低阈值即可；或
  // 2) 二者加权后达到综合阈值
  //
  // 经验值说明：
  // - 某些偏冷光/偏黄光下，单看 redRatio 或 saturation 都会偏低
  // - 将阈值由 0.15 降到 0.08，并加入综合阈值可显著降低误判
  const singleOk = redRatio >= 0.08 || saturationMean >= 0.08;
  const combinedOk = redRatio + saturationMean >= 0.18;
  return singleOk || combinedOk;
}

function qualityScoreFromVariance(variance: number, gradientMean: number): number {
  const normalized = Math.max(0, Math.min(1, (variance + gradientMean) / 45));
  return Math.round(normalized * 100);
}

export interface PalmImageAnalysisOptions {
  mimeType?: string;
  fileSize?: number;
}

async function readImage(buffer: Buffer) {
  try {
    return await jimp.read(buffer);
  } catch (error) {
    console.warn("[palmFeatures] unable to read image", error);
    throw new PalmImageError("INVALID_IMAGE", "图像格式不受支持或已损坏");
  }
}

function normalizeDimensions(image: jimp) {
  const { width, height } = image.bitmap;
  if (!width || !height) {
    throw new PalmImageError("INVALID_IMAGE", "无法解析图片尺寸");
  }
  if (Math.max(width, height) < MIN_DIMENSION) {
    throw new PalmImageError(
      "LOW_RESOLUTION",
      `图片分辨率过低（检测到 ${width}x${height}，需 ≥ ${MIN_DIMENSION}px），请重新拍摄。`,
    );
  }
}

function resizeImage(image: jimp) {
  const { width, height } = image.bitmap;
  const scale = Math.min(1, TARGET_SIZE / Math.max(width, height));
  const resized = image
    .clone()
    .resize(Math.max(1, Math.round(width * scale)), jimp.AUTO, jimp.RESIZE_BICUBIC)
    .contain(TARGET_SIZE, TARGET_SIZE, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE)
    .rgba(true);
  return resized;
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
  const isSupportedMime =
    !normalizedMime ||
    normalizedMime.startsWith("image/jpeg") ||
    normalizedMime.startsWith("image/jpg") ||
    normalizedMime.startsWith("image/pjpeg") ||
    normalizedMime.startsWith("image/png") ||
    normalizedMime.startsWith("image/x-png") ||
    normalizedMime.startsWith("image/apng") ||
    normalizedMime.startsWith("image/heic") ||
    normalizedMime.startsWith("image/heif");
  if (!isSupportedMime) {
    console.warn("[palmFeatures] unexpected mime type", normalizedMime);
  }

  const baseImage = await readImage(buffer);
  normalizeDimensions(baseImage);
  const resizedImage = resizeImage(baseImage);
  const { data, width, height } = resizedImage.bitmap;
  const channels = 4;
  if (!data || data.length < width * height * channels) {
    throw new PalmImageError("INVALID_IMAGE", "图片像素数据有误");
  }

  let redDominant = 0;
  let warmTone = 0;
  let shadowPixels = 0;
  let pixelCount = 0;
  let gradientSum = 0;
  let varianceSum = 0;
  let saturationSum = 0;
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
      saturationSum += saturation;
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
  const saturationMean = saturationSum / pixelCount;

  if (!isLikelyPalm(redRatio, saturationMean)) {
    // 不再直接中断，返回一个“低置信度”的结果以避免阻塞流程
    // 下游可根据 qualityScore 或 tags 决定是否提示用户重拍
    const fallbackQuality = 20;
    return {
      color: classifyColor(redRatio, warmRatio, shadowRatio),
      texture: classifyTexture(gradientMean, varianceMean / 3),
      lines: evaluateLines(contrastMap, width, height),
      qualityScore: fallbackQuality,
    };
  }

  const qualityScore = qualityScoreFromVariance(varianceMean / 3, gradientMean);
  // 降低阈值从 20 到 15，以适应不同拍摄条件和设备
  // 同时添加调试信息，帮助用户了解图片质量
  if (qualityScore < 15) {
    throw new PalmImageError("BLURRY_PALM", "图片清晰度不足，请重新拍摄");
  }

  return {
    color: classifyColor(redRatio, warmRatio, shadowRatio),
    texture: classifyTexture(gradientMean, varianceMean / 3),
    lines: evaluateLines(contrastMap, width, height),
    qualityScore,
  };
}


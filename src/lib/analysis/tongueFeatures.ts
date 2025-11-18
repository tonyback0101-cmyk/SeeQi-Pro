import jimp from "jimp";

export type TongueColor = "pale" | "red" | "purple";
export type TongueCoating = "thin" | "thick" | "white" | "yellow" | "none";
export type TongueTexture = "smooth" | "moist" | "cracked";

export interface TongueFeatureSummary {
  color: TongueColor;
  coating: TongueCoating;
  texture: TongueTexture;
  qualityScore: number;
}

export class TongueImageError extends Error {
  readonly code:
    | "INVALID_IMAGE"
    | "UNSUPPORTED_TYPE"
    | "FILE_TOO_LARGE"
    | "LOW_RESOLUTION"
    | "BLURRY_TONGUE"
    | "NOT_TONGUE";

  constructor(code: TongueImageError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "TongueImageError";
  }
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MIN_DIMENSION = 480;
const TARGET_SIZE = 256;

function classifyColor(redRatio: number, purpleRatio: number, whitenessRatio: number): TongueColor {
  if (purpleRatio >= 0.18) {
    return "purple";
  }
  if (whitenessRatio >= 0.4 || redRatio < 0.25) {
    return "pale";
  }
  return "red";
}

function classifyCoating(whitenessRatio: number, yellowRatio: number): TongueCoating {
  if (yellowRatio >= 0.22) {
    return "yellow";
  }
  if (whitenessRatio >= 0.6) {
    return "thick";
  }
  if (whitenessRatio >= 0.4) {
    return "white";
  }
  if (whitenessRatio >= 0.22) {
    return "thin";
  }
  return "none";
}

function classifyTexture(gradientMean: number): TongueTexture {
  if (gradientMean < 9) {
    return "smooth";
  }
  if (gradientMean < 18) {
    return "moist";
  }
  return "cracked";
}

function isLikelyTongue(redRatio: number, yellowRatio: number, purpleRatio: number): boolean {
  const warmDominance = redRatio + yellowRatio;
  return warmDominance >= 0.25 || purpleRatio >= 0.15;
}

function toQualityScore(gradientMean: number): number {
  const normalized = Math.max(0, Math.min(1, gradientMean / 25));
  return Math.round(normalized * 100);
}

export interface TongueImageAnalysisOptions {
  mimeType?: string;
  fileSize?: number;
}

async function readImage(buffer: Buffer) {
  try {
    return await jimp.read(buffer);
  } catch (error) {
    console.warn("[tongueFeatures] unable to read image", error);
    throw new TongueImageError("INVALID_IMAGE", "图像格式不受支持或已损坏");
  }
}

function ensureDimensions(image: jimp) {
  const { width, height } = image.bitmap;
  if (!width || !height) {
    throw new TongueImageError("INVALID_IMAGE", "无法解析图片尺寸");
  }
  if (Math.max(width, height) < MIN_DIMENSION) {
    throw new TongueImageError(
      "LOW_RESOLUTION",
      `图片分辨率过低（检测到 ${width}x${height}，需 ≥ ${MIN_DIMENSION}px），请重新拍摄。`,
    );
  }
}

function resizeImage(image: jimp) {
  const { width, height } = image.bitmap;
  const scale = Math.min(1, TARGET_SIZE / Math.max(width, height));
  return image
    .clone()
    .resize(Math.max(1, Math.round(width * scale)), jimp.AUTO, jimp.RESIZE_BICUBIC)
    .contain(TARGET_SIZE, TARGET_SIZE, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE)
    .rgba(true);
}

export async function analyzeTongueImage(
  buffer: Buffer,
  { mimeType, fileSize }: TongueImageAnalysisOptions = {},
): Promise<TongueFeatureSummary> {
  if (!buffer || buffer.length === 0) {
    throw new TongueImageError("INVALID_IMAGE", "图像为空或无法读取");
  }

  if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
    throw new TongueImageError("FILE_TOO_LARGE", "图片超过 8MB 限制");
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
    console.warn("[tongueFeatures] unexpected mime type", normalizedMime);
  }

  const baseImage = await readImage(buffer);
  ensureDimensions(baseImage);
  const resizedImage = resizeImage(baseImage);
  const { data, width, height } = resizedImage.bitmap;
  const channels = 4;
  if (!data || data.length < width * height * channels) {
    throw new TongueImageError("INVALID_IMAGE", "图片像素数据有误");
  }

  let redDominantPixels = 0;
  let purplePixels = 0;
  let whitePixels = 0;
  let yellowPixels = 0;
  let totalPixels = 0;
  let gradientAccum = 0;

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

      if (r > g + 25 && r > b + 25) {
        redDominantPixels += 1;
      }

      if (r > 120 && b > 110 && (r - g) < 20) {
        purplePixels += 1;
      }

      if (brightness > 210 && saturation < 0.25) {
        whitePixels += 1;
      }

      if (r > 180 && g > 170 && b < 140) {
        yellowPixels += 1;
      }

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let gradient = 0;
      if (x + 1 < width) {
        const idxRight = getIndex(x + 1, y);
        const grayRight =
          0.299 * data[idxRight]! + 0.587 * data[idxRight + 1]! + 0.114 * data[idxRight + 2]!;
        gradient += Math.abs(gray - grayRight);
      }
      if (y + 1 < height) {
        const idxDown = getIndex(x, y + 1);
        const grayDown =
          0.299 * data[idxDown]! + 0.587 * data[idxDown + 1]! + 0.114 * data[idxDown + 2]!;
        gradient += Math.abs(gray - grayDown);
      }

      gradientAccum += gradient / 2;
      totalPixels += 1;
    }
  }

  const redRatio = redDominantPixels / totalPixels;
  const purpleRatio = purplePixels / totalPixels;
  const whitenessRatio = whitePixels / totalPixels;
  const yellowRatio = yellowPixels / totalPixels;
  const gradientMean = gradientAccum / totalPixels;

  if (!isLikelyTongue(redRatio, yellowRatio, purpleRatio)) {
    throw new TongueImageError("NOT_TONGUE", "检测结果非舌象图片");
  }

  const qualityScore = toQualityScore(gradientMean);
  if (qualityScore < 12) {
    throw new TongueImageError("BLURRY_TONGUE", "图片清晰度不足，请重新拍摄");
  }

  return {
    color: classifyColor(redRatio, purpleRatio, whitenessRatio),
    coating: classifyCoating(whitenessRatio, yellowRatio),
    texture: classifyTexture(gradientMean),
    qualityScore,
  };
}


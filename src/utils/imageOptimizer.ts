type NetworkCondition = "offline" | "slow" | "moderate" | "fast";

export type OptimizeOptions = {
  src: string;
  width?: number;
  height?: number;
  cacheKey?: string;
  preferWebP?: boolean;
  quality?: number;
};

export type ProgressiveImage = {
  placeholderSrc: string;
  finalSrc: string;
};

const memoryCache = new Map<string, string>();

async function detectWebPSupport() {
  if (typeof window === "undefined") {
    return false;
  }
  if ((window as typeof window & { __seeqiWebPSupport?: boolean }).__seeqiWebPSupport !== undefined) {
    return (window as typeof window & { __seeqiWebPSupport?: boolean }).__seeqiWebPSupport!;
  }

  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const supported = img.width > 0 && img.height > 0;
      (window as typeof window & { __seeqiWebPSupport?: boolean }).__seeqiWebPSupport = supported;
      resolve(supported);
    };
    img.onerror = () => {
      (window as typeof window & { __seeqiWebPSupport?: boolean }).__seeqiWebPSupport = false;
      resolve(false);
    };
    img.src =
      "data:image/webp;base64,UklGRiIAAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
  });
}

function getNetworkCondition(): NetworkCondition {
  if (typeof navigator === "undefined" || !(navigator as Navigator & { connection?: any }).connection) {
    return "moderate";
  }

  const connection = (navigator as Navigator & { connection?: any }).connection;
  const effectiveType = connection.effectiveType as string | undefined;

  if (!effectiveType) {
    return "moderate";
  }

  if (connection.saveData) {
    return "slow";
  }

  switch (effectiveType) {
    case "slow-2g":
    case "2g":
      return "slow";
    case "3g":
      return "moderate";
    case "4g":
    default:
      return "fast";
  }
}

function deriveQuality(userQuality?: number) {
  if (userQuality) {
    return userQuality;
  }
  const network = getNetworkCondition();
  if (network === "offline") return 0.4;
  if (network === "slow") return 0.45;
  if (network === "moderate") return 0.65;
  return 0.8;
}

async function fetchAsBlob(src: string) {
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  return await response.blob();
}

async function blobToCanvas(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get canvas context");
  }
  context.drawImage(bitmap, 0, 0);
  return { canvas, bitmap };
}

async function encodeToDataUrl(
  canvas: HTMLCanvasElement,
  {
    type,
    quality,
    width,
    height,
  }: { type: "image/webp" | "image/jpeg"; quality: number; width?: number; height?: number }
) {
  let renderCanvas = canvas;
  if (width || height) {
    const targetCanvas = document.createElement("canvas");
    const ratio = canvas.width / canvas.height;
    let targetWidth = width ?? canvas.width;
    let targetHeight = height ?? canvas.height;
    if (!width && height) {
      targetWidth = height * ratio;
    }
    if (!height && width) {
      targetHeight = width / ratio;
    }
    targetCanvas.width = Math.floor(targetWidth);
    targetCanvas.height = Math.floor(targetHeight);
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to resize canvas");
    }
    ctx.drawImage(canvas, 0, 0, targetCanvas.width, targetCanvas.height);
    renderCanvas = targetCanvas;
  }

  return await new Promise<string>((resolve, reject) => {
    renderCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      type,
      quality
    );
  });
}

async function cacheInStorage(key: string, dataUrl: string) {
  try {
    memoryCache.set(key, dataUrl);
    if (typeof caches === "undefined") {
      return;
    }
    const cache = await caches.open("seeqi-image-cache");
    const response = new Response(dataUrl);
    await cache.put(new Request(`/__seeqi_cached__/${key}`), response);
  } catch {
    // fall back silently
  }
}

export async function getCachedImage(key: string) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  if (typeof caches === "undefined") {
    return undefined;
  }
  try {
    const cache = await caches.open("seeqi-image-cache");
    const response = await cache.match(`/__seeqi_cached__/${key}`);
    if (!response) {
      return undefined;
    }
    const data = await response.text();
    memoryCache.set(key, data);
    return data;
  } catch {
    return undefined;
  }
}

export async function optimizeImage(options: OptimizeOptions): Promise<string> {
  if (typeof window === "undefined") {
    return options.src;
  }

  const cacheKey = options.cacheKey ?? `${options.src}_${options.width ?? "auto"}_${options.height ?? "auto"}`;
  const cached = await getCachedImage(cacheKey);
  if (cached) {
    return cached;
  }

  const blob = await fetchAsBlob(options.src);
  const { canvas, bitmap } = await blobToCanvas(blob);

  const prefersWebP = options.preferWebP ?? (await detectWebPSupport());
  const targetType = prefersWebP ? "image/webp" : "image/jpeg";

  const quality = deriveQuality(options.quality);
  const dataUrl = await encodeToDataUrl(canvas, {
    type: targetType,
    quality,
    width: options.width,
    height: options.height,
  });

  bitmap.close();
  canvas.width = 0;
  canvas.height = 0;

  await cacheInStorage(cacheKey, dataUrl);
  return dataUrl;
}

export async function loadProgressiveImage(options: OptimizeOptions): Promise<ProgressiveImage> {
  if (typeof window === "undefined") {
    return { placeholderSrc: options.src, finalSrc: options.src };
  }

  const blob = await fetchAsBlob(options.src);
  const { canvas, bitmap } = await blobToCanvas(blob);

  const placeholderUrl = await encodeToDataUrl(canvas, {
    type: "image/jpeg",
    quality: 0.2,
    width: 24,
    height: 24,
  });

  const finalUrl = await optimizeImage(options);

  bitmap.close();
  canvas.width = 0;
  canvas.height = 0;

  return {
    placeholderSrc: placeholderUrl,
    finalSrc: finalUrl,
  };
}

export async function loadImageInChunks(
  src: string,
  chunkSize = 256 * 1024,
  onChunk?: (chunk: ArrayBuffer, index: number) => void
) {
  if (typeof fetch === "undefined") {
    return await fetchAsBlob(src);
  }

  const response = await fetch(src);
  if (!response.body) {
    return await response.blob();
  }

  const reader = response.body.getReader();
  let received = 0;
  let chunks: Uint8Array[] = [];
  let chunkIndex = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.length;
      chunks.push(value);
      if (received >= chunkSize) {
        const combined = concatChunks(chunks);
        onChunk?.(combined.buffer.slice(0), chunkIndex++);
        received = 0;
        chunks = [];
      }
    }
  }

  if (chunks.length) {
    const combined = concatChunks(chunks);
    onChunk?.(combined.buffer.slice(0), chunkIndex);
  }

  const finalChunks = await fetchAsBlob(src);
  return finalChunks;
}

function concatChunks(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export default {
  optimizeImage,
  loadProgressiveImage,
  loadImageInChunks,
  getCachedImage,
};


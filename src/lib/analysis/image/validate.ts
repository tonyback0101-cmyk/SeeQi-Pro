type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "too_small" | "too_low_resolution" | "unknown";
    };

export async function validateImageQuality(file: File): Promise<ValidationResult> {
  try {
    if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
      return { ok: true };
    }

    const blob = file.type ? file : new File([file], `${file.name || "image"}.jpg`, { type: "image/jpeg" });
    const bitmap = await createImageBitmap(blob);

    if (bitmap.width < 400 || bitmap.height < 400) {
      return { ok: false, reason: "too_small" };
    }

    if (file.size < 50_000) {
      return { ok: false, reason: "too_low_resolution" };
    }

    bitmap.close?.();
    return { ok: true };
  } catch {
    return { ok: false, reason: "unknown" };
  }
}

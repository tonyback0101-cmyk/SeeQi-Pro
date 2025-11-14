type PalmEvent = {
  action: "upload" | "offline_queue" | "sync_success" | "sync_failure";
  palmprintId?: string | null;
  details?: Record<string, unknown>;
};

function resolveBaseUrl(): string | null {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  if (typeof process !== "undefined") {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
    if (base) {
      return base.replace(/\/$/, "");
    }
  }
  return null;
}

export async function logPalmEvent(event: PalmEvent) {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return;
  }

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    if (typeof console !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("skip palm log: missing base URL");
    }
    return;
  }

  try {
    await fetch(new URL("/api/palmprints/log", baseUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      credentials: "include",
    });
  } catch (error) {
    console.warn("Failed to log palm event", error);
  }
}

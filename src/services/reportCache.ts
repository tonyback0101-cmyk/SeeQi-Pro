"use client";

const REPORT_CACHE_KEY = "seeqi:cachedReport";

export type CachedReport = {
  id: string;
  locale: string;
  payload: unknown;
  savedAt: number;
};

export function saveLatestReport(report: CachedReport) {
  try {
    localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(report));
  } catch {
    // ignore quota errors
  }
}

export function getLatestReport(): CachedReport | null {
  try {
    const raw = localStorage.getItem(REPORT_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedReport;
  } catch {
    return null;
  }
}


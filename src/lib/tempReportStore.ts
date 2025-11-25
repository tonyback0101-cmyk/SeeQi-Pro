const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

type Locale = "zh" | "en";

type StoredReportPayload = {
  id: string;
  constitution: string | null;
  palm_result: any;
  tongue_result: any;
  dream: any;
  advice: any;
  solar_term: string | null;
  solar?: any;
  tags?: string[];
  quote: string | null;
  created_at: string | null;
  unlocked: boolean;
  locale: Locale;
  qi_index: unknown;
  matched_rules?: string[];
  session_id?: string | null;
};

type StoredReport = {
  report: StoredReportPayload;
  constitution_detail?: unknown;
  createdAt: number;
};

const store = new Map<string, StoredReport>();

function cleanup(ttl = DEFAULT_TTL_MS) {
  const now = Date.now();
  Array.from(store.entries()).forEach(([id, entry]) => {
    if (now - entry.createdAt > ttl) {
      store.delete(id);
    }
  });
}

export function saveTemporaryReport(entry: {
  report: StoredReportPayload;
  constitution_detail?: unknown;
}) {
  const ttl = Number(process.env.TEMP_REPORT_TTL_MS ?? DEFAULT_TTL_MS);
  cleanup(ttl);
  const reportId = entry.report.id;
  store.set(reportId, {
    report: entry.report,
    constitution_detail: entry.constitution_detail,
    createdAt: Date.now(),
  });
  console.log(`[tempReportStore] Saved report: ${reportId}, store size: ${store.size}`);
}

export function getTemporaryReport(id: string) {
  const ttl = Number(process.env.TEMP_REPORT_TTL_MS ?? DEFAULT_TTL_MS);
  cleanup(ttl);
  const entry = store.get(id);
  if (!entry) {
    console.warn(`[tempReportStore] Report not found: ${id}, store size: ${store.size}, available IDs: ${Array.from(store.keys()).slice(0, 5).join(", ")}`);
    return null;
  }
  const age = Date.now() - entry.createdAt;
  if (age > ttl) {
    console.warn(`[tempReportStore] Report expired: ${id}, age: ${Math.round(age / 1000)}s, ttl: ${Math.round(ttl / 1000)}s`);
    store.delete(id);
    return null;
  }
  console.log(`[tempReportStore] Retrieved report: ${id}, age: ${Math.round(age / 1000)}s`);
  return entry;
}


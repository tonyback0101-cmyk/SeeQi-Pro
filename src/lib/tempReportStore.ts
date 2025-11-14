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
  store.set(entry.report.id, {
    report: entry.report,
    constitution_detail: entry.constitution_detail,
    createdAt: Date.now(),
  });
}

export function getTemporaryReport(id: string) {
  const ttl = Number(process.env.TEMP_REPORT_TTL_MS ?? DEFAULT_TTL_MS);
  cleanup(ttl);
  const entry = store.get(id);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > ttl) {
    store.delete(id);
    return null;
  }
  return entry;
}


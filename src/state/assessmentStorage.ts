import type {
  AssessmentModule,
  ModuleStatus,
  ModuleDataMap,
  DreamRecordData,
  PalmRecordData,
  TongueRecordData,
  FengshuiRecordData,
  IChingRecordData,
} from "@/types/assessment";

const STORAGE_KEY_STATUS = "seeqi-assessment-status";
const STORAGE_KEY_DATA = "seeqi-assessment-data";

type StatusRecord = Record<AssessmentModule, ModuleStatus>;

const defaultStatus: StatusRecord = {
  palm: "not_started",
  tongue: "not_started",
  dream: "not_started",
  fengshui: "not_started",
  iching: "not_started",
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadStatuses(): StatusRecord {
  if (typeof window === "undefined") {
    return defaultStatus;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY_STATUS);
  return { ...defaultStatus, ...safeParse<Partial<StatusRecord>>(raw, {}) };
}

export function saveStatus(module: AssessmentModule, status: ModuleStatus) {
  if (typeof window === "undefined") return;
  const current = loadStatuses();
  const next = { ...current, [module]: status };
  window.localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(next));
}

export function loadData(): ModuleDataMap {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(STORAGE_KEY_DATA);
  return safeParse<ModuleDataMap>(raw, {});
}

function saveDataMap(data: ModuleDataMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
}

export function saveDreamData(payload: DreamRecordData) {
  const existing = loadData();
  saveDataMap({ ...existing, dream: payload });
  saveStatus("dream", "completed");
}

export function savePalmData(payload: PalmRecordData) {
  const existing = loadData();
  saveDataMap({ ...existing, palm: payload });
  saveStatus("palm", "completed");
}

export function saveTongueData(payload: TongueRecordData) {
  const existing = loadData();
  saveDataMap({ ...existing, tongue: payload });
  saveStatus("tongue", "completed");
}

export function saveFengshuiData(payload: FengshuiRecordData) {
  const existing = loadData();
  saveDataMap({ ...existing, fengshui: payload });
  saveStatus("fengshui", "completed");
}

export function saveIChingData(payload: IChingRecordData) {
  const existing = loadData();
  saveDataMap({ ...existing, iching: payload });
  saveStatus("iching", "completed");
}

export function markSkipped(module: AssessmentModule) {
  saveStatus(module, "skipped");
}

export function markInProgress(module: AssessmentModule) {
  saveStatus(module, "in_progress");
}

export function resetStatus(module: AssessmentModule) {
  saveStatus(module, "not_started");
}

export function exportAssessmentSnapshot() {
  const statuses = loadStatuses();
  const data = loadData();
  return { statuses, data };
}



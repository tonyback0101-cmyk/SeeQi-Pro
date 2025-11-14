"use client";

import { optimizeImage } from "@/utils/imageOptimizer";

type Payload = Record<string, unknown>;

type OfflineReport = {
  id: string;
  generatedAt: number;
  payload: Payload;
};

type OfflinePhoto = {
  id: string;
  capturedAt: number;
  imageUrl: string;
  metadata?: Payload;
};

export type SyncConflictStrategy = "client-wins" | "server-wins" | "merge";

type OfflineServiceOptions = {
  maxReports?: number;
  photoUploadEndpoint?: string;
  conflictStrategy?: SyncConflictStrategy;
  onSyncProgress?: (status: { stage: string; success: boolean; detail?: string }) => void;
  onNetworkChange?: (isOnline: boolean) => void;
};

const REPORT_STORAGE_KEY = "seeqi:offline:reports";
const PHOTO_QUEUE_KEY = "seeqi:offline:photoQueue";
const STATE_STORAGE_KEY = "seeqi:offline:state";
const DATA_STORAGE_KEY = "seeqi:offline:data";

const defaultOptions: Required<Pick<OfflineServiceOptions, "maxReports" | "conflictStrategy">> = {
  maxReports: 5,
  conflictStrategy: "merge",
};

function getStorage() {
  if (typeof localStorage === "undefined") {
    return {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {},
      removeItem: (_key: string) => {},
    };
  }
  return localStorage;
}

function getNavigator(): Navigator | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator;
}

class OfflineService {
  private options: Required<OfflineServiceOptions>;
  private isSyncing = false;

  constructor(options: OfflineServiceOptions = {}) {
    this.options = {
      maxReports: options.maxReports ?? defaultOptions.maxReports,
      photoUploadEndpoint: options.photoUploadEndpoint ?? "/api/upload",
      conflictStrategy: options.conflictStrategy ?? defaultOptions.conflictStrategy,
      onSyncProgress: options.onSyncProgress ?? (() => {}),
      onNetworkChange: options.onNetworkChange ?? (() => {}),
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.options.onNetworkChange(true);
    this.flushPhotoQueue();
  };

  private handleOffline = () => {
    this.options.onNetworkChange(false);
  };

  get isOnline() {
    const nav = getNavigator();
    if (!nav) return true;
    return nav.onLine ?? true;
  }

  private readReports(): OfflineReport[] {
    const storage = getStorage();
    try {
      const raw = storage.getItem(REPORT_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as OfflineReport[];
    } catch {
      return [];
    }
  }

  private writeReports(reports: OfflineReport[]) {
    const storage = getStorage();
    try {
      storage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports.slice(0, this.options.maxReports)));
    } catch {
      // ignore
    }
  }

  private readPhotoQueue(): OfflinePhoto[] {
    const storage = getStorage();
    try {
      const raw = storage.getItem(PHOTO_QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as OfflinePhoto[];
    } catch {
      return [];
    }
  }

  private writePhotoQueue(queue: OfflinePhoto[]) {
    const storage = getStorage();
    try {
      storage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }

  private readState(): Payload {
    const storage = getStorage();
    try {
      const raw = storage.getItem(STATE_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Payload;
    } catch {
      return {};
    }
  }

  private writeState(state: Payload) {
    const storage = getStorage();
    try {
      storage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  async saveReport(report: OfflineReport) {
    const reports = this.readReports();
    const existingIndex = reports.findIndex((item) => item.id === report.id);
    if (existingIndex >= 0) {
      reports.splice(existingIndex, 1);
    }
    reports.unshift(report);
    this.writeReports(reports);
  }

  getReports() {
    return this.readReports();
  }

  clearReports() {
    const storage = getStorage();
    storage.removeItem(REPORT_STORAGE_KEY);
  }

  async enqueuePhoto(options: { id: string; blob: Blob; metadata?: Payload }) {
    const dataUrl = await optimizeImage({
      src: URL.createObjectURL(options.blob),
      preferWebP: true,
      quality: 0.6,
    });

    const queue = this.readPhotoQueue();
    queue.push({
      id: options.id,
      capturedAt: Date.now(),
      imageUrl: dataUrl,
      metadata: options.metadata,
    });
    this.writePhotoQueue(queue);
  }

  async flushPhotoQueue() {
    if (!this.isOnline || this.isSyncing) return;
    const queue = this.readPhotoQueue();
    if (!queue.length) return;

    this.isSyncing = true;

    try {
      const remaining: OfflinePhoto[] = [];
      for (const entry of queue) {
        try {
          this.options.onSyncProgress?.({ stage: "photo-upload", success: true, detail: entry.id });
          await this.uploadPhoto(entry);
        } catch (error) {
          remaining.push(entry);
          this.options.onSyncProgress?.({
            stage: "photo-upload",
            success: false,
            detail: error instanceof Error ? error.message : "unknown-error",
          });
        }
      }
      this.writePhotoQueue(remaining);
    } finally {
      this.isSyncing = false;
    }
  }

  private async uploadPhoto(entry: OfflinePhoto) {
    const formData = new FormData();
    const response = await fetch(entry.imageUrl);
    const blob = await response.blob();
    formData.append("photo", blob, `${entry.id}.webp`);
    if (entry.metadata) {
      formData.append("metadata", JSON.stringify(entry.metadata));
    }
    formData.append("capturedAt", entry.capturedAt.toString());

    const uploadResponse = await fetch(this.options.photoUploadEndpoint, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
  }

  async storeData(key: string, value: Payload) {
    const storage = getStorage();
    const state = this.readState();
    let merged: Payload;

    switch (this.options.conflictStrategy) {
      case "client-wins":
        merged = { ...state, [key]: value };
        break;
      case "server-wins":
        if (state[key]) {
          return;
        }
        merged = { ...state, [key]: value };
        break;
      case "merge":
      default:
        merged = { ...state, [key]: deepMerge((state[key] ?? {}) as Payload, value) };
        break;
    }

    storage.setItem(DATA_STORAGE_KEY, JSON.stringify(merged));
  }

  getData<T = Payload>(key: string): T | undefined {
    const storage = getStorage();
    try {
      const raw = storage.getItem(DATA_STORAGE_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Payload;
      return parsed[key] as T | undefined;
    } catch {
      return undefined;
    }
  }
}

function deepMerge(target: Payload, source: Payload): Payload {
  const result = { ...target };
  Object.keys(source).forEach((key) => {
    const targetValue = result[key];
    const sourceValue = source[key];
    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      result[key] = Array.from(new Set([...targetValue, ...sourceValue]));
    } else if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMerge(targetValue as Payload, sourceValue as Payload);
    } else {
      result[key] = sourceValue;
    }
  });
  return result;
}

function isPlainObject(value: unknown): value is Payload {
  return typeof value === "object" && value !== null && value.constructor === Object;
}

export const offlineService = new OfflineService();
export default offlineService;


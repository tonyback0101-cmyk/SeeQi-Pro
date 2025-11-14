import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PalmHandType, PalmRegion } from "@/types/palmprint";
import { logPalmEvent } from "@/lib/palmprints/logging";

interface PalmUploadQueueItem {
  id: string;
  file: Blob;
  fileName: string;
  handType: PalmHandType;
  palmRegion: PalmRegion;
  captureMethod: string;
  qualityRating: number | null;
  createdAt: number;
  lastTriedAt?: number;
  error?: string;
}

interface PalmOfflineDB extends DBSchema {
  palm_upload_queue: {
    key: string;
    value: PalmUploadQueueItem;
    indexes: { "by-createdAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<PalmOfflineDB>> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PalmOfflineDB>("seeqi_palm_offline", 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("palm_upload_queue")) {
          const store = database.createObjectStore("palm_upload_queue", { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueuePalmUpload(item: Omit<PalmUploadQueueItem, "id" | "createdAt"> & { createdAt?: number }) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const record: PalmUploadQueueItem = {
    id,
    createdAt: item.createdAt ?? Date.now(),
    file: item.file,
    fileName: item.fileName,
    handType: item.handType,
    palmRegion: item.palmRegion,
    captureMethod: item.captureMethod,
    qualityRating: item.qualityRating ?? null,
  };
  await db.add("palm_upload_queue", record);
  await logPalmEvent({ action: "offline_queue", details: { fileName: record.fileName, handType: record.handType } });
  return record;
}

export async function getPalmUploadQueue(): Promise<PalmUploadQueueItem[]> {
  const db = await getDB();
  const tx = db.transaction("palm_upload_queue", "readonly");
  const store = tx.store;
  const items = await store.index("by-createdAt").getAll();
  await tx.done;
  return items;
}

export async function updatePalmUpload(id: string, updates: Partial<PalmUploadQueueItem>) {
  const db = await getDB();
  const tx = db.transaction("palm_upload_queue", "readwrite");
  const existing = await tx.store.get(id);
  if (!existing) {
    await tx.done;
    return;
  }
  await tx.store.put({ ...existing, ...updates, id });
  await tx.done;
}

export async function removePalmUpload(id: string) {
  const db = await getDB();
  await db.delete("palm_upload_queue", id);
}

export type { PalmUploadQueueItem };

"use client";

import { openDB } from "idb";

const DB_NAME = "seeqi-dream-feedback";
const STORE_NAME = "feedback";
const DB_VERSION = 1;
const MAX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type FeedbackRecord = {
  id: string;
  rating: "accurate" | "neutral" | "inaccurate";
  dreamHash: string;
  createdAt: number;
};

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

function pruneExpired(entries: FeedbackRecord[]): FeedbackRecord[] {
  const now = Date.now();
  return entries.filter((item) => now - item.createdAt <= MAX_RETENTION_MS);
}

function hashDream(text: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return "empty";
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `dream-${Math.abs(hash)}`;
}

export async function saveDreamFeedback(dreamText: string, rating: FeedbackRecord["rating"]) {
  const db = await getDB();
  const dreamHash = hashDream(dreamText);
  const entry: FeedbackRecord = {
    id: `${dreamHash}-${Date.now()}`,
    rating,
    dreamHash,
    createdAt: Date.now(),
  };
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.add(entry);
  const all = (await tx.store.getAll()) as FeedbackRecord[];
  const pruned = pruneExpired(all);
  if (pruned.length !== all.length) {
    await Promise.all(all.map((item) => tx.store.delete(item.id)));
    await Promise.all(pruned.map((item) => tx.store.put(item)));
  }
  await tx.done;
  return entry;
}

export async function getRecentDreamFeedback() {
  const db = await getDB();
  const all = (await db.getAll(STORE_NAME)) as FeedbackRecord[];
  return pruneExpired(all);
}


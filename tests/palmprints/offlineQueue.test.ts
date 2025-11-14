import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  enqueuePalmUpload,
  getPalmUploadQueue,
  removePalmUpload,
  updatePalmUpload,
} from "@/lib/palmprints/offlineQueue";

describe("offline palm upload queue", () => {
  const sampleBlob = new Blob(["test"], { type: "image/jpeg" });

  beforeEach(async () => {
    const queue = await getPalmUploadQueue();
    await Promise.all(queue.map((item) => removePalmUpload(item.id)));
  });

  it("stores items and retrieves them sorted by createdAt", async () => {
    await enqueuePalmUpload({
      file: sampleBlob,
      fileName: "a.jpg",
      handType: "left",
      palmRegion: "palm",
      captureMethod: "camera",
      qualityRating: 4,
      createdAt: 10,
    });

    await enqueuePalmUpload({
      file: sampleBlob,
      fileName: "b.jpg",
      handType: "right",
      palmRegion: "full",
      captureMethod: "upload",
      qualityRating: null,
      createdAt: 5,
    });

    const queue = await getPalmUploadQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].fileName).toBe("b.jpg");
    expect(queue[1].fileName).toBe("a.jpg");
  });

  it("updates metadata for an existing record", async () => {
    const record = await enqueuePalmUpload({
      file: sampleBlob,
      fileName: "update.jpg",
      handType: "left",
      palmRegion: "palm",
      captureMethod: "camera",
      qualityRating: 3,
    });

    await updatePalmUpload(record.id, { error: "network", lastTriedAt: 123 });

    const [updated] = await getPalmUploadQueue();
    expect(updated.error).toBe("network");
    expect(updated.lastTriedAt).toBe(123);
  });

  it("removes records after successful sync", async () => {
    const record = await enqueuePalmUpload({
      file: sampleBlob,
      fileName: "delete.jpg",
      handType: "right",
      palmRegion: "fingers",
      captureMethod: "upload",
      qualityRating: null,
    });

    await removePalmUpload(record.id);
    const queue = await getPalmUploadQueue();
    expect(queue).toHaveLength(0);
  });
});

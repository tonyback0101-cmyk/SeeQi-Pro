import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import PalmFeatureAnnotator from "@/components/palm/PalmFeatureAnnotator";

const baseRecord = {
  id: "record-1",
  imagePath: "https://example.com/palm.jpg",
  handType: "left" as const,
  palmRegion: "palm" as const,
  qualityRating: 3,
  createdAt: Date.now().toString(),
  updatedAt: Date.now().toString(),
  imagePathSignedUrl: undefined,
  features: [],
};

describe("PalmFeatureAnnotator", () => {
  beforeEach(() => {
    vi.spyOn(window, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
    vi.stubGlobal("crypto", {
      randomUUID: () => "uuid-1",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a marker and submits annotations", async () => {
    const handleSaved = vi.fn();
    const handleClose = vi.fn();

    render(
      <PalmFeatureAnnotator record={baseRecord} locale="zh" onSaved={handleSaved} onClose={handleClose} />
    );

    const overlay = document.querySelector("div[style*='padding-top: 75%']") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    vi.spyOn(overlay, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(overlay, { clientX: 100, clientY: 100 });

    const saveButton = screen.getByRole("button", { name: "保存标注" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = (window.fetch as unknown as vi.Mock).mock.calls[0];
    const body = init && typeof init === "object" ? (init as RequestInit).body : null;
    expect(body).toBeTruthy();
    const parsed = JSON.parse(body as string);
    expect(parsed.features).toHaveLength(1);
    expect(handleSaved).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it("deletes a marker after confirmation", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const record = {
      ...baseRecord,
      features: [
        {
          id: "feat-1",
          type: "mainLine" as const,
          position: { x: 0.4, y: 0.6 },
          description: "",
        },
      ],
    };

    render(<PalmFeatureAnnotator record={record} locale="en" onSaved={vi.fn()} onClose={vi.fn()} />);

    const deleteButton = screen.getByRole("button", { name: "Remove" });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    const saveButton = screen.getByRole("button", { name: "Save annotations" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = (window.fetch as unknown as vi.Mock).mock.calls[0];
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.features).toHaveLength(0);
  });
});

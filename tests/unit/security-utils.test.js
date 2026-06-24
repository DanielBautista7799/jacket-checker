import { describe, expect, it } from "vitest";
import sanitizeUploadFilename from "../../src/utils/sanitizeUploadFilename";
import validateJacketImageFile from "../../src/utils/validateJacketImageFile";
import classifyAppError from "../../src/utils/classifyAppError";
import safeClientError from "../../src/utils/safeClientError";
import { sanitizeAnalyticsMetadata, sanitizeAnalyticsEvent } from "../../src/utils/sanitizeAnalyticsPayload";
import { buildCanonicalJacketDescriptor } from "../../src/utils/buildCanonicalJacketDescriptor";
import { getFeedbackWeight, createLearningKey } from "../../src/utils/feedbackLearning";
import { normalizeJacketSimilarityMatch } from "../../src/utils/jacketSimilarity";

describe("Phase 13 security utilities", () => {
  it("sanitizes upload filenames", () => {
    expect(sanitizeUploadFilename("../My Jacket!!.PNG")).toBe("My-Jacket.PNG".replace("PNG", "png"));
    expect(sanitizeUploadFilename("  ")).toBe("jacket-image");
  });

  it("validates safe image types and rejects SVG", async () => {
    const jpeg = new File([new Uint8Array([1, 2, 3])], "jacket.jpg", { type: "image/jpeg" });
    const svg = new File(["<svg></svg>"], "jacket.svg", { type: "image/svg+xml" });
    expect((await validateJacketImageFile(jpeg, { checkDimensions: false })).valid).toBe(true);
    expect((await validateJacketImageFile(svg, { checkDimensions: false })).valid).toBe(false);
  });

  it("classifies errors and returns safe messages", () => {
    expect(classifyAppError({ status: 429, message: "Too many" })).toBe("rate_limit");
    expect(safeClientError(new Error("failed to fetch")).message).toMatch(/offline/i);
  });

  it("removes sensitive analytics metadata", () => {
    const result = sanitizeAnalyticsMetadata({
      decision: "YES",
      latitude: 35.9,
      image_path: "secret/path",
      token: "secret",
      duration_bucket: "fast",
    });
    expect(result).toEqual({ decision: "YES", duration_bucket: "fast" });
  });

  it("rejects unknown analytics events", () => {
    expect(() => sanitizeAnalyticsEvent({ event_name: "unknown_event" })).toThrow(/Unsupported/);
  });

  it("builds a bounded jacket descriptor", () => {
    const descriptor = buildCanonicalJacketDescriptor({
      name: "Rain Shell",
      subtype: "rain_shell",
      primary_color: "navy",
      materials: ["nylon"],
      rain_rating: 5,
    });
    expect(descriptor).toContain("Rain Shell");
    expect(descriptor).toContain("rain shell");
    expect(descriptor.length).toBeLessThanOrEqual(1200);
  });

  it("keeps feedback weights and learning keys deterministic", () => {
    expect(getFeedbackWeight("fire")).toBe(2);
    expect(getFeedbackWeight("not_it")).toBe(-1);
    expect(createLearningKey("Rain Shell", "RAIN")).toBe(createLearningKey("Rain Shell", "RAIN"));
  });

  it("normalizes similarity without exposing raw vectors", () => {
    const jacket = { id: "j1", name: "Black Bomber" };
    const result = normalizeJacketSimilarityMatch({ jacketId: "j1", vectorSimilarity: 0.95 }, [jacket]);
    expect(result.jacket).toEqual(jacket);
    expect(result.label).toBeTruthy();
    expect(result.embedding).toBeUndefined();
  });
});

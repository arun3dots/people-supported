import { describe, it, expect } from "vitest";
import { ExactPointSchema } from "@repo/schema";

describe("Exact Anatomical Location Coordinates", () => {
  function computeNormalizedPoint(
    svgPoint: { x: number; y: number },
    bbox: { x: number; y: number; width: number; height: number },
  ) {
    const w = bbox.width > 0 ? bbox.width : 1;
    const h = bbox.height > 0 ? bbox.height : 1;

    const relX = Math.max(0, Math.min(1, (svgPoint.x - bbox.x) / w));
    const relY = Math.max(0, Math.min(1, (svgPoint.y - bbox.y) / h));

    return {
      coordinateSpace: "anatomy-bbox" as const,
      x: Math.round(relX * 1000) / 1000,
      y: Math.round(relY * 1000) / 1000,
    };
  }

  it("should calculate exact center of an anatomical bounding box", () => {
    const bbox = { x: 100, y: 200, width: 50, height: 80 };
    const pt = { x: 125, y: 240 }; // exact middle

    const result = computeNormalizedPoint(pt, bbox);
    expect(result.x).toBe(0.5);
    expect(result.y).toBe(0.5);
    expect(result.coordinateSpace).toBe("anatomy-bbox");

    // Validates against Zod schema
    expect(ExactPointSchema.safeParse(result).success).toBe(true);
  });

  it("should clamp points clicked slightly outside the bounding boundary", () => {
    const bbox = { x: 100, y: 200, width: 50, height: 80 };
    const ptOutside = { x: 90, y: 300 }; // left and below

    const result = computeNormalizedPoint(ptOutside, bbox);
    expect(result.x).toBe(0);
    expect(result.y).toBe(1);
    expect(ExactPointSchema.safeParse(result).success).toBe(true);
  });

  it("should reconstruct the exact pixel position on any display scale", () => {
    const originalBbox = { x: 100, y: 200, width: 50, height: 80 };
    const normalized = computeNormalizedPoint({ x: 121, y: 248 }, originalBbox);

    // Simulated responsive scale (e.g. mobile 2x zoom)
    const scaledBbox = { x: 200, y: 400, width: 100, height: 160 };
    const renderedX = scaledBbox.x + normalized.x * scaledBbox.width;
    const renderedY = scaledBbox.y + normalized.y * scaledBbox.height;

    expect(renderedX).toBe(242);
    expect(renderedY).toBe(496);
  });

  it("should be resilient to zero-width or zero-height elements without dividing by zero", () => {
    const zeroBbox = { x: 50, y: 50, width: 0, height: 0 };
    const pt = { x: 50, y: 50 };

    const result = computeNormalizedPoint(pt, zeroBbox);
    expect(Number.isFinite(result.x)).toBe(true);
    expect(Number.isFinite(result.y)).toBe(true);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

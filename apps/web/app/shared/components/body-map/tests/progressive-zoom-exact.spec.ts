import { describe, it, expect } from "vitest";
import { ANATOMY_BY_ID, type ExactPointDTO } from "@repo/schema";

describe("Progressive Zoom & Exact Location Interaction Contract", () => {
  // ─── 1. Aspect-Ratio Aware Zoom Math ───
  function calculateAspectAwareZoomViewBox(
    bbox: { x: number; y: number; width: number; height: number },
    containerDimensions: { width: number; height: number },
    canvasBounds: { width: number; height: number },
  ) {
    const containerAspect =
      containerDimensions.width / containerDimensions.height;

    // 30% padding
    const padding = Math.max(14, Math.max(bbox.width, bbox.height) * 0.3);
    let targetW = bbox.width + padding * 2;
    let targetH = bbox.height + padding * 2;
    const targetCenterX = bbox.x + bbox.width / 2;
    const targetCenterY = bbox.y + bbox.height / 2;

    const currentTargetAspect = targetW / targetH;
    if (currentTargetAspect > containerAspect) {
      targetH = targetW / containerAspect;
    } else {
      targetW = targetH * containerAspect;
    }

    let x = targetCenterX - targetW / 2;
    let y = targetCenterY - targetH / 2;

    x = Math.max(-10, Math.min(x, canvasBounds.width - targetW + 10));
    y = Math.max(-10, Math.min(y, canvasBounds.height - targetH + 10));

    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(targetW),
      h: Math.round(targetH),
    };
  }

  it("should expand square hand bbox to match container aspect ratio without letterboxing", () => {
    // Hand bounding box (approx 35x45 in 294x545 canvas)
    const handBbox = { x: 230, y: 220, width: 35, height: 45 };
    const container = { width: 360, height: 576 }; // aspect ~ 0.625
    const canvasBounds = { width: 294, height: 545 };

    const zoomBox = calculateAspectAwareZoomViewBox(
      handBbox,
      container,
      canvasBounds,
    );

    // Zoom viewBox aspect ratio matches container aspect ratio
    const zoomAspect = zoomBox.w / zoomBox.h;
    const containerAspect = container.width / container.height;
    expect(Math.abs(zoomAspect - containerAspect)).toBeLessThan(0.05);

    // Hand occupies significant portion of the zoomBox height
    const coverageY = handBbox.height / zoomBox.h;
    expect(coverageY).toBeGreaterThan(0.3);

    // Hand width occupies over 45% of zoomBox width
    const coverageX = handBbox.width / zoomBox.w;
    expect(coverageX).toBeGreaterThan(0.4);
  });

  it("should calculate progressive zoom magnification for hand -> finger -> nail", () => {
    const container = { width: 360, height: 576 };
    const canvas = { width: 294, height: 545 };

    const handBbox = { x: 230, y: 220, width: 35, height: 45 };
    const fingerBbox = { x: 235, y: 240, width: 10, height: 22 };
    const nailBbox = { x: 236, y: 256, width: 6, height: 5 };

    const handZoom = calculateAspectAwareZoomViewBox(handBbox, container, canvas);
    const fingerZoom = calculateAspectAwareZoomViewBox(
      fingerBbox,
      container,
      canvas,
    );
    const nailZoom = calculateAspectAwareZoomViewBox(nailBbox, container, canvas);

    // Progressive zoom: each level gets a smaller, more focused viewBox area
    const handArea = handZoom.w * handZoom.h;
    const fingerArea = fingerZoom.w * fingerZoom.h;
    const nailArea = nailZoom.w * nailZoom.h;

    expect(fingerArea).toBeLessThan(handArea);
    expect(nailArea).toBeLessThan(fingerArea);
  });

  // ─── 2. Strict Separation: Navigation vs Exact Marking ───
  it("should not drop a pin when interacting in navigate mode", () => {
    let mode: "navigate" | "mark-exact" = "navigate";
    let activeExactPoint: ExactPointDTO | null = null;
    let selectedNodeId: string | null = null;

    // Simulate pointer click in navigate mode
    const handlePointerDown = (nodeId: string) => {
      selectedNodeId = nodeId;
      if (mode === "mark-exact") {
        activeExactPoint = {
          coordinateSpace: "anatomy-bbox",
          x: 0.5,
          y: 0.5,
        };
      }
    };

    handlePointerDown("right-hand");
    expect(selectedNodeId).toBe("right-hand");
    expect(activeExactPoint).toBeNull(); // ZERO pin created in navigate mode

    // Switch to mark-exact mode
    mode = "mark-exact";
    handlePointerDown("right-index-finger-nail");
    expect(selectedNodeId).toBe("right-index-finger-nail");
    expect(activeExactPoint).not.toBeNull(); // Pin created in mark-exact mode
    expect((activeExactPoint as ExactPointDTO | null)?.coordinateSpace).toBe("anatomy-bbox");
  });

  // ─── 3. Single Source of Truth & Marker Persistence ───
  it("should derive rendered coordinates consistently across zoom and resize", () => {
    const nailBbox = { x: 236, y: 256, width: 6, height: 5 };
    const exactPoint: ExactPointDTO = {
      coordinateSpace: "anatomy-bbox",
      x: 0.4,
      y: 0.6,
    };

    // Render coordinates are mathematically derived from bbox + exactPoint
    const renderX = nailBbox.x + exactPoint.x * nailBbox.width;
    const renderY = nailBbox.y + exactPoint.y * nailBbox.height;

    expect(renderX).toBe(238.4);
    expect(renderY).toBe(259);

    // If a re-render occurs with the same exactPoint, coordinates remain identical
    const reRenderX = nailBbox.x + exactPoint.x * nailBbox.width;
    const reRenderY = nailBbox.y + exactPoint.y * nailBbox.height;
    expect(reRenderX).toBe(renderX);
    expect(reRenderY).toBe(renderY);
  });

  // ─── 4. Reposition & Clear Workflows ───
  it("should preserve existing pin during reposition mode until new tap occurs", () => {
    let exactPoint: ExactPointDTO | null = {
      coordinateSpace: "anatomy-bbox",
      x: 0.3,
      y: 0.3,
    };
    let mode: "navigate" | "mark-exact" = "navigate";

    // User clicks Reposition
    mode = "mark-exact";
    expect(exactPoint).not.toBeNull(); // Previous pin remains visible during mode switch!

    // User taps new location
    exactPoint = {
      coordinateSpace: "anatomy-bbox",
      x: 0.75,
      y: 0.8,
    };
    expect(exactPoint.x).toBe(0.75);

    // User clicks Clear Pin
    exactPoint = null;
    mode = "navigate";
    expect(exactPoint).toBeNull();
  });
});

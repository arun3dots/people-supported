import { ANATOMY_DEFAULT_CENTERS } from './bodyMapConstants';
import { getAnatomyBoundingBox, findAnatomyAtSvgCoords } from './bodyMapBounds';
import { findAnatomyAtPoint } from './bodyMapHitTest';
import type { BodyMapDimensions } from './svg';
import type { BodyMapViewType, BodyMapVariantType } from '@repo/schema';

/**
 * Calculates aspect-ratio-safe target viewBox matching the screen/container dimensions
 * identical to the web application's targetViewBox calculation.
 */
export function calculateZoomedViewBox(
  defaultDim: BodyMapDimensions,
  selectedAnatomyId: string | null,
  zoomLevel: number,
  focalCenter?: { x: number; y: number } | null,
  containerWidth?: number,
  containerHeight?: number,
  view: BodyMapViewType = 'Front',
  variant: BodyMapVariantType = 'neutral',
): BodyMapDimensions {
  const containerAspect =
    containerWidth && containerHeight && containerWidth > 0 && containerHeight > 0
      ? containerWidth / containerHeight
      : defaultDim.w / defaultDim.h;

  if (zoomLevel <= 1.05 && !selectedAnatomyId && !focalCenter) {
    if (containerAspect >= defaultDim.w / defaultDim.h) {
      const h = defaultDim.h;
      const w = Math.round(h * containerAspect);
      const x = Math.round((defaultDim.w - w) / 2);
      return { x, y: 0, w, h };
    } else {
      const w = defaultDim.w;
      const h = Math.round(w / containerAspect);
      const y = Math.round((defaultDim.h - h) / 2);
      return { x: 0, y, w, h };
    }
  }

  // If focused on an anatomy region without manual 1-finger pan offset, use anatomy bbox
  const bbox = selectedAnatomyId ? getAnatomyBoundingBox(selectedAnatomyId, view, variant) : null;
  if (bbox && !focalCenter && bbox.w > 0 && bbox.h > 0) {
    const padding = Math.max(14, Math.max(bbox.w, bbox.h) * 0.35);
    let targetW = bbox.w + padding * 2;
    let targetH = bbox.h + padding * 2;
    const targetCenterX = bbox.x + bbox.w / 2;
    const targetCenterY = bbox.y + bbox.h / 2;

    const currentTargetAspect = targetW / targetH;
    if (currentTargetAspect > containerAspect) {
      targetH = targetW / containerAspect;
    } else {
      targetW = targetH * containerAspect;
    }

    targetW = Math.min(targetW, defaultDim.w);
    targetH = Math.min(targetH, defaultDim.h);

    let x = targetCenterX - targetW / 2;
    let y = targetCenterY - targetH / 2;
    x = Math.max(0, Math.min(x, defaultDim.w - targetW));
    y = Math.max(0, Math.min(y, defaultDim.h - targetH));

    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(targetW),
      h: Math.round(targetH),
    };
  }

  // Fallback / Manual 1-Finger Pan & Pinch Scaling
  const center = selectedAnatomyId ? ANATOMY_DEFAULT_CENTERS[selectedAnatomyId] : null;
  const normX = focalCenter?.x ?? (center ? center.x : 0.5);
  const normY = focalCenter?.y ?? (center ? center.y : 0.5);

  const centerX = normX * defaultDim.w;
  const centerY = normY * defaultDim.h;

  const targetH = defaultDim.h / Math.max(1.0, zoomLevel);
  const targetW = targetH * containerAspect;

  let targetX = centerX - targetW / 2;
  let targetY = centerY - targetH / 2;

  targetY = Math.max(0, Math.min(defaultDim.h - targetH, targetY));

  if (targetW < defaultDim.w) {
    targetX = Math.max(0, Math.min(defaultDim.w - targetW, targetX));
  } else {
    targetX = (defaultDim.w - targetW) / 2;
  }

  return {
    x: Math.round(targetX),
    y: Math.round(targetY),
    w: Math.round(targetW),
    h: Math.round(targetH),
  };
}

/**
 * Maps screen touch coordinates within the canvas container to normalized (0.0 to 1.0)
 * coordinates in the full body SVG space, accurately accounting for current zoom viewBox.
 */
export function screenTouchToSvgCoords(
  locationX: number,
  locationY: number,
  layoutWidth: number,
  layoutHeight: number,
  currentViewBox: BodyMapDimensions,
  defaultDim: BodyMapDimensions,
): { relX: number; relY: number; svgX: number; svgY: number } {
  if (layoutWidth <= 0 || layoutHeight <= 0) {
    return { relX: 0.5, relY: 0.5, svgX: defaultDim.w * 0.5, svgY: defaultDim.h * 0.5 };
  }

  const clampedTouchX = Math.max(0, Math.min(layoutWidth, locationX));
  const clampedTouchY = Math.max(0, Math.min(layoutHeight, locationY));

  const svgX = currentViewBox.x + (clampedTouchX / layoutWidth) * currentViewBox.w;
  const svgY = currentViewBox.y + (clampedTouchY / layoutHeight) * currentViewBox.h;

  const relX = Math.max(0.01, Math.min(0.99, svgX / defaultDim.w));
  const relY = Math.max(0.01, Math.min(0.99, svgY / defaultDim.h));

  return {
    relX: Number(relX.toFixed(3)),
    relY: Number(relY.toFixed(3)),
    svgX: Math.round(svgX * 10) / 10,
    svgY: Math.round(svgY * 10) / 10,
  };
}

/**
 * Finds the exact anatomical region matching touch coordinates.
 * Prioritizes the exact SVG bounding box (smallest/deepest anatomy subpart),
 * falling back to closest anatomical center.
 */
export function findClosestAnatomyId(
  svgX: number,
  svgY: number,
  relX: number,
  relY: number,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
  zoomLevel: number = 1.0,
): string | null {
  // 1. Exact SVG bounding box hit test
  const exactId = findAnatomyAtSvgCoords(svgX, svgY, view, variant);
  if (exactId) return exactId;

  // 2. Fallback to closest default center
  let closestId: string | null = null;
  let minDistance = 0.085 / (zoomLevel > 1 ? Math.min(2.0, zoomLevel * 0.8) : 1.0);

  for (const [id, center] of Object.entries(ANATOMY_DEFAULT_CENTERS)) {
    if (center.view !== 'both' && center.view !== view) continue;
    const dx = center.x - relX;
    const dy = center.y - relY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDistance) {
      minDistance = dist;
      closestId = id;
    }
  }

  return closestId;
}

/**
 * Resolves the anatomy region under a tap using exact SVG geometry (topmost shape wins),
 * with a small zoom-scaled tolerance for taps just off an edge. Falls back to canonical
 * bounding-box matching only if the geometry could not be parsed.
 */
export function resolveTappedAnatomy(
  svgX: number,
  svgY: number,
  relX: number,
  relY: number,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
  zoomLevel: number = 1.0,
): string | null {
  const exact = findAnatomyAtPoint(svgX, svgY, view, variant, 6 / Math.max(1, zoomLevel));
  if (exact !== undefined) return exact;

  return findClosestAnatomyId(svgX, svgY, relX, relY, view, variant, zoomLevel);
}

/**
 * Calculates normalized (0.0 to 1.0) coordinates relative to anatomy bounding box.
 */
export function calculateBboxRelativePoint(
  svgX: number,
  svgY: number,
  anatomyId: string,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
): { x: number; y: number } {
  const bbox = getAnatomyBoundingBox(anatomyId, view, variant);
  if (bbox && bbox.w > 0 && bbox.h > 0) {
    const x = Math.max(0, Math.min(1, Number(((svgX - bbox.x) / bbox.w).toFixed(3))));
    const y = Math.max(0, Math.min(1, Number(((svgY - bbox.y) / bbox.h).toFixed(3))));
    return { x, y };
  }
  return { x: 0.5, y: 0.5 };
}

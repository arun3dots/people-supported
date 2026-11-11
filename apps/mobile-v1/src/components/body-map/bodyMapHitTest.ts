import type { BodyMapViewType, BodyMapVariantType } from '@repo/schema';
import { getBodyMapRawSvg } from './svg';

/**
 * Exact tap hit-testing against the body-map SVG geometry.
 *
 * The SVG assets contain only absolute M/L/Z polygons and ellipses, so shapes are parsed once per
 * (view, variant) and tested with point-in-polygon. This is platform independent, unlike a DOM
 * lookup, and mirrors what a browser does: the topmost drawn shape under the finger wins.
 */

interface HitShape {
  anatomyId: string;
  points?: number[];
  ellipse?: { cx: number; cy: number; rx: number; ry: number };
}

const shapeCache = new Map<string, HitShape[]>();

const TAG_RE = /<(\/?)([a-zA-Z][\w-]*)((?:\s[^<>]*?)?)(\/?)>/g;
const ATTR_RE = /([\w:-]+)="([^"]*)"/g;
const NUMBER_RE = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(raw)) !== null) attrs[match[1]] = match[2];
  return attrs;
}

export function parseHitShapes(svg: string): HitShape[] {
  const xml = svg.replace(/<!--[\s\S]*?-->/g, '');
  const shapes: HitShape[] = [];
  const groupIds: Array<string | null> = [];
  const currentGroupId = () => (groupIds.length ? groupIds[groupIds.length - 1] : null);

  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(xml)) !== null) {
    const [, closing, tag, rawAttrs, selfClosing] = match;

    if (tag === 'g') {
      if (closing) {
        groupIds.pop();
      } else if (!selfClosing) {
        groupIds.push(parseAttributes(rawAttrs)['data-anatomy-id'] ?? currentGroupId());
      }
      continue;
    }
    if (closing || (tag !== 'path' && tag !== 'ellipse')) continue;

    const attrs = parseAttributes(rawAttrs);
    if (attrs['pointer-events'] === 'none' || attrs['data-interactive'] === 'false') continue;
    const anatomyId = attrs['data-anatomy-id'] ?? currentGroupId();
    if (!anatomyId) continue;

    if (tag === 'path' && attrs.d) {
      const points = (attrs.d.match(NUMBER_RE) ?? []).map(Number);
      if (points.length >= 6) shapes.push({ anatomyId, points });
    } else if (tag === 'ellipse') {
      const cx = Number(attrs.cx);
      const cy = Number(attrs.cy);
      const rx = Number(attrs.rx);
      const ry = Number(attrs.ry);
      if ([cx, cy, rx, ry].every(Number.isFinite) && rx > 0 && ry > 0) {
        shapes.push({ anatomyId, ellipse: { cx, cy, rx, ry } });
      }
    }
  }
  return shapes;
}

function getShapes(view: BodyMapViewType, variant: BodyMapVariantType): HitShape[] {
  const key = `${view}:${variant}`;
  let shapes = shapeCache.get(key);
  if (!shapes) {
    shapes = parseHitShapes(getBodyMapRawSvg(view, variant));
    shapeCache.set(key, shapes);
  }
  return shapes;
}

function pointInPolygon(x: number, y: number, pts: number[]): boolean {
  let inside = false;
  const n = pts.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = pts[i * 2];
    const yi = pts[i * 2 + 1];
    const xj = pts[j * 2];
    const yj = pts[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToShape(x: number, y: number, shape: HitShape): number {
  if (shape.points) {
    const pts = shape.points;
    const n = pts.length / 2;
    let min = Infinity;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      min = Math.min(min, distanceToSegment(x, y, pts[j * 2], pts[j * 2 + 1], pts[i * 2], pts[i * 2 + 1]));
    }
    return min;
  }
  const e = shape.ellipse as NonNullable<HitShape['ellipse']>;
  // Normalised radial distance scaled back by the smaller radius: a close, cheap approximation.
  const radial = Math.hypot((x - e.cx) / e.rx, (y - e.cy) / e.ry);
  return Math.abs(radial - 1) * Math.min(e.rx, e.ry);
}

function containsPoint(x: number, y: number, shape: HitShape): boolean {
  if (shape.points) return pointInPolygon(x, y, shape.points);
  const e = shape.ellipse as NonNullable<HitShape['ellipse']>;
  return ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 <= 1;
}

/**
 * Returns the anatomy id of the topmost shape under the point (SVG user-space coordinates).
 * When the tap lands just outside every shape, the nearest shape within `tolerance` units is used,
 * so slightly-off taps on thin edges still select. Returns null for taps on empty background.
 * Returns undefined when no geometry could be parsed, so callers can fall back to another strategy.
 */
export function findAnatomyAtPoint(
  svgX: number,
  svgY: number,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
  tolerance = 5,
): string | null | undefined {
  const shapes = getShapes(view, variant);
  if (shapes.length === 0) return undefined;

  for (let i = shapes.length - 1; i >= 0; i--) {
    if (containsPoint(svgX, svgY, shapes[i])) return shapes[i].anatomyId;
  }

  let nearest: string | null = null;
  let nearestDistance = tolerance;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const distance = distanceToShape(svgX, svgY, shapes[i]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = shapes[i].anatomyId;
    }
  }
  return nearest;
}

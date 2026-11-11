import React from 'react';
import { G, Line, Polygon, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { ANATOMY_DEFAULT_CENTERS } from './bodyMapConstants';
import { getAnatomyBoundingBox } from './bodyMapBounds';
import type { BodyMapDimensions } from './svg';
import type { BodyMapViewType, BodyMapVariantType, ExactPointDTO } from '@repo/schema';

interface Props {
  selectedAnatomyId: string;
  defaultDim: BodyMapDimensions;
  currentViewBox: BodyMapDimensions;
  exactPoint?: ExactPointDTO | null;
  view?: BodyMapViewType;
  variant?: BodyMapVariantType;
}

/**
 * Renders a precision clinical callout pointing directly at the selected body part
 * using the application's signature #4A706A brand theme and elevated card style.
 */
export function BodyMapArrowCallout({
  selectedAnatomyId,
  defaultDim,
  currentViewBox,
  exactPoint,
  view = 'Front',
  variant = 'neutral',
}: Props) {
  const center = ANATOMY_DEFAULT_CENTERS[selectedAnatomyId];
  const bbox = getAnatomyBoundingBox(selectedAnatomyId, view, variant);

  let targetX = defaultDim.w * 0.5;
  let targetY = defaultDim.h * 0.5;

  if (bbox && bbox.w > 0 && bbox.h > 0) {
    const rx = exactPoint ? exactPoint.x : 0.5;
    const ry = exactPoint ? exactPoint.y : 0.5;
    targetX = bbox.x + rx * bbox.w;
    targetY = bbox.y + ry * bbox.h;
  } else if (center) {
    targetX = center.x * defaultDim.w;
    targetY = center.y * defaultDim.h;
  }

  const labelText = center?.label || selectedAnatomyId;

  // Approximate badge width from string length (with icon dot padding)
  const badgeW = Math.max(82, labelText.length * 6.5 + 26);
  const badgeH = 22;

  // Determine callout placement relative to focal point and visible viewBox
  const relInVbX = (targetX - currentViewBox.x) / currentViewBox.w;
  const spaceOnRight = currentViewBox.x + currentViewBox.w - targetX;
  const spaceOnLeft = targetX - currentViewBox.x;

  let labelX: number;
  if (spaceOnRight >= badgeW + 15 && (relInVbX < 0.55 || spaceOnRight > spaceOnLeft)) {
    labelX = targetX + Math.min(48, spaceOnRight - badgeW / 2 - 4);
  } else {
    labelX = targetX - Math.min(48, spaceOnLeft - badgeW / 2 - 4);
  }

  // Vertical placement: prefer above the target point if space permits
  let labelY: number;
  if (targetY - currentViewBox.y >= 35) {
    labelY = targetY - 32;
  } else {
    labelY = targetY + 32;
  }

  // Clamp label position to remain strictly inside the current visible viewBox
  labelX = Math.max(
    currentViewBox.x + badgeW / 2 + 4,
    Math.min(currentViewBox.x + currentViewBox.w - badgeW / 2 - 4, labelX),
  );
  labelY = Math.max(
    currentViewBox.y + badgeH / 2 + 4,
    Math.min(currentViewBox.y + currentViewBox.h - badgeH / 2 - 4, labelY),
  );

  // Calculate angle and arrowhead vertices pointing directly at target (targetX, targetY)
  const angle = Math.atan2(targetY - labelY, targetX - labelX);
  const arrowLen = 9;
  const arrowAngle = 0.45;

  const tipX = targetX;
  const tipY = targetY;
  const wing1X = targetX - arrowLen * Math.cos(angle - arrowAngle);
  const wing1Y = targetY - arrowLen * Math.sin(angle - arrowAngle);
  const wing2X = targetX - arrowLen * Math.cos(angle + arrowAngle);
  const wing2Y = targetY - arrowLen * Math.sin(angle + arrowAngle);

  const badgeLeft = labelX - badgeW / 2;
  const badgeTop = labelY - badgeH / 2;

  return (
    <G pointerEvents="none">
      {/* 1. Target Focal Reticle on Body Part (#4A706A Theme) */}
      <Circle
        cx={targetX}
        cy={targetY}
        r={14}
        fill="#4A706A"
        fillOpacity={0.18}
      />
      <Circle
        cx={targetX}
        cy={targetY}
        r={7.5}
        fill="none"
        stroke="#4A706A"
        strokeWidth={1.5}
        strokeDasharray="2.5,2"
      />
      <Circle
        cx={targetX}
        cy={targetY}
        r={3}
        fill="#4A706A"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />

      {/* 2. Directional Leader Line from Callout to Target */}
      <Line
        x1={labelX}
        y1={labelY}
        x2={targetX}
        y2={targetY}
        stroke="#4A706A"
        strokeWidth={1.8}
        strokeDasharray="3,2"
      />

      {/* 3. Directional Arrowhead pointing at the exact body location */}
      <Polygon
        points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
        fill="#4A706A"
        stroke="#FFFFFF"
        strokeWidth={1}
      />

      {/* 4. Clinical Callout Badge (White Card with #4A706A Accent & #141F1E Typography) */}
      <Rect
        x={badgeLeft}
        y={badgeTop}
        width={badgeW}
        height={badgeH}
        rx={6}
        fill="#FFFFFF"
        stroke="#4A706A"
        strokeWidth={1.6}
      />
      {/* Indicator Dot */}
      <Circle
        cx={badgeLeft + 10}
        cy={labelY}
        r={3}
        fill="#4A706A"
      />
      {/* Body Part Label Text */}
      <SvgText
        x={badgeLeft + 17}
        y={labelY + 3.8}
        fill="#141F1E"
        fontSize={10}
        fontWeight="bold"
        textAnchor="start"
      >
        {labelText}
      </SvgText>
    </G>
  );
}

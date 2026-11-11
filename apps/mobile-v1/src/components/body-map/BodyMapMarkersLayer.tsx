import React from 'react';
import { Circle, G } from 'react-native-svg';
import {
  ANATOMY_DEFAULT_CENTERS,
  SEVERITY_COLORS,
} from './bodyMapConstants';
import { getAnatomyBoundingBox, getPinSvgCoords } from './bodyMapBounds';
import type { BodyMapDimensions } from './svg';
import type { BodyMapFindingItem } from '../../presentation/hooks/useBodyMap';
import type { BodyMapViewType, BodyMapVariantType, ExactPointDTO } from '@repo/schema';
import { theme } from '../../theme';

interface Props {
  view: BodyMapViewType;
  variant?: BodyMapVariantType;
  findings: BodyMapFindingItem[];
  exactPoint: ExactPointDTO | null;
  selectedAnatomyId: string | null;
  defaultDim: BodyMapDimensions;
  currentViewBox: BodyMapDimensions;
  onMarkerPress: (finding: BodyMapFindingItem) => void;
}

/**
 * Overlay layer rendering clinical finding markers
 * and user exact pin markers on top of the base SVG body map.
 */
export function BodyMapMarkersLayer({
  view,
  variant = 'neutral',
  findings,
  exactPoint,
  selectedAnatomyId,
  defaultDim,
  currentViewBox,
  onMarkerPress,
}: Props) {
  const viewFindings = findings.filter((f) => f.view === view);
  const activePin = getPinSvgCoords(selectedAnatomyId, exactPoint, view, variant, defaultDim);

  return (
    <>
      {/* Existing Clinical Findings Markers */}
      {viewFindings.map((finding) => {
        const bbox = finding.anatomyId ? getAnatomyBoundingBox(finding.anatomyId, view, variant) : null;
        const defCenter = ANATOMY_DEFAULT_CENTERS[finding.anatomyId];

        let pinX = defaultDim.w * 0.5;
        let pinY = defaultDim.h * 0.5;

        if (bbox && bbox.w > 0 && bbox.h > 0) {
          const relX = finding.exactX != null ? Math.max(0, Math.min(1, finding.exactX)) : 0.5;
          const relY = finding.exactY != null ? Math.max(0, Math.min(1, finding.exactY)) : 0.5;
          pinX = bbox.x + relX * bbox.w;
          pinY = bbox.y + relY * bbox.h;
        } else if (defCenter) {
          pinX = defCenter.x * defaultDim.w;
          pinY = defCenter.y * defaultDim.h;
        }

        const sevColor = SEVERITY_COLORS[finding.severity] || '#EF4444';
        const isOpen = finding.status === 'Open';

        return (
          <G key={finding.id} onPress={() => onMarkerPress(finding)}>
            {isOpen && (
              <Circle
                cx={pinX}
                cy={pinY}
                r={12}
                fill={sevColor}
                fillOpacity={0.25}
              />
            )}
            <Circle
              cx={pinX}
              cy={pinY}
              r={6}
              fill={sevColor}
              stroke="#FFFFFF"
              strokeWidth={1.6}
            />
            <Circle cx={pinX} cy={pinY} r={2} fill="#FFFFFF" />
          </G>
        );
      })}

      {/* User Exact Pin Marker (primary-dark with a white ring/halo so it stays visible on the primary-coloured selection) */}
      {activePin && (
        <G pointerEvents="none">
          <Circle
            cx={activePin.svgX}
            cy={activePin.svgY}
            r={16}
            fill="#FFFFFF"
            fillOpacity={0.35}
          />
          <Circle
            cx={activePin.svgX}
            cy={activePin.svgY}
            r={8}
            fill={theme.colors.primary.dark}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <Circle
            cx={activePin.svgX}
            cy={activePin.svgY}
            r={2.5}
            fill="#FFFFFF"
          />
        </G>
      )}
    </>
  );
}

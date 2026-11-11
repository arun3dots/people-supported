"use client";

import React, { useState } from "react";
import { BodyMapCanvas, type BodyMapInteractionMode } from "./BodyMapCanvas";
import {
  type AnatomyNode,
  type BodyMapVariantType,
} from "@repo/schema";
import { type FindingMarkerItem } from "./FindingMarker";

interface BodyMapSvgProps {
  view: "Front" | "Back";
  variant?: BodyMapVariantType;
  selectedNode?: AnatomyNode | null;
  onSelectNode?: (node: AnatomyNode | null) => void;
  findings?: FindingMarkerItem[];
  onMarkerClick?: (findings: FindingMarkerItem[]) => void;
  mode?: BodyMapInteractionMode;
  onModeChange?: (mode: BodyMapInteractionMode) => void;
}

export function BodyMapSvg({
  view,
  variant = "neutral",
  selectedNode = null,
  onSelectNode = () => {},
  findings = [],
  onMarkerClick = () => {},
  mode: propMode,
  onModeChange: propOnModeChange,
}: BodyMapSvgProps) {
  const [internalMode, setInternalMode] = useState<BodyMapInteractionMode>("navigate");
  const mode = propMode ?? internalMode;
  const onModeChange = propOnModeChange ?? setInternalMode;

  return (
    <BodyMapCanvas
      view={view}
      variant={variant}
      mode={mode}
      onModeChange={onModeChange}
      selectedNode={selectedNode}
      onSelectNode={onSelectNode}
      findings={findings}
      onMarkerClick={onMarkerClick}
    />
  );
}

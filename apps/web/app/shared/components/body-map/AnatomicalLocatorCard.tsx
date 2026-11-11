"use client";

import type {
  BodyMapViewType,
  BodyMapVariantType,
  AnatomyNode,
  ExactPointDTO,
} from "@repo/schema";
import {
  Card,
  CardContent,
  CardHeader,
  Text,
} from "@repo/ui/components/ui";
import { AnatomyNavigator } from "./AnatomyNavigator";
import { BodyMapCanvas, type BodyMapInteractionMode } from "./BodyMapCanvas";
import type { FindingMarkerItem } from "./FindingMarker";

interface AnatomicalLocatorCardProps {
  view: BodyMapViewType;
  onViewChange: (view: BodyMapViewType) => void;
  variant: BodyMapVariantType;
  mode: BodyMapInteractionMode;
  onModeChange: (mode: BodyMapInteractionMode) => void;
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode | null) => void;
  findings: FindingMarkerItem[];
  onMarkerClick: (findings: FindingMarkerItem[]) => void;
  exactPoint: ExactPointDTO | null;
  onSelectExactPoint: (node: AnatomyNode, pt: ExactPointDTO | null) => void;
  onClearPin: () => void;
  onOpenAddFinding: (node: AnatomyNode, pt?: ExactPointDTO) => void;
  onAddDefaultFinding?: () => void;
  subtitle: string;
  canEdit?: boolean;
}

export function AnatomicalLocatorCard({
  view,
  onViewChange,
  variant,
  mode,
  onModeChange,
  selectedNode,
  onSelectNode,
  findings,
  onMarkerClick,
  exactPoint,
  onSelectExactPoint,
  onClearPin,
  onOpenAddFinding,
  subtitle,
  canEdit = true,
}: AnatomicalLocatorCardProps) {
  return (
    <Card className="lg:col-span-7" variant="surface">
      <CardHeader className="pb-1">
        <div>
          <Text size="md" weight="semibold">
            Anatomical Locator
          </Text>
          <div className="flex items-center gap-2 mt-0.5">
            <Text size="sm" weight="medium" variant="subdued">
              {subtitle}
            </Text>
            <Text variant="muted">•</Text>
            <Text size="sm" variant="subdued">
              {view} View
            </Text>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1 pb-6 space-y-4">
        <AnatomyNavigator
          view={view}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          onOpenAddFinding={canEdit ? (node) => onOpenAddFinding(node) : undefined}
        />

        <BodyMapCanvas
          view={view}
          onViewChange={onViewChange}
          variant={variant}
          mode={mode}
          onModeChange={onModeChange}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          findings={findings}
          onMarkerClick={(findings) => onMarkerClick(findings)}
          activeExactPoint={exactPoint}
          onSelectExactPoint={(node, pt) => {
            onSelectExactPoint(node, pt);
          }}
          onClearPin={onClearPin}
          onOpenAddFinding={canEdit ? onOpenAddFinding : undefined}
          canEdit={canEdit}
        />
      </CardContent>
    </Card>
  );
}

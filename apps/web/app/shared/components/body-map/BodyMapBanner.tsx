"use client";

import { Plus } from "lucide-react";
import type { BodyMapViewType, AnatomyNode } from "@repo/schema";
import { Card, Button } from "@repo/ui/components/ui";
import { BodyMapBreadcrumb } from "./BodyMapBreadcrumb";

interface BodyMapBannerProps {
  view: BodyMapViewType;
  selectedAnatomyId: string | null;
  onSelectNode: (node: AnatomyNode | null) => void;
  onReset: () => void;
  onAddDefaultFinding: () => void;
}

export function BodyMapBanner({
  view,
  selectedAnatomyId,
  onSelectNode,
  onReset,
  onAddDefaultFinding,
}: BodyMapBannerProps) {
  return (
    <Card
      variant="surface"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex-1">
        <BodyMapBreadcrumb
          view={view}
          selectedAnatomyId={selectedAnatomyId}
          onSelectNode={onSelectNode}
          onReset={onReset}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onAddDefaultFinding} className="gap-1.5 shadow-xs">
          <Plus className="size-3.5" />
          Add Finding
        </Button>
      </div>
    </Card>
  );
}

"use client";

import React, { useMemo } from "react";
import { Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { ChevronRight, ArrowLeft } from "lucide-react";
import {
  getAnatomyForView,
  getAnatomyAncestors,
  ANATOMY_BY_ID,
  type AnatomyNode,
} from "@repo/schema";
import { AnatomySearchBar } from "./AnatomySearchBar";

interface AnatomyNavigatorProps {
  view: "Front" | "Back";
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode | null) => void;
  onOpenAddFinding?: (node: AnatomyNode) => void;
}

export function AnatomyNavigator({
  view,
  selectedNode,
  onSelectNode,
  onOpenAddFinding: _onOpenAddFinding,
}: AnatomyNavigatorProps) {
  const viewNodes = useMemo(() => getAnatomyForView(view), [view]);

  // 4 Top-level Regions
  const regionNodes = useMemo(
    () => viewNodes.filter((n) => n.level === "region"),
    [viewNodes],
  );

  // Active Ancestors of currently selected node
  const ancestors = useMemo(() => {
    if (!selectedNode) return [];
    return getAnatomyAncestors(selectedNode.id);
  }, [selectedNode]);

  // Determine which of the 4 top-level regions is currently active
  const activeRegionId = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.level === "region") return selectedNode.id;
    const regionAncestor = ancestors.find((a) => a.level === "region");
    return regionAncestor?.id ?? null;
  }, [selectedNode, ancestors]);

  // Child sub-parts of the currently selected node
  const childNodes = useMemo(() => {
    if (!selectedNode) return [];
    return viewNodes.filter((n) => n.parentId === selectedNode.id);
  }, [selectedNode, viewNodes]);

  // Navigate back one level in the hierarchy
  const handleBack = () => {
    if (!selectedNode) return;
    if (selectedNode.level === "region" || !selectedNode.parentId) {
      onSelectNode(null);
    } else {
      const parent = ANATOMY_BY_ID.get(selectedNode.parentId) ?? null;
      onSelectNode(parent);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Line 1: Search bar in one line with model floating dropdown */}
      <AnatomySearchBar
        viewNodes={viewNodes}
        onSelectNode={(node) => onSelectNode(node)}
      />

      {/* Line 2: Select Anatomical Region: font size matched to Anatomical Locator */}
      <div className="flex items-center justify-between px-0.5">
        <Text size="md" weight="semibold">
          Select Anatomical Region:
        </Text>
        {selectedNode && (
          <button
            type="button"
            onClick={() => onSelectNode(null)}
            className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
          >
            Reset Region
          </button>
        )}
      </div>

      {/* Line 3: 4 options in one line (head & neck / torso / upper limbs / lower limbs) */}
      <div className="grid grid-cols-4 gap-2">
        {regionNodes.map((region) => {
          const isSelected = activeRegionId === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => {
                if (selectedNode?.id === region.id) {
                  onSelectNode(null);
                } else {
                  onSelectNode(region);
                }
              }}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 text-sm rounded-xl border transition-all cursor-pointer text-left min-w-0 shadow-2xs",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                  : "border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-medium",
              )}
            >
              <span className="truncate pr-1">{region.label}</span>
              <ChevronRight
                className={cn(
                  "size-3 shrink-0 transition-transform",
                  isSelected ? "text-primary rotate-90" : "text-slate-400",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Line 4: Sub-parts expanded directly below the anatomical region buttons */}
      {selectedNode && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-sm text-slate-600 font-medium">
              Sub-parts of {selectedNode.label}:
            </span>
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
            >
              <ArrowLeft className="size-3" />
              <span>Back</span>
            </button>
          </div>

          {childNodes.length === 0 ? (
            <Text size="sm" variant="muted" className="italic py-1">
              Deepest detail level reached ({selectedNode.label}).
            </Text>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {childNodes.map((child) => {
                const isChildActive = selectedNode?.id === child.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelectNode(child)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border transition-colors text-left text-sm font-medium cursor-pointer shadow-2xs",
                      isChildActive
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                        : "border-slate-200/90 bg-white hover:bg-primary/10 hover:border-primary/40 text-slate-700",
                    )}
                  >
                    <span className="truncate pr-1">{child.label}</span>
                    <ChevronRight
                      className={cn(
                        "size-3 shrink-0",
                        isChildActive ? "text-primary" : "text-slate-400",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

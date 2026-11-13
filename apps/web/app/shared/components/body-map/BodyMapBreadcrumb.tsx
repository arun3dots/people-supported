"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Badge,
} from "@repo/ui/components/ui";
import { getAnatomyAncestors, type AnatomyNode } from "@repo/schema";

interface BodyMapBreadcrumbProps {
  view: "Front" | "Back";
  selectedAnatomyId: string | null;
  onSelectNode: (node: AnatomyNode | null) => void;
  onReset: () => void;
}

export function BodyMapBreadcrumb({
  view,
  selectedAnatomyId,
  onSelectNode,
  onReset,
}: BodyMapBreadcrumbProps) {
  const ancestors = selectedAnatomyId
    ? getAnatomyAncestors(selectedAnatomyId)
    : [];

  return (
    <div className="flex items-center justify-between gap-3 w-full bg-slate-50/70 border border-slate-200/80 rounded-xl px-3.5 py-2">
      <Breadcrumb>
        <BreadcrumbList className="text-md sm:gap-1.5 flex-wrap">
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="cursor-pointer font-medium text-slate-600 hover:text-blue-600"
            >
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={onReset}
              >
                Full Body ({view})
              </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {ancestors.map((node, idx) => {
            const isLast = idx === ancestors.length - 1;
            return (
              <React.Fragment key={node.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-900 border-blue-200 font-semibold px-2 py-0.5"
                      >
                        {node.label}
                      </Badge>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="cursor-pointer text-slate-600 hover:text-blue-600"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => onSelectNode(node)}
                      >
                        {node.label}
                      </Button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {selectedAnatomyId && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          title="Reset to full body"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}

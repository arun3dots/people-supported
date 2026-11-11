"use client";

import React from "react";
import { Badge, Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { ChevronRight } from "lucide-react";

export interface CarePlanSectionNavProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  goalCount: number;
  taskCount?: number;
}

interface SectionItem {
  id: string;
  title: string;
  status: string;
  isComplete: boolean;
  requiredNote?: string;
}

export function CarePlanSectionNav({
  activeSection,
  onSelectSection,
  goalCount,
  taskCount = 0,
}: CarePlanSectionNavProps) {
  const sections: SectionItem[] = [
    { id: "history", title: "Personal history", status: "Complete", isComplete: true },
    { id: "preferences", title: "Preferences", status: "Complete", isComplete: true },
    { id: "needs", title: "Needs", status: "Complete", isComplete: true },
    { id: "goals", title: "Goals", status: goalCount > 0 ? "Complete" : "0/1 required", isComplete: goalCount > 0 },
    { id: "tasks", title: "Tasks & Routines", status: taskCount > 0 ? `${taskCount} scheduled` : "0 scheduled", isComplete: taskCount > 0 },
    { id: "risk", title: "Risk summary", status: "0/1 required", isComplete: false, requiredNote: "1 required" },
    { id: "consent", title: "Involvement & consent", status: "Complete", isComplete: true },
    { id: "version_history", title: "Version history", status: "Audit log", isComplete: true },
  ];

  const incompleteSections = sections.filter((s) => !s.isComplete);
  const missingCount = incompleteSections.length;

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={cn(
                "w-full p-2.5 flex items-center justify-between rounded-xl transition-all text-left border gap-2 cursor-pointer",
                isActive
                  ? "bg-emerald-50/80 border-emerald-600 shadow-xs"
                  : "bg-white border-slate-200 hover:border-emerald-300"
              )}
            >
              {/* Left Details */}
              <div className="flex flex-col min-w-0 gap-0.5">
                <Text
                  size="sm"
                  weight={isActive ? "semibold" : "medium"}
                  className={cn("truncate", isActive ? "text-emerald-950" : "text-slate-900")}
                >
                  {sec.title}
                </Text>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    state={sec.isComplete ? "success" : "warning"}
                    className="px-1.5 py-0 text-sm shadow-none"
                  >
                    {sec.status}
                  </Badge>
                </div>
              </div>

              {/* Right Chevron */}
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-emerald-700" : "text-slate-400"
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="pt-2 px-2 border-t border-slate-200/80">
        <Text size="sm" variant="muted">
          {missingCount > 0
            ? `${missingCount} required item${missingCount > 1 ? "s" : ""} missing across ${missingCount} section${missingCount > 1 ? "s" : ""}.`
            : "All required sections completed."}
        </Text>
      </div>
    </div>
  );
}

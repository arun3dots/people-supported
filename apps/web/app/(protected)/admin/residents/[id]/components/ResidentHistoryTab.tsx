"use client";

import React, { useState } from "react";
import { CheckSquare, Clock, FileText } from "lucide-react";
import { Button, Card } from "@repo/ui/components/ui";
import type { Resident } from "../../../../../../lib/types/resident";
import { ResidentTimelineTab } from "./ResidentTimelineTab";
import { ResidentNotesTab } from "./ResidentNotesTab";
import { ResidentRecordTasks } from "./record";

interface ResidentHistoryTabProps {
  resident: Resident;
  isReadOnly?: boolean;
  initialSubTab?: "timeline" | "notes" | "tasks";
}

export function ResidentHistoryTab({
  resident,
  isReadOnly = false,
  initialSubTab = "timeline",
}: ResidentHistoryTabProps): React.JSX.Element {
  const [subTab, setSubTab] = useState<"timeline" | "notes" | "tasks">(initialSubTab);

  const subTabs = [
    { id: "timeline" as const, label: "Care Timeline", icon: Clock },
    { id: "notes" as const, label: "Shift & Daily Notes", icon: FileText },
    { id: "tasks" as const, label: "Daily Tasks & Logs", icon: CheckSquare },
  ];

  return (
    <div className="space-y-5 font-sans">
      <Card variant="surface" className="p-2 flex flex-row flex-wrap items-center gap-2">
        {subTabs.map((item) => {
          const Icon = item.icon;
          const active = subTab === item.id;
          return (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={active ? "primary" : "ghost"}
              onClick={() => setSubTab(item.id)}
              className="gap-2"
            >
              <Icon className="size-3.5" />
              {item.label}
            </Button>
          );
        })}
      </Card>

      {subTab === "timeline" && <ResidentTimelineTab residentId={resident.id} />}
      {subTab === "notes" && (
        <ResidentNotesTab
          resident={resident}
          residentId={resident.id}
          readOnly={isReadOnly}
        />
      )}
      {subTab === "tasks" && <ResidentRecordTasks residentId={resident.id} />}
    </div>
  );
}

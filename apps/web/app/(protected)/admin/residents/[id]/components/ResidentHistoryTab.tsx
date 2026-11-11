"use client";

import React, { useState } from "react";
import { CheckSquare, Clock, FileText } from "lucide-react";
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-wrap items-center gap-2 shadow-2xs">
        {subTabs.map((item) => {
          const Icon = item.icon;
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`px-4 py-2 rounded-xl text-md font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                active
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

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

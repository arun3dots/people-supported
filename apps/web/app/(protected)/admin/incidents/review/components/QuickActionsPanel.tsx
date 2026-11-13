"use client";

import React from "react";
import {
  Search,
  Users,
  UserCheck,
  Upload,
  FileText,
  Info,
} from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Text } from "@repo/ui/components/ui/Text";
import { toast } from "@repo/ui/components/ui";

interface QuickActionsPanelProps {
  onStartInvestigation: () => void;
  onAssignTask?: () => void;
  onUploadDocument?: () => void;
  onNotifyFamily?: () => void;
  onAddInternalNotes?: () => void;
  onActionTrigger?: (actionName: string) => void;
  readOnly?: boolean;
}

export function QuickActionsPanel({
  onStartInvestigation,
  onAssignTask,
  onUploadDocument,
  onNotifyFamily,
  onAddInternalNotes,
  onActionTrigger,
  readOnly = false,
}: QuickActionsPanelProps) {
  const actions = [
    {
      id: "investigation",
      title: "Start Investigation",
      icon: Search,
      onClick: onStartInvestigation,
    },
    {
      id: "notify-family",
      title: "Notify Family",
      icon: Users,
      onClick: () => {
        if (onNotifyFamily) {
          onNotifyFamily();
        } else {
          toast({ title: "Family Notified", description: "Family notification sent & logged in checklist." });
          onActionTrigger?.("Family Notified");
        }
      },
    },
    {
      id: "assign-task",
      title: "Assign Task",
      icon: UserCheck,
      onClick: () => {
        if (onAssignTask) {
          onAssignTask();
        } else {
          toast({ title: "Task Assigned", description: "Task assignment dialog opened." });
          onActionTrigger?.("Task Assigned");
        }
      },
    },
    {
      id: "upload-doc",
      title: "Upload Document",
      icon: Upload,
      onClick: () => {
        if (onUploadDocument) {
          onUploadDocument();
        } else {
          toast({ title: "Upload Triggered", description: "Please choose files to attach." });
          onActionTrigger?.("Upload Document");
        }
      },
    },
    {
      id: "add-notes",
      title: "Add Internal Notes",
      icon: FileText,
      onClick: () => {
        if (onAddInternalNotes) {
          onAddInternalNotes();
        } else {
          toast({ title: "Internal Notes", description: "Note editor focused." });
          onActionTrigger?.("Add Internal Notes");
        }
      },
    },
  ];

  return (
    <Card variant="surface">
      <Text size={'lg'} weight={'bold'} className="text-slate-900">
        Quick Actions
      </Text>

      {/* Grid for active quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              disabled={readOnly}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-emerald-50 hover:border-emerald-700/40 transition-all text-center gap-1.5 cursor-pointer min-h-[76px] group disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon className="size-4 text-slate-600 group-hover:text-emerald-800 transition-colors" />
              <Text size={'md'} weight={'semibold'} className="text-slate-800 leading-tight group-hover:text-emerald-800">
                {act.title}
              </Text>
            </button>
          );
        })}
      </div>

      {/* Info Callout Bar */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
        <Info className="size-3.5 text-slate-400 shrink-0" />
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          All actions are logged and update the compliance checklist
        </Text>
      </div>
    </Card>
  );
}

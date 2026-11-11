"use client";

import React from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  ShieldCheck,
  SquarePen,
  Paperclip,
  Mail,
} from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/Avatar";
import { Incident } from "../../../../../../lib/types/incident";

interface AssignTaskPreviewProps {
  title: string;
  description: string;
  assignedTo: string;
  assignedRole: string;
  priority: "High" | "Medium" | "Low";
  taskDate: string;
  taskTime: string;
  attachedFilesCount: number;
  notifyEmail: boolean;
  incident: Incident;
  onEdit: () => void;
  onConfirm: () => void;
}

export function AssignTaskPreview({
  title,
  description,
  assignedTo,
  assignedRole,
  priority,
  taskDate,
  taskTime,
  attachedFilesCount,
  notifyEmail,
  incident,
  onEdit,
  onConfirm,
}: AssignTaskPreviewProps) {
  return (
    <div className="space-y-4">
      <DialogHeader className="text-left space-y-1">
        <DialogTitle className="text-xl font-bold text-text-heading">
          Assign Task
        </DialogTitle>
        <DialogDescription className="text-md text-text-description">
          Assign a task to a staff member or team to complete specific actions
          related to this incident.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3.5 pr-1">
        {/* Task Summary Card */}
        <div className="bg-slate-50/70 border border-[#E5E5E5] rounded-xl p-4 space-y-3 relative">
          <button
            type="button"
            onClick={onEdit}
            className="absolute top-3.5 right-3.5 size-7 rounded-lg border border-[#D1D1D1] bg-white flex items-center justify-center text-slate-500 hover:text-[#4A706A] hover:border-[#4A706A] transition-colors cursor-pointer"
          >
            <SquarePen className="size-3.5" />
          </button>

          <h4 className="text-md font-bold text-[#141F1E]">Task Summary</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-md">
            <div>
              <p className="text-md text-text-description font-normal">
                Task Title
              </p>
              <p className="font-semibold text-slate-800 pt-0.5">{title}</p>
            </div>
            <div>
              <p className="text-md text-text-description font-normal">
                Task Description
              </p>
              <p className="text-slate-600 text-md leading-relaxed pt-0.5">
                {description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAEAEA] text-md">
            <div>
              <p className="text-md text-text-description font-normal">
                Priority
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 font-medium text-red-500">
                <span className="size-1.5 rounded-full bg-red-500" />
                <span>{priority}</span>
              </div>
            </div>
            <div>
              <p className="text-md text-text-description font-normal">
                Assigned To
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Avatar className="size-6">
                  <AvatarImage src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80" />
                  <AvatarFallback className="text-md bg-slate-200">
                    {assignedTo.slice(0, 2).toUpperCase() || "ST"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-md leading-tight">
                  <span className="font-medium text-slate-800">
                    {assignedTo}
                  </span>
                  {assignedRole && (
                    <span className="text-md text-slate-500 block">
                      ({assignedRole})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAEAEA] text-md">
            <div>
              <p className="text-md text-text-description font-normal">
                Date
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 text-slate-700 text-md">
                <Calendar className="size-3 text-slate-400" />
                <span>{taskDate}</span>
              </div>
            </div>
            <div>
              <p className="text-md text-text-description font-normal">
                Time
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 text-slate-700 text-md">
                <Clock className="size-3 text-slate-400" />
                <span>{taskTime}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAEAEA] text-md">
            <div>
              <p className="text-md text-text-description font-normal">
                Attachments
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 text-slate-700 text-md">
                <Paperclip className="size-3 text-slate-400" />
                <span>{attachedFilesCount} Files attached</span>
              </div>
            </div>
            <div>
              <p className="text-md text-text-description font-normal">
                Notify Assignee
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 text-slate-700 text-md">
                <Mail className="size-3 text-slate-400" />
                <span>
                  {notifyEmail
                    ? "Email Notification Enabled"
                    : "No Notification"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Reference Card */}
        <div className="bg-slate-50/70 border border-[#E5E5E5] rounded-xl p-3.5 space-y-2">
          <p className="text-md font-bold text-slate-800">
            Incident Reference
          </p>
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <AlertCircle className="size-4" />
            </div>
            <div className="space-y-0.5 text-md">
              <p className="font-bold text-slate-800">{incident.title}</p>
              <div className="flex items-center gap-2 text-md text-text-description">
                <span>#{incident.incidentNumber}</span>
                <span>•</span>
                <span>
                  📅{" "}
                  {incident.incidentDate
                    ? new Date(incident.incidentDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : ""}{" "}
                  {incident.incidentTime || ""}
                </span>
              </div>
              <p className="text-md text-slate-600">
                Reported by:{" "}
                <span className="font-medium">
                  {incident.reportedBy?.fullName || "Staff Member"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F0F5F4] border border-[#C5D6D3] text-md text-[#2A4B46]">
          <ShieldCheck className="size-4 text-[#4A706A] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-md">Compliance Note</p>
            <p className="text-md text-[#3D5E59] leading-tight">
              This task will be logged and tracked under the incident record for
              compliance and audit purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="h-10 px-5 border-[#D1D1D1] text-text-body rounded-xl text-md font-medium hover:bg-slate-50 cursor-pointer"
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onConfirm}
          className="h-10 px-6 bg-[#4A706A] hover:bg-[#3D5E59] text-white rounded-xl text-md font-medium cursor-pointer"
        >
          Assign Task
        </Button>
      </div>
    </div>
  );
}

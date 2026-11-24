"use client";

import React, { useMemo } from "react";
import { Clock } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/Dialog";
import { Input } from "@repo/ui/components/ui/Input";
import { Label } from "@repo/ui/components/ui/Label";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import { Button } from "@repo/ui/components/ui/Button";
import { Checkbox } from "@repo/ui/components/ui/CheckBox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { DatePicker } from "@repo/ui/components/ui";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";
import {
  TaskAttachmentPicker,
  TaskAttachmentItem,
} from "./TaskAttachmentPicker";

interface AssignTaskFormProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  assignedTo: string;
  setAssignedTo: (val: string) => void;
  assignedToId: string;
  setAssignedToId: (val: string) => void;
  assignedToEmail: string;
  setAssignedToEmail: (val: string) => void;
  setAssignedToAvatarUrl: (val: string) => void;
  setAssignedRole: (val: string) => void;
  priority: "High" | "Medium" | "Low";
  setPriority: (val: "High" | "Medium" | "Low") => void;
  taskDate: string;
  setTaskDate: (val: string) => void;
  taskTime: string;
  setTaskTime: (val: string) => void;
  notifyEmail: boolean;
  setNotifyEmail: (val: boolean) => void;
  attachments: TaskAttachmentItem[];
  setAttachments: React.Dispatch<React.SetStateAction<TaskAttachmentItem[]>>;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AssignTaskForm({
  title,
  setTitle,
  description,
  setDescription,
  assignedTo,
  setAssignedTo,
  assignedToId,
  setAssignedToId,
  assignedToEmail: _assignedToEmail,
  setAssignedToEmail,
  setAssignedToAvatarUrl,
  setAssignedRole,
  priority,
  setPriority,
  taskDate,
  setTaskDate,
  taskTime,
  setTaskTime,
  notifyEmail,
  setNotifyEmail,
  attachments,
  setAttachments,
  onSubmit,
  onCancel,
}: AssignTaskFormProps) {
  const { data: staff = [], isLoading: isStaffLoading } = useGetStaffQuery();
  const activeAdminStaff = useMemo(() => {
    return staff.filter((member) => {
      if (!member.isActive) return false;
      const roleName = member.role?.name?.trim().toUpperCase() || "";
      if (
        roleName === "CARER" ||
        roleName === "NURSE" ||
        roleName === "RESIDENT" ||
        roleName.includes("CARER") ||
        roleName.includes("NURSE")
      ) {
        return false;
      }
      return (
        roleName === "ADMIN" ||
        roleName === "SUPERADMIN" ||
        roleName === "MANAGER" ||
        roleName.includes("ADMIN") ||
        roleName.includes("MANAGER")
      );
    });
  }, [staff]);

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

      <div className="space-y-4 pr-1">
        {/* Task Title */}
        <div className="space-y-1.5">
          <Label required>
            Task Title
          </Label>
          <div className="relative">
            <Input
              type="text"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value.slice(0, 150))}
              placeholder="Enter the Task"
              className="h-10 bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body px-3 pr-16"
            />
            <span
              className={`absolute right-3 top-3 text-md ${
                title.length >= 150 ? "text-amber-600 font-medium" : "text-slate-400"
              }`}
            >
              {title.length}/150
            </span>
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-1.5">
          <Label required>
            Task Description
          </Label>
          <div className="relative">
            <Textarea
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="Describe the task in details..."
              rows={3}
              className="min-h-[85px] bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body p-3 focus-visible:ring-1 focus-visible:ring-primary/20 pr-16"
            />
            <span
              className={`absolute bottom-2.5 right-3 text-md ${
                description.length >= 1000 ? "text-amber-600 font-medium" : "text-slate-400"
              }`}
            >
              {description.length}/1000
            </span>
          </div>
        </div>

        {/* Row: Assigned To & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required>
              Assigned To
            </Label>
            <Select
              value={assignedToId || assignedTo}
              onValueChange={(val) => {
                const selectedStaff = activeAdminStaff.find(
                  (member) => member.id === val || member.fullName === val,
                );
                if (selectedStaff) {
                  setAssignedToId(selectedStaff.id);
                  setAssignedTo(selectedStaff.fullName);
                  setAssignedToEmail(selectedStaff.email);
                  setAssignedRole(selectedStaff.role?.name || "Admin");
                  setAssignedToAvatarUrl(selectedStaff.avatarUrl || "");
                }
              }}
            >
              <SelectTrigger className="h-10 bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body">
                <SelectValue placeholder="Select admin user" />
              </SelectTrigger>
              <SelectContent>
                {isStaffLoading ? (
                  <SelectItem value="__loading" disabled>
                    Loading admin users...
                  </SelectItem>
                ) : activeAdminStaff.length > 0 ? (
                  activeAdminStaff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName} ({member.role.name})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none" disabled>
                    No active admin users available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label required>
              Priority
            </Label>
            <Select
              value={priority}
              onValueChange={(val) =>
                setPriority(val as "High" | "Medium" | "Low")
              }
            >
              <SelectTrigger className="h-10 bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span>High</span>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="Low">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Low</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row: Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required>
              Date
            </Label>
            <DatePicker
              value={taskDate}
              onChange={(d) =>
                setTaskDate(d ? (d.toISOString().split("T")[0] ?? "") : "")
              }
              placeholder="Select date"
            />
          </div>

          <div className="space-y-1.5">
            <Label required>
              Time
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                placeholder="e.g. 12:00 PM"
                className="h-10 bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body pr-8"
              />
              <Clock className="size-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <TaskAttachmentPicker
          attachments={attachments}
          setAttachments={setAttachments}
        />

        {/* Email Notification Checkbox */}
        <div className="flex items-center gap-2.5 pt-1">
          <Checkbox
            id="notify-email"
            checked={notifyEmail}
            onCheckedChange={(checked) => setNotifyEmail(Boolean(checked))}
          />
          <label
            htmlFor="notify-email"
            className="text-md text-slate-800 font-medium cursor-pointer select-none"
          >
            Notify task assigning via email
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 px-5 border-[#D1D1D1] text-text-body rounded-xl text-md font-medium hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          className="h-10 px-6 bg-[#4A706A] hover:bg-[#3D5E59] text-white rounded-xl text-md font-medium cursor-pointer"
        >
          Assign Task
        </Button>
      </div>
    </div>
  );
}

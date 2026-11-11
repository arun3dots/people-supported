"use client";

import React, { useRef } from "react";
import { Calendar, Clock, Upload } from "lucide-react";
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
import { toast, DatePicker } from "@repo/ui/components/ui";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";

interface AssignTaskFormProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  assignedTo: string;
  setAssignedTo: (val: string) => void;
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
  setAttachedFilesCount: React.Dispatch<React.SetStateAction<number>>;
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
  setAttachedFilesCount,
  onSubmit,
  onCancel,
}: AssignTaskFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: staff = [], isLoading: isStaffLoading } = useGetStaffQuery();
  const activeStaff = staff.filter((member) => member.isActive);

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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the Task"
              className="h-10 bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body px-3 pr-16"
            />
            <span className="absolute right-3 top-3 text-md text-slate-400">
              {title.length}/250
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in details..."
              rows={3}
              className="min-h-[85px] bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body p-3 focus-visible:ring-1 focus-visible:ring-primary/20 pr-16"
            />
            <span className="absolute bottom-2.5 right-3 text-md text-slate-400">
              {description.length}/250
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
              value={assignedTo}
              onValueChange={(val) => {
                setAssignedTo(val);
                const selectedStaff = activeStaff.find(
                  (member) => member.fullName === val,
                );
                setAssignedRole(selectedStaff?.role.name || "Staff");
                setAssignedToAvatarUrl(selectedStaff?.avatarUrl || "");
              }}
            >
              <SelectTrigger className="h-10 bg-white border border-[#D1D1D1] rounded-xl text-md text-text-body">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {isStaffLoading ? (
                  <SelectItem value="__loading" disabled>
                    Loading staff...
                  </SelectItem>
                ) : activeStaff.length > 0 ? (
                  activeStaff.map((member) => (
                    <SelectItem key={member.id} value={member.fullName}>
                      {member.fullName} ({member.role.name})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none" disabled>
                    No active staff available
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
        <div className="space-y-1.5">
          <Label>
            Attachments(Optional)
          </Label>
          <div className="border-2 border-dashed border-[#C5D6D3] rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <Upload className="size-5 text-[#4A706A] mb-1.5" />
            <p className="text-md font-medium text-slate-800">
              Drag and drop your file here
            </p>
            <p className="text-md text-text-description my-1">or</p>
            {/* Hidden real file input — BUG-036 fix */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const validFiles: File[] = [];
                  Array.from(files).forEach((file) => {
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "File too large",
                        description: `${file.name} exceeds the 10MB limit. Document must be smaller than 10MB.`,
                        variant: "destructive",
                      });
                    } else {
                      validFiles.push(file);
                    }
                  });

                  if (validFiles.length > 0) {
                    setAttachedFilesCount((prev) => prev + validFiles.length);
                    toast({
                      title: "File Attached",
                      description: `${validFiles.length} attachment${validFiles.length > 1 ? "s" : ""} added to task.`,
                    });
                  }
                }
                // reset so the same file can be re-selected
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-3 bg-white border border-[#4A706A] text-[#4A706A] hover:bg-[#F0F5F4] rounded-xl text-md font-medium shadow-none cursor-pointer"
            >
              Browse Files
            </Button>
            <p className="text-md text-text-description mt-2">
              Supported formats: PDF, JPG, PNG (Max: 10 MB)
            </p>
          </div>
        </div>

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

"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@repo/ui/components/ui/Dialog";
import { toast } from "@repo/ui/components/ui";
import { Incident } from "../../../../../../lib/types/incident";
import { AssignTaskForm } from "./AssignTaskForm";
import { AssignTaskPreview } from "./AssignTaskPreview";
import { AssignTaskSuccess } from "./AssignTaskSuccess";

export interface IncidentTask {
  id: string;
  title: string;
  description: string;
  assignedToName: string;
  assignedToAvatarUrl?: string;
  assignedToRole?: string;
  priority: "High" | "Medium" | "Low";
  date: string;
  time: string;
  attachmentCount?: number;
  notifyEmail?: boolean;
}

interface AssignTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: Incident;
  onTaskCreated?: (task: IncidentTask) => void;
}

type ModalViewMode = "form" | "preview" | "success";

export function AssignTaskModal({
  open,
  onOpenChange,
  incident,
  onTaskCreated,
}: AssignTaskModalProps) {
  const [viewMode, setViewMode] = useState<ModalViewMode>("form");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToAvatarUrl, setAssignedToAvatarUrl] = useState("");
  const [assignedRole, setAssignedRole] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [taskDate, setTaskDate] = useState<string>(
    () => new Date().toISOString().split("T")[0] ?? "",
  );
  const [taskTime, setTaskTime] = useState<string>(() =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [attachedFilesCount, setAttachedFilesCount] = useState(0);

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setAssignedToAvatarUrl("");
    setAssignedRole("");
    setPriority("Medium");
    setTaskDate(new Date().toISOString().split("T")[0] ?? "");
    setTaskTime(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setNotifyEmail(true);
    setAttachedFilesCount(0);
    setViewMode("form");
  };

  const handleFormSubmit = () => {
    const missingField = !title.trim()
      ? "Task Title"
      : !description.trim()
        ? "Task Description"
        : !assignedTo.trim()
          ? "Assigned To"
          : !taskDate.trim()
            ? "Date"
            : !taskTime.trim()
              ? "Time"
              : null;

    if (missingField) {
      toast({
        variant: "destructive",
        title: `${missingField} Required`,
        description: `Please complete the ${missingField.toLowerCase()} field before assigning the task.`,
      });
      return;
    }
    setViewMode("preview");
  };

  const handleConfirmAssignment = () => {
    const newTask: IncidentTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      assignedToName: assignedTo || "Staff Member",
      assignedToAvatarUrl: assignedToAvatarUrl || undefined,
      assignedToRole: assignedRole || "Care Staff",
      priority,
      date: taskDate,
      time: taskTime,
      attachmentCount: attachedFilesCount,
      notifyEmail,
    };

    onTaskCreated?.(newTask);
    setViewMode("success");
  };

  const handleClose = () => {
    handleResetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleResetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent size="2xl">
        {viewMode === "form" && (
          <AssignTaskForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            setAssignedToAvatarUrl={setAssignedToAvatarUrl}
            setAssignedRole={setAssignedRole}
            priority={priority}
            setPriority={setPriority}
            taskDate={taskDate}
            setTaskDate={setTaskDate}
            taskTime={taskTime}
            setTaskTime={setTaskTime}
            notifyEmail={notifyEmail}
            setNotifyEmail={setNotifyEmail}
            setAttachedFilesCount={setAttachedFilesCount}
            onSubmit={handleFormSubmit}
            onCancel={handleClose}
          />
        )}

        {viewMode === "preview" && (
          <AssignTaskPreview
            title={title}
            description={description}
            assignedTo={assignedTo}
            assignedRole={assignedRole}
            priority={priority}
            taskDate={taskDate}
            taskTime={taskTime}
            attachedFilesCount={attachedFilesCount}
            notifyEmail={notifyEmail}
            incident={incident}
            onEdit={() => setViewMode("form")}
            onConfirm={handleConfirmAssignment}
          />
        )}

        {viewMode === "success" && (
          <AssignTaskSuccess
            onClose={handleClose}
            onCreateAnother={handleResetForm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

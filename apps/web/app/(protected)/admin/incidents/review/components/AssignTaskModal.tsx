"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@repo/ui/components/ui/Dialog";
import { toast } from "@repo/ui/components/ui";
import { UPLOAD_INCIDENT_ATTACHMENT } from "@repo/endpoints";
import { makeAPICall } from "../../../../../../lib/api";
import { Incident } from "../../../../../../lib/types/incident";
import { AssignTaskForm } from "./AssignTaskForm";
import { AssignTaskPreview } from "./AssignTaskPreview";
import { AssignTaskSuccess } from "./AssignTaskSuccess";
import { TaskAttachmentItem } from "./TaskAttachmentPicker";

export interface IncidentTaskAttachment {
  id: string;
  name: string;
  url?: string;
  size?: number;
}

export interface IncidentTask {
  id: string;
  title: string;
  description: string;
  assignedToId?: string;
  assignedToName: string;
  assignedToEmail?: string;
  assignedToAvatarUrl?: string;
  assignedRole?: string;
  assignedToRole?: string;
  priority: "High" | "Medium" | "Low";
  date: string;
  time: string;
  attachments?: IncidentTaskAttachment[];
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
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedToEmail, setAssignedToEmail] = useState("");
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
  const [attachments, setAttachments] = useState<TaskAttachmentItem[]>([]);
  const [_isSubmitting, setIsSubmitting] = useState(false);

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setAssignedToId("");
    setAssignedToEmail("");
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
    setAttachments([]);
    setIsSubmitting(false);
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

    if (title.trim().length > 150) {
      toast({
        variant: "destructive",
        title: "Task Title Too Long",
        description: "Task title cannot exceed 150 characters.",
      });
      return;
    }

    if (description.trim().length > 1000) {
      toast({
        variant: "destructive",
        title: "Task Description Too Long",
        description: "Task description cannot exceed 1,000 characters.",
      });
      return;
    }

    setViewMode("preview");
  };

  const handleConfirmAssignment = async () => {
    setIsSubmitting(true);
    try {
      const uploadedAttachments: IncidentTaskAttachment[] = [];
      for (const att of attachments) {
        if (att.file && incident?.id) {
          const formData = new FormData();
          formData.append("file", att.file);
          const uploaded = await makeAPICall<{
            id: string;
            name: string;
            fileUrl: string;
            previewUrl?: string;
          }>(UPLOAD_INCIDENT_ATTACHMENT, formData, {}, { id: incident.id });

          uploadedAttachments.push({
            id: uploaded.id || att.id,
            name: uploaded.name || att.name,
            url: uploaded.previewUrl || uploaded.fileUrl,
            size: att.size,
          });
        } else {
          uploadedAttachments.push({
            id: att.id,
            name: att.name,
            url: att.url,
            size: att.size,
          });
        }
      }

      const newTask: IncidentTask = {
        id: `task-${Date.now()}`,
        title,
        description,
        assignedToId: assignedToId || undefined,
        assignedToName: assignedTo || "Staff Member",
        assignedToEmail: assignedToEmail || undefined,
        assignedToAvatarUrl: assignedToAvatarUrl || undefined,
        assignedRole: assignedRole || "Care Staff",
        assignedToRole: assignedRole || "Care Staff",
        priority,
        date: taskDate,
        time: taskTime,
        attachments: uploadedAttachments,
        attachmentCount: uploadedAttachments.length,
        notifyEmail,
      };

      onTaskCreated?.(newTask);
      setViewMode("success");
    } catch (err) {
      console.error("Failed to upload task attachments", err);
      toast({
        variant: "destructive",
        title: "Attachment Upload Failed",
        description: "Failed to upload task attachments. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            assignedToId={assignedToId}
            setAssignedToId={setAssignedToId}
            assignedToEmail={assignedToEmail}
            setAssignedToEmail={setAssignedToEmail}
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
            attachments={attachments}
            setAttachments={setAttachments}
            onSubmit={handleFormSubmit}
            onCancel={handleClose}
          />
        )}

        {viewMode === "preview" && (
          <AssignTaskPreview
            title={title}
            description={description}
            assignedTo={assignedTo}
            assignedToAvatarUrl={assignedToAvatarUrl}
            assignedRole={assignedRole}
            priority={priority}
            taskDate={taskDate}
            taskTime={taskTime}
            attachments={attachments}
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

"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { User, Clock, FileText, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import {
  Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, Label, Textarea, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Text,
} from "@repo/ui/components/ui";

export interface CareNoteItem {
  id: string;
  author: string;
  role: string;
  date: string;
  time: string;
  category: "General" | "Nutrition" | "Medical" | "Behavioral";
  content: string;
}

const NoteFormSchema = z.object({
  category: z.enum(["General", "Nutrition", "Medical", "Behavioral"], {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  content: z.string().trim().min(1, "Note description is required"),
});

// --- 1. Detail / Full View Modal ---

interface CareNoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: CareNoteItem | null;
  onEdit?: (note: CareNoteItem) => void;
  onDelete?: (noteId: string) => void;
}

export function CareNoteDetailDialog({
  open,
  onOpenChange,
  note,
  onEdit,
  onDelete,
}: CareNoteDetailDialogProps): React.JSX.Element | null {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <User className="size-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-md font-bold text-slate-900 truncate">
                  {note.author}
                </DialogTitle>
                <Text size="sm" weight="medium" className="text-slate-500 truncate">
                  {note.role}
                </Text>
              </div>
            </div>
            <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none shrink-0">
              {note.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 text-md leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto break-words break-all [overflow-wrap:anywhere]">
            {note.content}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Clock className="size-4 text-slate-400 shrink-0" />
            <span>
              Recorded on {note.date} at {note.time}
            </span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 w-full">
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onDelete(note.id);
                onOpenChange(false);
              }}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </Button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onEdit(note);
                  onOpenChange(false);
                }}
                className="rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="size-3.5" />
                <span>Edit Note</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- 2. Shared Form Dialog for Add & Edit ---

interface CareNoteFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialCategory?: CareNoteItem["category"] | "";
  initialContent?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (data: { category: CareNoteItem["category"]; content: string }) => Promise<void>;
}

export function CareNoteFormDialog({
  isOpen,
  onClose,
  title,
  initialCategory = "",
  initialContent = "",
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: CareNoteFormDialogProps): React.JSX.Element {
  const [category, setCategory] = useState<CareNoteItem["category"] | "">(initialCategory);
  const [content, setContent] = useState(initialContent);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCategory(initialCategory || "");
    setContent(initialContent);
    setErrors({});
  }, [initialCategory, initialContent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = NoteFormSchema.safeParse({ category, content });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit({ category: category as CareNoteItem["category"], content: content.trim() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="size-5 text-icon-primary" />
            <Text as="span" size="base" weight="semibold">{title}</Text>
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label required>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as CareNoteItem["category"]);
                if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
              }}
            >
              <SelectTrigger className={`w-full bg-white border-slate-200 rounded-xl text-slate-900 ${errors.category ? "border-border-error" : ""}`}>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="General">General Care</SelectItem>
                <SelectItem value="Nutrition">Nutrition &amp; Hydration</SelectItem>
                <SelectItem value="Medical">Medical / Clinical</SelectItem>
                <SelectItem value="Behavioral">Behavioural / Mood</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-text-error font-medium leading-tight mt-1">
                {errors.category}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label required>Note Description</Label>
            <Textarea
              rows={4}
              value={content}
              errorMessage={errors.content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
              }}
              placeholder="Enter detailed observations, meal intake, mood, or clinical notes..."
              className="w-full bg-white border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl cursor-pointer"
            >
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- 3. Edit Dialog Wrapper ---

export function EditCareNoteDialog({
  note,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: {
  note: CareNoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: CareNoteItem["category"]; content: string }) => Promise<void>;
  isSubmitting?: boolean;
}): React.JSX.Element | null {
  if (!note) return null;
  return (
    <CareNoteFormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Care Note"
      initialCategory={note.category}
      initialContent={note.content}
      submitLabel="Update Care Note"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}

// --- 4. Add Dialog Wrapper ---

export function AddCareNoteDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: CareNoteItem["category"]; content: string }) => Promise<void>;
  isSubmitting?: boolean;
}): React.JSX.Element {
  return (
    <CareNoteFormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Care Note"
      initialCategory=""
      initialContent=""
      submitLabel="Save Care Note"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}

export { DeleteCareNoteDialog, type DeleteCareNoteDialogProps } from "./CareNoteDeleteDialog";

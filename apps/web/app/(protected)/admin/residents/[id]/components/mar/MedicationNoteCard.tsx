"use client";

import React, { useState } from "react";
import { User, Clock, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import {
  Badge,
  Button,
  Textarea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui";
import {
  useUpdateCareNoteMutation,
  useDeleteCareNoteMutation,
} from "../../../../../../../lib/queries/residents";

export interface MedicationNoteEntry {
  id: string;
  author: string;
  role: string;
  dateStr: string;
  content: string;
  timestamp: string;
}

interface MedicationNoteCardProps {
  note: MedicationNoteEntry;
  residentId: string;
  onUpdate: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
}

export function MedicationNoteCard({
  note,
  residentId,
  onUpdate,
  onDelete,
}: MedicationNoteCardProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateMutation = useUpdateCareNoteMutation(residentId);
  const deleteMutation = useDeleteCareNoteMutation(residentId);

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === note.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        noteId: note.id,
        data: {
          category: "MedicationNote",
          content: editContent.trim(),
        },
      });
      onUpdate(note.id, editContent.trim());
      setIsEditing(false);
    } catch {
      // Handled by mutation toast
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(note.id);
      onDelete(note.id);
      setIsDeleteDialogOpen(false);
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <>
      <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs hover:border-slate-300 transition-colors">
        {/* Top Header: Author + Role + Date + Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <User className="size-3.5" />
            </div>
            <span className="text-md font-medium text-slate-900 truncate">
              {note.author}
            </span>
            <Badge variant="secondary" state="info" className="px-1.5 py-0 text-md shadow-none">
              {note.role}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-md text-slate-400 shrink-0">
              <Clock className="size-3" />
              <span>{note.dateStr}</span>
            </div>

            {/* Action buttons (Edit & Delete) */}
            {!isEditing && (
              <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                  onClick={() => {
                    setEditContent(note.content);
                    setIsEditing(true);
                  }}
                  title="Edit medication note"
                >
                  <Pencil className="size-3" />
                  <span className="sr-only">Edit note</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Delete medication note"
                >
                  <Trash2 className="size-3" />
                  <span className="sr-only">Delete note</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Note Body: Editable or View */}
        {isEditing ? (
          <div className="space-y-2 pl-8 pt-1">
            <Textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-white border-slate-300 text-md text-slate-900 focus:border-slate-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditContent(note.content);
                  setIsEditing(false);
                }}
                disabled={updateMutation.isPending}
                className="h-7 px-2.5 text-md text-slate-600"
              >
                <X className="size-3 mr-1" />
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || updateMutation.isPending}
                className="h-7 px-3 text-md gap-1"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Check className="size-3" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-md text-slate-700 whitespace-pre-wrap break-words break-all leading-relaxed pl-8">
            {note.content}
          </p>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-slate-900">
              Delete Medication Note?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-md text-slate-500">
              Are you sure you want to delete this medication note? This action will be recorded in the clinical audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="text-md h-8 px-4"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white text-md h-8 px-4 gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Note"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


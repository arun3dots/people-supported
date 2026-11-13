"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { z } from "zod";
import { FileText, Plus, Loader2, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import {
  useGetResidentTimelineQuery,
  useCreateCareNoteMutation,
} from "../../../../../../../lib/queries/residents";
import { MedicationNoteCard, MedicationNoteEntry } from "./MedicationNoteCard";

interface MedicationNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId?: string;
  specialRequirements?: string | null;
}

interface TimelineItemShape {
  id: string;
  isDailyTask?: boolean;
  summary?: string;
  notes?: string;
  eventType?: string;
  timestamp: string;
  carer?: {
    fullName?: string;
    role?: { name?: string };
  };
}

const MedicationNoteSchema = z.object({
  content: z.string().trim().min(1, "Medication note cannot be empty"),
});

export function MedicationNotesDialog({
  open,
  onOpenChange,
  residentId = "",
  specialRequirements,
}: MedicationNotesDialogProps): React.JSX.Element {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<MedicationNoteEntry[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({});

  const { data: timelineData, isLoading } = useGetResidentTimelineQuery(residentId);
  const createNoteMutation = useCreateCareNoteMutation(residentId);

  // Extract ONLY user-added medication notes (strict filter: exclude all timeline/audit/system events)
  const serverNotes: MedicationNoteEntry[] = useMemo(() => {
    if (!timelineData || !Array.isArray(timelineData)) return [];
    return (timelineData as TimelineItemShape[])
      .filter((item) => {
        // Exclude daily tasks
        if (item.isDailyTask) return false;

        const summary = (item.summary || item.notes || "").trim();
        // Exclude system timeline entries (Risk assessments, medication round audit logs, etc.)
        if (
          summary.startsWith("Risk assessment") ||
          summary.includes("marked as Given") ||
          summary.includes("marked as Refused") ||
          summary.includes("marked as Omitted") ||
          summary.includes("marked as Discontinued") ||
          summary.includes("marked as Taken") ||
          summary.startsWith("Admission") ||
          summary.startsWith("Vital signs")
        ) {
          return false;
        }

        const evt = (item.eventType || "").toLowerCase();
        // ONLY match explicit medication notes or user care notes marked as Medical/MedicationNote
        return evt === "medicationnote" || evt === "medical";
      })
      .map((item) => {
        const itemDate = new Date(item.timestamp);
        return {
          id: item.id,
          author: item.carer?.fullName || "Staff Member",
          role: item.carer?.role?.name || "Care Staff",
          dateStr: format(itemDate, "dd MMM yyyy, HH:mm"),
          content: item.summary || item.notes || "",
          timestamp: item.timestamp,
        };
      })
      .filter((item) => Boolean(item.content.trim()));
  }, [timelineData]);

  // Combine and deduplicate local + server notes
  const allNotes = useMemo(() => {
    const combined = [...localNotes, ...serverNotes];
    const seen = new Set<string>();
    const unique: MedicationNoteEntry[] = [];
    for (const note of combined) {
      if (deletedIds.has(note.id)) continue;
      if (!seen.has(note.id)) {
        seen.add(note.id);
        unique.push({
          ...note,
          content: editedNotes[note.id] ?? note.content,
        });
      }
    }
    unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return unique;
  }, [localNotes, serverNotes, deletedIds, editedNotes]);

  const handleUpdateNote = (id: string, newContent: string) => {
    setEditedNotes((prev) => ({ ...prev, [id]: newContent }));
  };

  const handleDeleteNote = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  };

  const handleSaveNote = async () => {
    if (!residentId) return;
    setNoteError(null);

    const validation = MedicationNoteSchema.safeParse({ content: newNote });
    if (!validation.success) {
      setNoteError(validation.error.issues[0]?.message || "Medication note cannot be empty");
      return;
    }

    const content = validation.data.content;

    try {
      const result = await createNoteMutation.mutateAsync({
        category: "MedicationNote",
        content,
      });

      const resObj = result as { id?: string } | undefined;
      const createdNote: MedicationNoteEntry = {
        id: resObj?.id || `local-${Date.now()}`,
        author: "Current User",
        role: "Nurse / Carer",
        dateStr: format(new Date(), "dd MMM yyyy, HH:mm"),
        content,
        timestamp: new Date().toISOString(),
      };
      setLocalNotes((prev) => [createdNote, ...prev]);
      setNewNote("");
      setNoteError(null);
      setIsAdding(false);
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="max-w-2xl sm:max-w-2xl min-h-[480px] sm:min-h-[520px] flex flex-col justify-between">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
                <FileText className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Medication Notes &amp; Guidelines
                </DialogTitle>
                <DialogDescription className="text-md text-slate-500">
                  Special instructions, administration precautions, and medication notes.
                </DialogDescription>
              </div>
            </div>
            {!isAdding && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="gap-1.5 text-md border-emerald-300 text-emerald-800 hover:bg-emerald-50 h-8 rounded-xl"
              >
                <Plus className="size-3.5" />
                Add Note
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 flex-1 overflow-y-auto pr-1">
          {/* Add New Note Section */}
          {isAdding && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <Label className="text-md font-semibold text-emerald-900">
                  New Medication Note / Guideline
                </Label>
                <Badge variant="outline" className="text-md bg-white text-emerald-800 border-emerald-300">
                  MAR Note
                </Badge>
              </div>
              <Textarea
                rows={3}
                value={newNote}
                onChange={(e) => {
                  setNewNote(e.target.value);
                  if (noteError) setNoteError(null);
                }}
                placeholder="Enter administration guidelines, food/water instructions, crushing notes, or precautions..."
                className="bg-white border-slate-200 text-md text-slate-900 placeholder:text-slate-400"
                errorMessage={noteError || undefined}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewNote("");
                    setNoteError(null);
                  }}
                  disabled={createNoteMutation.isPending}
                  className="text-md"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={createNoteMutation.isPending}
                  className="gap-1.5 text-md"
                >
                  {createNoteMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Note"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Care Profile Special Requirements */}
          {specialRequirements && (
            <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-md font-semibold text-amber-900">
                <Sparkles className="size-3.5 text-amber-700" />
                <span>Care Profile Special Requirements</span>
              </div>
              <p className="text-md text-slate-700 whitespace-pre-wrap break-words leading-relaxed pl-5">
                {specialRequirements}
              </p>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Text as="span" weight="semibold" className="text-slate-700 font-semibold text-md">
                Recorded Notes ({allNotes.length})
              </Text>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="size-5 animate-spin mb-1 text-emerald-800" />
                <Text size="md">Loading notes...</Text>
              </div>
            ) : allNotes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <FileText className="size-6 mx-auto mb-1 opacity-50" />
                <Text size="md" weight="medium">No medication notes recorded yet</Text>
                <Text size="md" className="text-slate-400 mt-0.5">
                  Click &ldquo;Add Note&rdquo; above to record administration guidelines or instructions.
                </Text>
              </div>
            ) : (
              <div className="space-y-2">
                {allNotes.map((note) => (
                  <MedicationNoteCard
                    key={note.id}
                    note={note}
                    residentId={residentId}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-md h-8"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

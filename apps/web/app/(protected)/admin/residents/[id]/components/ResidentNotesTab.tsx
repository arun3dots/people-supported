"use client";

import React, { useState, useMemo } from "react";
import { FileText, Plus, Clock, User, Search, MessageSquare, Loader2, Edit2, Trash2 } from "lucide-react";
import { Card, Text, Badge, Button, Input } from "@repo/ui/components/ui";
import {
  useGetResidentTimelineQuery, useCreateCareNoteMutation,
  useUpdateCareNoteMutation, useDeleteCareNoteMutation,
} from "../../../../../../lib/queries/residents";
import {
  CareNoteDetailDialog, AddCareNoteDialog,
  EditCareNoteDialog, DeleteCareNoteDialog, type CareNoteItem,
} from "./CareNoteModals";

interface ResidentNotesTabProps {
  resident?: unknown;
  residentId?: string;
  readOnly?: boolean;
}

export function ResidentNotesTab({ resident, residentId, readOnly }: ResidentNotesTabProps = {}) {
  const actualResidentId = residentId || (resident as { id?: string })?.id || "";
  const { data: timelineData, isLoading } = useGetResidentTimelineQuery(actualResidentId);
  const createCareNoteMutation = useCreateCareNoteMutation(actualResidentId);
  const updateCareNoteMutation = useUpdateCareNoteMutation(actualResidentId);
  const deleteCareNoteMutation = useDeleteCareNoteMutation(actualResidentId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [selectedNoteForModal, setSelectedNoteForModal] = useState<CareNoteItem | null>(null);
  const [editingNote, setEditingNote] = useState<CareNoteItem | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const notes: CareNoteItem[] = useMemo(() => {
    if (!timelineData || !Array.isArray(timelineData)) return [];
    return timelineData.map((item: {
      id: string;
      eventType?: string;
      summary?: string;
      timestamp: string;
      carer?: { fullName?: string; role?: { name?: string } };
    }) => {
      let category: CareNoteItem["category"] = "General";
      const evt = (item.eventType || "").toLowerCase();
      if (/nutrition|fluid|diet/.test(evt)) category = "Nutrition";
      else if (/medical|obs|clinical/.test(evt)) category = "Medical";
      else if (/behavior|mood|mental/.test(evt)) category = "Behavioral";

      const itemDate = new Date(item.timestamp);
      const isToday = itemDate.toDateString() === new Date().toDateString();
      const dateStr = isToday
        ? "Today"
        : itemDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = itemDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return {
        id: item.id,
        author: item.carer?.fullName || "Staff Member",
        role: item.carer?.role?.name || "Care Staff",
        date: dateStr,
        time: timeStr,
        category,
        content: item.summary || "",
      };
    });
  }, [timelineData]);

  const handleAddNote = async (data: { category: CareNoteItem["category"]; content: string }) => {
    if (!data.content.trim() || !actualResidentId) return;
    try {
      await createCareNoteMutation.mutateAsync({ category: data.category, content: data.content.trim() });
      setIsAddDialogOpen(false);
    } catch { /* toast handled */ }
  };

  const handleUpdateNote = async (data: { category: CareNoteItem["category"]; content: string }) => {
    if (!editingNote) return;
    try {
      await updateCareNoteMutation.mutateAsync({ noteId: editingNote.id, data });
      setEditingNote(null);
    } catch { /* toast handled */ }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNoteId) return;
    try {
      await deleteCareNoteMutation.mutateAsync(deletingNoteId);
      setDeletingNoteId(null);
    } catch { /* toast handled */ }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const latestNote = notes[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Latest Care Note Highlight Card */}
      {latestNote ? (
        <Card
          border="secondary"
          onClick={() => setSelectedNoteForModal(latestNote)}
          style={{ border: "1px solid #cbd5e1" }}
          className="space-y-4 border border-slate-300 bg-white hover:border-slate-400 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-border-secondary pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-md bg-white border border-border-secondary flex items-center justify-center text-icon-primary shrink-0">
                <FileText className="size-4" />
              </div>
              <Text as="h3" size="base" weight="medium" className="text-slate-900">
                Latest Care Note
              </Text>
              <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
                {latestNote.category}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Text size="md" weight="regular" className="text-slate-500">
                By: <span className="font-medium text-slate-900">{latestNote.author}</span> ({latestNote.time})
              </Text>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNote(latestNote)}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingNoteId(latestNote.id)}
                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddDialogOpen(true);
                }}
                className="rounded-xl gap-2 cursor-pointer ml-1"
              >
                <Plus className="size-4" />
                <span>Add Care Note</span>
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 text-md leading-relaxed text-slate-900 line-clamp-2 break-words break-all [overflow-wrap:anywhere]">
            {latestNote.content}
          </div>
        </Card>
      ) : (
        <Card className="p-4 border border-border-secondary shadow-none flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-white border border-border-secondary flex items-center justify-center text-icon-primary shrink-0">
              <FileText className="size-4" />
            </div>
            <Text as="h3" size="base" weight="medium" className="text-slate-900">
              Latest Care Note
            </Text>
            <Text size="md" className="text-slate-400">
              (No notes recorded yet)
            </Text>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="rounded-xl gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Add Care Note</span>
          </Button>
        </Card>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {["All", "Nutrition", "Medical", "Behavioral", "General"].map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={selectedCategory === cat ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-xl cursor-pointer"
            >
              {cat === "Behavioral" ? "Behavioural" : cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search notes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 pr-3 bg-white border-slate-200 rounded-xl text-slate-900"
          />
        </div>
      </div>

      {/* Care Notes List (Square Cards Grid with Distinct Outline, No Shadow, Clamped Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className="col-span-full py-12 flex justify-center items-center gap-2 text-slate-500">
            <Loader2 className="size-5 animate-spin text-icon-primary" />
            <Text size="md">Loading care notes…</Text>
          </div>
        )}
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            border="secondary"
            onClick={() => setSelectedNoteForModal(note)}
            style={{ border: "1px solid #cbd5e1" }}
            className="p-5 flex flex-col justify-between rounded-2xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50/40 transition-all cursor-pointer shadow-xs min-h-[185px] group min-w-0 overflow-hidden"
          >
            {/* Top row: Author avatar & role + Category badge */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <User className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <Text size="md" weight="bold" className="text-slate-900 truncate">
                    {note.author}
                  </Text>
                  <Text size="md" weight="medium" className="text-slate-500 truncate">
                    {note.role}
                  </Text>
                </div>
              </div>

              <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none shrink-0">
                {note.category}
              </Badge>
            </div>

            {/* Middle: Description (wraps to 2nd line, clamped to 2 lines with ellipsis, breaks long words) */}
            <div className="py-2.5 flex-1 min-w-0 w-full overflow-hidden">
              <Text
                size="md"
                weight="regular"
                className="text-slate-800 leading-relaxed line-clamp-2 break-words break-all [overflow-wrap:anywhere]"
              >
                {note.content}
              </Text>
            </div>

            {/* Bottom: Date & Time + Action Buttons */}
            <div className="flex items-center justify-between text-slate-500 border-t border-slate-100 pt-2 mt-auto">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-slate-400 shrink-0" />
                <Text as="span" size="md" variant="muted">
                  {note.date} at {note.time}
                </Text>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNote(note)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
                >
                  <Edit2 className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingNoteId(note.id)}
                  className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 rounded-md cursor-pointer"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!isLoading && filteredNotes.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center space-y-3 shadow-none border border-slate-300">
              <MessageSquare className="size-8 text-slate-300 mx-auto" />
              <Text size="md" weight="medium" className="text-slate-900">
                No care notes found
              </Text>
              <Text size="md" weight="regular" className="text-slate-500">
                Try adjusting your search terms or category filters.
              </Text>
            </Card>
          </div>
        )}
      </div>

      {/* Modals from CareNoteModals */}
      <CareNoteDetailDialog
        open={Boolean(selectedNoteForModal)}
        onOpenChange={(open) => !open && setSelectedNoteForModal(null)}
        note={selectedNoteForModal}
        onEdit={(note) => setEditingNote(note)}
        onDelete={(id) => setDeletingNoteId(id)}
      />
      <AddCareNoteDialog
        isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddNote} isSubmitting={createCareNoteMutation.isPending}
      />
      <EditCareNoteDialog
        note={editingNote} isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)} onSubmit={handleUpdateNote}
        isSubmitting={updateCareNoteMutation.isPending}
      />
      <DeleteCareNoteDialog
        isOpen={Boolean(deletingNoteId)} onClose={() => setDeletingNoteId(null)}
        onConfirm={handleDeleteConfirm} isDeleting={deleteCareNoteMutation.isPending}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Clock,
  Search,
  MessageSquare,
} from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Button } from "@repo/ui/components/ui/Button";
import { Text } from "@repo/ui/components/ui/Text";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Input } from "@repo/ui/components/ui/Input";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/Avatar";
import { InternalNote, NoteCategory } from "./AddInternalNoteModal";

interface InternalNotesCardProps {
  notes: InternalNote[];
  onOpenAddModal: () => void;
}

const CATEGORY_BADGE_STATE: Record<NoteCategory, "inactive" | "info" | "warning" | "success" | "danger"> = {
  General: "inactive",
  Medical: "info",
  Behavioral: "warning",
  Family: "success",
  "Follow-up": "warning",
  Safeguarding: "danger",
};

export function InternalNotesCard({
  notes,
  onOpenAddModal,
}: InternalNotesCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories: Array<"All" | NoteCategory> = [
    "All",
    "General",
    "Medical",
  ];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card variant="surface">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Text size={'lg'} weight={'bold'} className="text-slate-900">
                Internal Notes &amp; Observations
              </Text>
              <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
                {notes.length} {notes.length === 1 ? "Note" : "Notes"}
              </Badge>
            </div>
            <Text size={'md'} weight={'regular'} className="text-slate-500 mt-0.5">
              Confidential internal logs, clinical assessments, and post-incident observations.
            </Text>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onOpenAddModal}
          className="h-9 px-3.5 rounded-xl text-md font-semibold gap-1.5 shrink-0 self-start sm:self-auto border-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <Plus className="size-3.5" />
          Add Internal Note
        </Button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-4 rounded-xl text-md font-medium whitespace-nowrap transition-all cursor-pointer border ${isSelected
                  ? "bg-surface-primary text-white border-surface-primary shadow-xs font-semibold"
                  : "bg-surface-card-grey text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-60 shrink-0 [&_[data-slot=input-error]]:hidden">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-md bg-surface-card-grey border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-800 text-slate-900 placeholder:text-slate-400 shadow-none"
          />
        </div>
      </div>

      {/* 3. Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-3 pt-1">
          {filteredNotes.map((note) => {
            const badgeState = CATEGORY_BADGE_STATE[note.category] || "inactive";
            return (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-2.5 hover:border-emerald-800/40 transition-colors"
              >
                {/* Note Author & Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-md">
                        {note.author.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Text size={'md'} weight={'bold'} className="text-slate-900">
                      {note.author}
                    </Text>
                    <Text size={'md'} weight={'regular'} className="text-slate-500">
                      • {note.role}
                    </Text>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      state={badgeState}
                      className="text-md px-2 py-0.5"
                    >
                      {note.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-slate-400" />
                      <Text size={'md'} weight={'regular'} className="text-slate-500">
                        {note.date} at {note.time}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Note Content Body */}
                <Text size={'md'} weight={'regular'} className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </Text>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-8 px-4 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200 space-y-2">
          <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <MessageSquare className="size-5" />
          </div>
          <Text size={'md'} weight={'bold'} className="text-slate-900">
            {searchTerm || selectedCategory !== "All"
              ? "No notes found matching your filters"
              : "No internal notes recorded yet"}
          </Text>
          <Text size={'md'} weight={'regular'} className="text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "All"
              ? "Try clearing your search query or selecting a different category."
              : "Document internal care team observations, direct quotes, or managerial reviews."}
          </Text>
          {!searchTerm && selectedCategory === "All" && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenAddModal}
              className="mt-2 h-8 px-3 text-md rounded-lg font-semibold gap-1.5"
            >
              <Plus className="size-3.5" />
              Add First Note
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

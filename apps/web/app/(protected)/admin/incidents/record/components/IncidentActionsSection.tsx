"use client";

import React from "react";
import { Check, Plus, Upload, FileText, X } from "lucide-react";
import { Label, Textarea, Button } from "@repo/ui/components/ui";

export interface AttachmentItem {
  id: string;
  name: string;
  timestamp: string;
  type: "image" | "pdf";
  previewUrl?: string;
  file?: File;
}

interface IncidentActionsSectionProps {
  actions: string[];
  toggleAction: (act: string) => void;
  showAddAction: boolean;
  setShowAddAction: (val: boolean) => void;
  customActionInput: string;
  setCustomActionInput: (val: string) => void;
  onAddCustomAction: () => void;
  notes: string;
  setNotes: (val: string) => void;
  initialAssessment: string;
  setInitialAssessment: (val: string) => void;
  attachments: AttachmentItem[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (id: string) => void;
  onPreviewImage: (attachment: AttachmentItem) => void;
}

export function IncidentActionsSection({
  actions,
  toggleAction,
  showAddAction,
  setShowAddAction,
  customActionInput,
  setCustomActionInput,
  onAddCustomAction,
  notes,
  setNotes,
  initialAssessment,
  setInitialAssessment,
  attachments,
  onFileUpload,
  onRemoveAttachment,
  onPreviewImage,
}: IncidentActionsSectionProps) {
  return (
    <div className="space-y-6 font-sans pt-2">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        {/* Immediate Actions Section */}
        <div className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <Label>Immediate Actions Taken</Label>
          <div className="flex flex-wrap items-center gap-2.5">
            {actions.map((act) => (
              <div
                key={act}
                className="relative flex min-h-9 w-fit min-w-0 max-w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 pr-8 text-md font-semibold text-emerald-900"
              >
                <span className="size-4 shrink-0 rounded-full bg-emerald-800 flex items-center justify-center text-white">
                  <Check className="size-2.5 stroke-[3]" />
                </span>
                <span className="min-w-0 break-all">{act}</span>
                <button
                  type="button"
                  onClick={() => toggleAction(act)}
                  className="absolute right-1 top-1 size-6 rounded-full text-emerald-700 hover:bg-emerald-200 hover:text-emerald-950 flex items-center justify-center cursor-pointer"
                  aria-label={`Remove ${act}`}
                  title="Remove action"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}

            {showAddAction ? (
              <div className="flex w-full max-w-full basis-full flex-col items-stretch gap-2">
                <Textarea
                  value={customActionInput}
                  onChange={(e) => setCustomActionInput(e.target.value)}
                  placeholder="Action description..."
                  rows={2}
                  className="min-h-20 w-full resize-y text-md"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={onAddCustomAction}
                    className="h-9 px-3 text-md rounded-xl"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddAction(false)}
                    className="h-9 px-2 text-md"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAction(true)}
                className="w-fit rounded-xl h-9 px-3.5 text-md font-semibold gap-1.5 shadow-none"
              >
                <Plus className="size-3.5" />
                <span>Add Custom Action</span>
              </Button>
            )}
          </div>
        </div>

        {/* Attachments Section */}
        <div className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <Label>Attachments &amp; Photos</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-between min-h-[130px] shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  className="absolute top-1.5 right-1.5 size-5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="size-3" />
                </button>

                <button
                  type="button"
                  disabled={!att.previewUrl}
                  onClick={() => att.previewUrl && onPreviewImage(att)}
                  className="size-14 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 mt-1 disabled:cursor-default cursor-pointer"
                  aria-label={
                    att.previewUrl ? `Preview ${att.name}` : undefined
                  }
                >
                  {att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileText className="size-6 text-emerald-800" />
                  )}
                </button>

                <div className="text-center w-full mt-2">
                  <p className="text-md font-semibold text-slate-800 truncate px-1">
                    {att.name}
                  </p>
                  <p className="text-md text-slate-400 truncate">
                    {att.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Upload Box */}
            <label className="col-span-full border-2 border-dashed border-slate-200 hover:border-emerald-600 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white hover:bg-slate-50 transition-colors min-h-[130px]">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={onFileUpload}
              />
              <div className="size-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                <Upload className="size-4 text-emerald-800" />
              </div>
              <span className="text-md font-semibold text-slate-700">
                Upload Attachments
              </span>
              <span className="text-md text-slate-400 font-normal">
                PDF, PNG, JPG (Max 10MB)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Initial Assessment */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="initialAssessment">Initial Assessment</Label>
        <Textarea
          id="initialAssessment"
          value={initialAssessment}
          onChange={(e) => setInitialAssessment(e.target.value)}
          rows={4}
          placeholder="Record the resident's initial condition and assessment..."
          className="min-h-[100px] resize-y"
        />
      </div>

      {/* Incident Notes Section */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="incidentNotes">Incident Notes &amp; Observations</Label>
        <Textarea
          id="incidentNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Provide detailed clinical and operational notes on what occurred, resident demeanor, and subsequent steps taken..."
          className="min-h-[100px] resize-y"
        />
      </div>
    </div>
  );
}

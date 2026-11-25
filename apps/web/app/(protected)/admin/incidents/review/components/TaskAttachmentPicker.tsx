"use client";

import React, { useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";
import { Label } from "@repo/ui/components/ui/Label";
import { toast } from "@repo/ui/components/ui";

export interface TaskAttachmentItem {
  id: string;
  name: string;
  size: number;
  url?: string;
  file?: File;
}

interface TaskAttachmentPickerProps {
  attachments: TaskAttachmentItem[];
  setAttachments: React.Dispatch<React.SetStateAction<TaskAttachmentItem[]>>;
}

export function TaskAttachmentPicker({
  attachments,
  setAttachments,
}: TaskAttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
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
      const newItems: TaskAttachmentItem[] = validFiles.map((f) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        file: f,
      }));
      setAttachments((prev) => [...prev, ...newItems]);
      toast({
        title: "File Attached",
        description: `${validFiles.length} attachment${validFiles.length > 1 ? "s" : ""} added to task.`,
      });
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-1.5">
      <Label>Attachments (Optional)</Label>
      <div className="border-2 border-dashed border-[#C5D6D3] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
        <Upload className="size-5 text-[#4A706A] mb-1" />
        <p className="text-md font-medium text-slate-800">
          Drag and drop your file here
        </p>
        <p className="text-md text-slate-500 my-0.5">or</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
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
        <p className="text-md text-slate-500 mt-1.5">
          Supported formats: PDF, JPG, PNG (Max: 10 MB)
        </p>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5 pt-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 px-3 rounded-xl border border-slate-200 bg-white text-md shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileText className="size-4 text-[#4A706A] shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {att.name}
                </span>
                <span className="text-slate-400 shrink-0 text-md">
                  ({(att.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

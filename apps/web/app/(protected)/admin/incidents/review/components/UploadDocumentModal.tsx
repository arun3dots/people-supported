"use client";

import React, { useState, useRef } from "react";
import { Upload, ArrowRight, X, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { toast } from "@repo/ui/components/ui";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (files: File[]) => void;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadDocumentModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    files.forEach((file) => {
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
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files Selected",
        description: "Please select or drop at least one file to upload.",
      });
      return;
    }

    onUploadSuccess?.(selectedFiles);
    toast({
      title: "Document Uploaded",
      description: `${selectedFiles.length} file(s) uploaded successfully and attached to the incident record.`,
    });
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-xl font-bold text-text-heading">
            Upload Document
          </DialogTitle>
          <DialogDescription className="text-md text-text-description">
            Upload a document and add details for record.
          </DialogDescription>
        </DialogHeader>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors my-3 ${
            isDragging
              ? "border-[#4A706A] bg-[#F0F5F4]"
              : "border-[#C5D6D3] bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="size-12 rounded-full bg-white shadow-xs border border-[#E5E5E5] flex items-center justify-center text-[#4A706A] mb-3">
            <Upload className="size-6 stroke-[1.75]" />
          </div>

          <p className="text-md font-semibold text-slate-800">
            Drag and drop your file here
          </p>
          <p className="text-md text-text-description my-1.5">or</p>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-5 bg-white border border-[#4A706A] text-[#4A706A] hover:bg-[#F0F5F4] rounded-lg text-md font-medium cursor-pointer shadow-none"
          >
            Browse Files
          </Button>

          <p className="text-md text-text-description mt-4">
            Supported formats: PDF, JPG, PNG (Max: 10 MB)
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-1.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-[#E5E5E5] text-md"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="size-4 text-[#4A706A] shrink-0" />
                  <span className="font-medium text-slate-700 truncate">
                    {file.name}
                  </span>
                  <span className="text-md text-slate-400">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="size-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-6 border-[#D1D1D1] text-text-body rounded-xl text-md font-medium hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleUpload}
            className="h-10 px-6 bg-[#4A706A] hover:bg-[#3D5E59] text-white rounded-xl text-md font-medium flex items-center gap-2 cursor-pointer"
          >
            <ArrowRight className="size-4" />
            <span>Upload</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useRef, useState, useCallback } from "react";
import { Label } from "@repo/ui/components/ui/Label";
import { Button } from "@repo/ui/components/ui/Button";
import { Upload, X, FileText, Image, CheckCircle2, Eye } from "lucide-react";
import { DocumentViewerModal } from "../DocumentViewerModal";

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  existingUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  helpText?: string;
  staffId?: string;
  documentTitle?: string;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="w-5 h-5 text-red-500" />,
  "image/png": <Image className="w-5 h-5 text-blue-500" />,
  "image/jpeg": <Image className="w-5 h-5 text-blue-500" />,
  "image/jpg": <Image className="w-5 h-5 text-blue-500" />,
  "image/webp": <Image className="w-5 h-5 text-blue-500" />,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadField({
  label,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  maxSizeMB = 10,
  existingUrl,
  onFileSelect,
  helpText,
  staffId,
  documentTitle,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleFileValidation = useCallback(
    (file: File): boolean => {
      setError(null);

      // Check size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size must be under ${maxSizeMB}MB`);
        return false;
      }

      // Check type
      const allowedTypes = accept
        .split(",")
        .map((t) => t.trim().replace(".", ""));
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (fileExt && !allowedTypes.includes(fileExt)) {
        setError(`Allowed formats: ${allowedTypes.join(", ").toUpperCase()}`);
        return false;
      }

      return true;
    },
    [accept, maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (handleFileValidation(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [handleFileValidation, onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {selectedFile ? (
        /* ── File Selected State ── */
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex-shrink-0 text-gray-400">
            {FILE_ICONS[selectedFile.type] || (
              <FileText className="w-5 h-5 font-medium text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-md font-medium truncate text-slate-500">{selectedFile.name}</p>
            <p className="text-md text-slate-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="h-7 w-7 p-0 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        /* ── Dropzone State ── */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200
            ${isDragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
            }
          `}
        >
          <Upload
            className={`w-6 h-6 ${isDragOver ? "text-primary" : "text-slate-500 text-muted-foreground"}`}
          />
          <div className="text-center">
            <p className="text-md font-medium text-slate-500">
              {isDragOver ? "Drop file here" : "Click to upload or drag & drop"}
            </p>
            <p className="text-md text-slate-500 mt-0.5">
              {helpText || `PDF, JPG, PNG up to ${maxSizeMB}MB`}
            </p>
          </div>
        </div>
      )}

      {/* Existing uploaded document link */}
      {existingUrl && !selectedFile && (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="inline-flex items-center gap-1.5 text-md text-primary hover:underline font-medium cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            View current uploaded document
          </button>
        </div>
      )}

      {/* Secure Document Viewer Modal for existing S3 file */}
      {existingUrl && (
        <DocumentViewerModal
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          title={documentTitle || label}
          documentPath={existingUrl}
          staffId={staffId}
        />
      )}

      {error && <p className="text-md text-destructive mt-1">{error}</p>}
    </div>
  );
}

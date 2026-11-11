"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, X, ZoomIn } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface FindingPhotoAttachmentSectionProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FindingPhotoAttachmentSection({
  files,
  onFilesChange,
  disabled = false,
}: FindingPhotoAttachmentSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintain local object URLs for memory cleanup
  const [objectUrls, setObjectUrls] = useState<Map<File, string>>(new Map());

  useEffect(() => {
    const newMap = new Map<File, string>();
    files.forEach((file) => {
      newMap.set(file, URL.createObjectURL(file));
    });
    setObjectUrls(newMap);

    return () => {
      newMap.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleAddFiles = (incoming: FileList | File[]) => {
    const validImages: File[] = [];
    Array.from(incoming).forEach((f) => {
      if (f.type.startsWith("image/")) {
        validImages.push(f);
      }
    });
    if (validImages.length > 0) {
      onFilesChange([...files, ...validImages]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-md font-bold text-slate-800">
          Attach Clinical Photos
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          {files.length} photo(s) attached
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1.5",
          isDragging
            ? "border-teal-700 bg-teal-50/60"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) {
              handleAddFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />

        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <UploadCloud className="size-4" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop clinical photographs
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            PNG, JPG, JPEG, WEBP · Max 5MB (consent checked, encrypted on AWS S3)
          </p>
        </div>
      </div>

      {/* Thumbnails Grid with Preview & Remove */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {files.map((file, idx) => {
            const url = objectUrls.get(file);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="group relative flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
              >
                {/* Thumbnail with Zoom Click */}
                <div
                  onClick={() => {
                    if (url) {
                      setPreviewModalUrl(url);
                      setPreviewModalTitle(file.name);
                    }
                  }}
                  className="relative size-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 cursor-pointer"
                >
                  {url ? (
                    <img
                      src={url}
                      alt={file.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <ImageIcon className="size-5 m-auto text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="size-3.5" />
                  </div>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-[11px] font-medium text-slate-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className="absolute right-2 top-2 size-5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 p-0"
                  title="Remove photo"
                >
                  <X className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal */}
      <ImagePreviewModal
        open={Boolean(previewModalUrl)}
        onOpenChange={(open) => !open && setPreviewModalUrl(null)}
        imageUrl={previewModalUrl}
        title={previewModalTitle}
      />
    </div>
  );
}

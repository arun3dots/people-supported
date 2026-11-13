"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button, Input, Label, Badge, toast } from "@repo/ui/components/ui";
import { Upload, Eye, Trash2, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { useUploadAdmissionDocumentMutation } from "../../../../../../lib/queries/residents";
import { ADMISSION_UPLOAD_LIMITS } from "../../data/admissionFormFields";

interface DocumentUploadFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (url: string, fileMeta?: { fileName: string; fileSize?: number; fileType?: string }) => void;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  helperText?: string;
  className?: string;
  isImage?: boolean;
}

export function DocumentUploadField({
  label,
  placeholder = "Upload document or enter URL",
  value = "",
  onChange,
  accept = ADMISSION_UPLOAD_LIMITS.DOCUMENT.accept,
  maxSizeMB = ADMISSION_UPLOAD_LIMITS.DOCUMENT.maxSizeMB,
  required = false,
  helperText,
  className = "",
  isImage = false,
}: DocumentUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadDocMutation = useUploadAdmissionDocumentMutation();

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size exceeds the ${maxSizeMB}MB limit.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadDocMutation.mutateAsync(file);
      if (res?.documentUrl || res?.fileUrl) {
        const finalUrl = res.documentUrl || res.fileUrl;
        onChange(finalUrl, {
          fileName: res.fileName || file.name,
          fileSize: res.fileSize || file.size,
          fileType: res.fileType || file.type,
        });
      }
    } catch {
      // Error handled by mutation toast
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleView = () => {
    if (!value) return;
    window.open(value, "_blank", "noopener,noreferrer");
  };

  const handleClear = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-1.5 [&_[data-slot=input-error]]:hidden font-sans ${className}`}>
      {label && (
        <Label required={required} >
          {label}
        </Label>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${value ? "pr-8" : ""
              }`}
          />
          {value && (
            <Button
              variant="ghost"
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-0.5"
              title="Clear URL"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin text-emerald-800" />
          ) : isImage ? (
            <ImageIcon className="size-3.5 text-emerald-800" />
          ) : (
            <Upload className="size-3.5 text-emerald-800" />
          )}
          {isUploading ? "Uploading..." : value ? "Replace" : "Upload File"}
        </Button>

        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleView}
            title="View uploaded document"
          >
            <Eye className="size-3.5 text-slate-600" /> View
          </Button>
        )}
      </div>

      <p className="text-md text-slate-500 mt-1 font-normal leading-normal">
        {helperText
          ? helperText.includes("MB") || helperText.includes("PDF")
            ? helperText
            : `${helperText} (${ADMISSION_UPLOAD_LIMITS.DOCUMENT.formatsLabel} · Max ${maxSizeMB}MB)`
          : `Supported: ${ADMISSION_UPLOAD_LIMITS.DOCUMENT.formatsLabel} · Max ${maxSizeMB}MB per file`}
      </p>
    </div>
  );
}

interface DocumentUploadButtonProps {
  value?: string;
  fileName?: string;
  onChange: (url: string, meta?: { fileName: string; fileSize?: number; fileType?: string }) => void;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
  size?: "sm" | "default";
  variant?: "outline" | "primary" | "ghost";
  showViewButton?: boolean;
}

export function DocumentUploadButton({
  value,
  fileName,
  onChange,
  accept = ADMISSION_UPLOAD_LIMITS.DOCUMENT.accept,
  maxSizeMB = ADMISSION_UPLOAD_LIMITS.DOCUMENT.maxSizeMB,
  buttonText = "Upload",
  size = "sm",
  variant = "outline",
  showViewButton = true,
}: DocumentUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadDocMutation = useUploadAdmissionDocumentMutation();

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size exceeds the ${maxSizeMB}MB limit.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadDocMutation.mutateAsync(file);
      if (res?.documentUrl || res?.fileUrl) {
        const finalUrl = res.documentUrl || res.fileUrl;
        onChange(finalUrl, {
          fileName: res.fileName || file.name,
          fileSize: res.fileSize || file.size,
          fileType: res.fileType || file.type,
        });
      }
    } catch {
      // Error handled by mutation
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleView = () => {
    if (!value) return;
    window.open(value, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-1.5 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
        aria-hidden="true"
      />

      {value ? (
        <div className="flex items-center gap-1.5">
          <Badge state="success" className="gap-1 py-1 px-2.5 rounded-lg max-w-[140px] truncate" title={fileName || value}>
            <CheckCircle2 className="size-3 shrink-0" />
            <span className="truncate">{fileName || "Uploaded"}</span>
          </Badge>

          {showViewButton && (
            <Button
              type="button"
              variant="ghost"
              size={size}
              onClick={handleView}
              className="size-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg"
              title="View document"
            >
              <Eye className="size-3.5" />
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size={size}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="size-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg border-slate-200 shadow-none"
            title="Replace document"
          >
            {isUploading ? <Loader2 className="size-3 animate-spin text-emerald-800" /> : <Upload className="size-3" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size={size}
            onClick={() => onChange("")}
            className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Remove document"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 px-3 font-semibold rounded-xl shrink-0 border-slate-200 bg-white shadow-none hover:bg-slate-50 text-emerald-900"
        >
          {isUploading ? <Loader2 className="size-3.5 animate-spin text-emerald-800" /> : <Upload className="size-3.5 text-emerald-800" />}
          {isUploading ? "Uploading..." : buttonText}
        </Button>
      )}
    </div>
  );
}

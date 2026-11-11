"use client";

import React, { useState, useRef } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  toast,
} from "@repo/ui/components/ui";
import { Upload, X, Loader2 } from "lucide-react";
import { useUploadDocumentMutation } from "../../../../../../../lib/queries/residents/useDocumentsQuery";

interface UploadDocumentModalProps {
  residentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DOCUMENT_CATEGORIES = [
  "Care Plan",
  "Medical Report",
  "Risk Assessment",
  "Legal & Consent",
  "ID & Proof of Address",
  "Financial & Billing",
  "Prescription",
  "Hospital Discharge",
  "Other",
] as const;

const UploadDocumentSchema = z.object({
  docType: z.string().min(1, "Please select a document category / type"),
  docName: z.string().trim().min(1, "Document name is required"),
  hasFile: z.boolean().refine((val) => val === true, "Please select a file to upload"),
});

export function UploadDocumentModal({
  residentId,
  isOpen,
  onClose,
}: UploadDocumentModalProps) {
  const [docType, setDocType] = useState<string>("");
  const [docName, setDocName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocumentMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Document must be smaller than 10MB.",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }
      setSelectedFile(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileName(file.name);
      setFileSize(`${sizeMb} MB`);
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ""));
      }
      if (errors.hasFile) {
        setErrors((prev) => ({ ...prev, hasFile: "" }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = UploadDocumentSchema.safeParse({
      docType,
      docName,
      hasFile: Boolean(selectedFile),
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    if (!selectedFile) return;

    uploadMutation.mutate(
      {
        residentId,
        file: selectedFile,
        category: docType,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader className="space-y-1 relative pr-8">
          <DialogTitle>
            <Text size={"lg"} className="text-text-body tracking-tight">
              Upload Resident Document
            </Text>
            <Text size="md" weight="regular" className="text-text-description">
              Upload a document and categorize it for the resident&apos;s record.
            </Text>
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label required>Document Category / Type</Label>
            <Select
              value={docType}
              onValueChange={(val) => {
                setDocType(val);
                if (!docName) setDocName(val);
                if (errors.docType) setErrors((prev) => ({ ...prev, docType: "" }));
              }}
            >
              <SelectTrigger className={errors.docType ? "border-border-error" : ""}>
                <SelectValue placeholder="Select Document Type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.docType && (
              <p className="text-sm text-text-error font-medium leading-tight mt-1">
                {errors.docType}
              </p>
            )}
          </div>

          <div>
            <Label required>Document Name</Label>
            <Input
              placeholder="e.g. Passport Copy, NHS Confirmation, Care Consent"
              value={docName}
              errorMessage={errors.docName}
              onChange={(e) => {
                setDocName(e.target.value);
                if (errors.docName) setErrors((prev) => ({ ...prev, docName: "" }));
              }}
            />
          </div>

          <div>
            <Label>Notes / Description (Optional)</Label>
            <Textarea
              placeholder="Add relevant notes, reference numbers, or context"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <div className={`w-full h-44 bg-surface-primary-light border-2 border-dashed ${errors.hasFile ? "border-border-error" : "border-emerald-700/60"} rounded-xl flex flex-col justify-center items-center gap-2`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              <div className="size-9 text-emerald-800 flex items-center justify-center">
                <Upload className="size-8 text-emerald-800" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-4 text-md"
                >
                  Browse Files
                </Button>
                <Text size="sm" weight="normal" className="text-slate-500">
                  PDF, JPG, PNG, DOC (Max: 10MB)
                </Text>
              </div>
              {fileName && (
                <div className="px-3 py-1 rounded-md bg-white border border-border-secondary flex items-center gap-2 text-sm text-surface-primary font-medium">
                  <span className="truncate max-w-64 font-medium">
                    📄 {fileName} ({fileSize})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 text-slate-400 hover:text-slate-700"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileName("");
                      setFileSize("");
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )}
            </div>
            {errors.hasFile && (
              <p className="text-sm text-text-error font-medium leading-tight mt-1">
                {errors.hasFile}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-5">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={uploadMutation.isPending}
              className="h-10 px-6"
            >
              {uploadMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Uploading…
                </span>
              ) : (
                "Save Document"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

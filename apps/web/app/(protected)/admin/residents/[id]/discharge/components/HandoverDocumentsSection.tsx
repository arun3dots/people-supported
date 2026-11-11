"use client";

import React, { useRef, useState } from "react";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "@repo/ui/components/ui";
import { HandoverDoc } from "./DischargeFormSections";
import { DeleteDocumentModal } from "./DeleteDocumentModal";

interface HandoverDocumentsSectionProps {
  documents: HandoverDoc[];
  onRemoveDocument: (docIdOrIndex: string | number) => void;
  onUploadFile?: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function HandoverDocumentsSection({
  documents,
  onRemoveDocument,
  onUploadFile,
  isUploading,
}: HandoverDocumentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ idOrIndex: string | number; name: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Document must be smaller than 10MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      if (onUploadFile) {
        await onUploadFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Handover Documents
        </h3>
        {documents.length > 0 && (
          <span className="text-md font-semibold text-slate-500">
            {documents.length} {documents.length === 1 ? "document" : "documents"} attached
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uploaded Documents List */}
        {documents.map((doc, idx) => {
          const docKey = doc.id || `doc-${idx}`;
          const fileSizeKb = doc.fileSize ? Math.round(doc.fileSize / 1024) : 24;

          return (
            <div
              key={docKey}
              className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-xs relative group hover:border-slate-300 transition-all"
            >
              {/* Delete Button */}
              <button
                type="button"
                onClick={() =>
                  setDocToDelete({
                    idOrIndex: doc.id || idx,
                    name: doc.name,
                  })
                }
                title="Remove document"
                className="absolute top-3 right-3 size-7 rounded-lg bg-slate-100/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="size-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-md sm:text-md text-slate-900 truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    {(doc.fileType || "doc").toUpperCase()}. {fileSizeKb} KB
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                <p className="text-sm text-slate-500 font-medium leading-tight">
                  Updated
                </p>
                <p className="text-sm text-slate-700 font-semibold leading-tight truncate">
                  {doc.updatedAt || "Just now"}
                </p>
              </div>
            </div>
          );
        })}

        {/* Upload More Box */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-600/60 bg-white/70 hover:bg-emerald-50/40 rounded-2xl flex flex-col items-center justify-center gap-2 min-h-[140px] transition-colors cursor-pointer group"
        >
          {isUploading ? (
            <Loader2 className="size-6 text-emerald-700 animate-spin" />
          ) : (
            <div className="size-9 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-600 group-hover:text-emerald-800 transition-colors">
              <Upload className="size-4" />
            </div>
          )}
          <span className="text-md font-bold text-slate-800 group-hover:text-emerald-900">
            {isUploading ? "Uploading..." : "Upload More"}
          </span>
          <span className="text-sm text-slate-400 group-hover:text-emerald-700/80 font-normal">
            PDF, DOC, PNG, JPG (Max 10MB)
          </span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteDocumentModal
        open={Boolean(docToDelete)}
        onOpenChange={(open) => !open && setDocToDelete(null)}
        documentName={docToDelete?.name}
        onConfirmDelete={() => {
          if (docToDelete) {
            onRemoveDocument(docToDelete.idOrIndex);
            setDocToDelete(null);
          }
        }}
      />
    </div>
  );
}

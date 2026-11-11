"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2, Download, ExternalLink } from "lucide-react";
import { Card, Button, Text, toast, Skeleton } from "@repo/ui/components/ui";
import { format } from "date-fns";
import { useGetOrganizationDocumentsQuery } from "../../../../../../lib/queries/organization/useGetOrganizationDocumentsQuery";
import {
  useUploadOrganizationDocumentMutation,
  useDeleteOrganizationDocumentMutation,
} from "../../../../../../lib/queries/organization/organizationMutations";

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function OrgDocumentsCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useGetOrganizationDocumentsQuery();

  const uploadMutation = useUploadOrganizationDocumentMutation({
    onSuccess: (doc) => {
      toast({
        title: "Document Uploaded",
        description: `${doc.name} has been added successfully.`,
        variant: "success",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (err) => {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteOrganizationDocumentMutation({
    onSuccess: () => {
      toast({
        title: "Document Removed",
        description: "Document was removed from your organisation records.",
      });
      setDeletingId(null);
    },
    onError: (err) => {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete document. Please try again.",
        variant: "destructive",
      });
      setDeletingId(null);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Document must be smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    await uploadMutation.mutateAsync({ file, category: "Statutory" });
  };

  const handleRemoveDoc = async (id: string) => {
    setDeletingId(id);
    await deleteMutation.mutateAsync(id);
  };

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none w-full font-sans">
      {/* ==================== HEADER ==================== */}
      <div>
        <Text size={'base'} weight={'bold'} className="text-slate-900">
          Documents
        </Text>
        <Text size={'xs'} weight={'regular'} className="text-slate-500">
          Statutory and registration documents
        </Text>
      </div>

      {/* ==================== CONTENT + BUTTON ==================== */}
      <div className="flex flex-col gap-4 w-full">
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && documents.length === 0 && (
          <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <Text size="sm" weight="regular" className="text-slate-400">
              No statutory documents uploaded yet.
            </Text>
          </div>
        )}

        {/* Document Items List */}
        {!isLoading && documents.length > 0 && (
          <div className="flex flex-col gap-2.5 w-full">
            {documents.map((doc) => {
              const formattedDate = doc.createdAt
                ? format(new Date(doc.createdAt), "dd MMM yyyy")
                : "Unknown date";
              const formattedSize = doc.fileSize ? formatFileSize(doc.fileSize) : "";
              const isDeleting = deletingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors w-full group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* PDF/Doc Icon Badge */}
                    <div className="size-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>

                    {/* Text Block */}
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                      {doc.documentUrl ? (
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-md font-medium text-slate-900 hover:text-emerald-800 truncate flex items-center gap-1 transition-colors"
                          title="Open document in new tab"
                        >
                          <span className="truncate">{doc.name}</span>
                          <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </a>
                      ) : (
                        <Text size="sm" weight="medium" className="text-slate-900 truncate">
                          {doc.name}
                        </Text>
                      )}
                      <Text size="sm" weight="regular" className="text-slate-400 text-[11px] truncate">
                        Uploaded on {formattedDate} {formattedSize ? `· ${formattedSize}` : ""}
                      </Text>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.documentUrl && (
                      <a
                        href={doc.documentUrl}
                        download={doc.name}
                        className="size-7 flex items-center justify-center text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Download document"
                      >
                        <Download className="size-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="size-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove document"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-10 rounded-xl text-md font-regular text-slate-700 flex items-center justify-center gap-2 shadow-none border-slate-200 bg-white hover:bg-slate-50 mt-1"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="size-4 animate-spin text-emerald-800" />
          ) : (
            <Upload className="size-4 text-emerald-800 shrink-0" />
          )}
          <span>{uploadMutation.isPending ? "Uploading..." : "Upload Document"}</span>
        </Button>
      </div>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import { Search, Upload, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Card, Input, Text } from "@repo/ui/components/ui";
import {
  useGetResidentDocumentsQuery,
  useVerifyDocumentMutation,
} from "../../../../../../lib/queries/residents/useDocumentsQuery";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { UploadDocumentModal } from "./documents/UploadDocumentModal";
import { ArchiveDocumentDialog } from "./documents/ArchiveDocumentDialog";
import { VerifyDocumentModal } from "./documents/VerifyDocumentModal";
import { DocumentsTable } from "./documents/DocumentsTable";
import {
  StandardDocumentSlot,
  STANDARD_ADMISSION_DOCUMENTS,
  DocumentRowItem,
} from "./documents/types";

export type { StandardDocumentSlot, DocumentRowItem };
export { STANDARD_ADMISSION_DOCUMENTS };

interface ResidentDocumentsTabProps {
  residentId: string;
}

export function ResidentDocumentsTab({ residentId }: ResidentDocumentsTabProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"active" | "archived">("active");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentRowItem | null>(null);

  const { data: serverDocs = [], isLoading } = useGetResidentDocumentsQuery(residentId);
  const verifyMutation = useVerifyDocumentMutation();

  const userRole = user?.roleName?.toUpperCase();
  const isRMOrAdmin =
    userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPERADMIN";
  const canUpload = isRMOrAdmin || userRole === "NURSE";

  // Map ONLY added documents
  const mappedDocs: DocumentRowItem[] = (serverDocs as Array<{
    id: string;
    name: string;
    category?: string;
    status?: string;
    createdAt?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
  }>).map((doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category || "General",
    status: doc.status || "Uploaded",
    uploadedOn: doc.createdAt
      ? new Date(doc.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "Uploaded",
    fileUrl: doc.fileUrl,
    fileSize: doc.fileSize,
    fileType: doc.fileType,
  }));

  const activeDocs = mappedDocs.filter((d) => d.status !== "Archived");
  const archivedDocs = mappedDocs.filter((d) => d.status === "Archived");

  const currentTabDocs = filterTab === "active" ? activeDocs : archivedDocs;
  const filteredDocs = currentTabDocs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = (documentId: string) => {
    verifyMutation.mutate({ documentId, residentId, status: "Uploaded" });
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {isLoading ? (
        <Card variant="surface" className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-surface-primary" />
        </Card>
      ) : (
        <Card variant="surface" className="p-5 sm:p-6 space-y-4">
          {/* Action Toolbar with Active / Archived Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-56 w-full sm:w-64 [&_[data-slot=input-error]]:hidden">
                <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                <Input
                  placeholder="Search Documents…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              {/* Active vs Archived segmented filter */}
              <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200 text-md">
                <button
                  type="button"
                  onClick={() => setFilterTab("active")}
                  className={cn(
                    "px-3 py-1.5 font-medium rounded-lg transition-all cursor-pointer",
                    filterTab === "active"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Active ({activeDocs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("archived")}
                  className={cn(
                    "px-3 py-1.5 font-medium rounded-lg transition-all cursor-pointer",
                    filterTab === "archived"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Archived ({archivedDocs.length})
                </button>
              </div>
            </div>

            {canUpload && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-2 self-start sm:self-auto shrink-0"
            >
              <Upload className="size-4 text-white" />
              Upload Document
            </Button>
            )}
          </div>

          {/* Extracted Documents Table */}
          <DocumentsTable
            documents={filteredDocs}
            filterTab={filterTab}
            isRMOrAdmin={isRMOrAdmin}
            onPreview={(doc) => setPreviewDoc(doc)}
            onArchive={(docId) => setArchiveTargetId(docId)}
            onRestore={handleRestore}
            onOpenUpload={canUpload ? () => setIsUploadModalOpen(true) : undefined}
            searchTerm={searchTerm}
            isRestoring={verifyMutation.isPending}
          />
        </Card>
      )}

      {/* Security Callout Banner */}
      <Card variant="secondary" border="secondary" className="p-5 flex flex-row items-center gap-4">
        <div className="size-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div>
          <Text size="md" weight="semibold" className="text-slate-900">
            Secure Resident Records &amp; Data Protection
          </Text>
          <Text size="sm" variant="muted" className="mt-0.5">
            Documents are encrypted and viewed securely in-app. Registered Managers verify documents for regulatory compliance, and records are retained via archiving.
          </Text>
        </div>
      </Card>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        residentId={residentId}
      />

      <ArchiveDocumentDialog
        documentId={archiveTargetId}
        residentId={residentId}
        onClose={() => setArchiveTargetId(null)}
      />

      <VerifyDocumentModal
        document={previewDoc}
        residentId={residentId}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        canVerify={isRMOrAdmin}
      />
    </div>
  );
}

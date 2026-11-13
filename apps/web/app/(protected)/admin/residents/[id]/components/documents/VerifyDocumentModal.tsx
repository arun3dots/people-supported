"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  ShieldCheck,
  XCircle,
  FileText,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import { useVerifyDocumentMutation } from "../../../../../../../lib/queries/residents/useDocumentsQuery";
import { DocumentRowItem } from "./types";

interface ExtendedDocumentRowItem extends DocumentRowItem {
  notes?: string;
  type?: string;
}

interface VerifyDocumentModalProps {
  document: ExtendedDocumentRowItem | null;
  residentId: string;
  isOpen: boolean;
  onClose: () => void;
  canVerify: boolean;
}

const RejectDocumentSchema = z.object({
  rejectReason: z.string().trim().min(3, "Please provide a reason for rejecting this document"),
});

export function VerifyDocumentModal({
  document,
  residentId,
  isOpen,
  onClose,
  canVerify,
}: VerifyDocumentModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const verifyMutation = useVerifyDocumentMutation();

  React.useEffect(() => {
    if (isOpen) {
      setShowRejectForm(false);
      setRejectReason("");
      setRejectError(null);
    }
  }, [isOpen]);

  if (!document) return null;

  const previewUrl = `/api/documents/${document.id}/view`;
  const isPdf =
    document.fileType?.includes("pdf") ||
    document.name.toLowerCase().endsWith(".pdf");
  const isImage =
    document.fileType?.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif)$/i.test(document.name);

  const handleVerify = () => {
    verifyMutation.mutate(
      {
        documentId: document.id,
        residentId,
        status: "Verified",
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleReject = () => {
    setRejectError(null);
    const parsed = RejectDocumentSchema.safeParse({ rejectReason });
    if (!parsed.success) {
      setRejectError(parsed.error.issues[0]?.message || "Please provide a rejection reason");
      return;
    }

    verifyMutation.mutate(
      {
        documentId: document.id,
        residentId,
        status: "Rejected",
        notes: parsed.data.rejectReason,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleRevertToPending = () => {
    verifyMutation.mutate(
      {
        documentId: document.id,
        residentId,
        status: "Uploaded",
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
      <DialogContent size="2xl" className="max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5 text-[#3D5C57]" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-text-body">
                  Verify Resident Document
                </DialogTitle>
                <Text size="md" className="text-text-description">
                  Review original file contents before marking as verified
                </Text>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                document.status === "Verified"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : document.status === "Rejected"
                    ? "border-red-300 bg-red-50 text-red-800"
                    : "border-amber-300 bg-amber-50 text-amber-800"
              }
            >
              {document.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Document Info Header */}
        <div className="py-2.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl my-2 flex flex-wrap items-center justify-between gap-2 text-md">
          <div>
            <span className="font-semibold text-slate-800">{document.name}</span>
            <span className="text-slate-400 ml-2">({document.category || document.type || "Document"})</span>
          </div>
          <div className="text-slate-500 text-md">
            Uploaded {document.uploadedOn ? new Date(document.uploadedOn).toLocaleDateString() : ""}
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 min-h-[380px] max-h-[500px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center relative">
          {isPdf ? (
            <iframe
              src={previewUrl}
              title={document.name}
              className="w-full h-full border-none"
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-2 bg-slate-900/5">
              <img
                src={previewUrl}
                alt={document.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="size-12 mx-auto text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700">{document.name}</p>
                <p className="text-md text-slate-500">
                  Preview not directly supported in-browser for this format ({document.fileType || "File"}).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(previewUrl, "_blank")}
                className="gap-1.5"
              >
                Open / Download File
              </Button>
            </div>
          )}
        </div>

        {/* Rejection / Notes Section */}
        <div className="space-y-2 mt-2">
          {document.notes && !showRejectForm && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-md space-y-1">
              <span className="font-semibold text-amber-900">Verification Notes:</span>
              <p className="text-amber-800">{document.notes}</p>
            </div>
          )}

          {showRejectForm && (
            <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-800 font-medium text-md">
                <AlertCircle className="size-4" />
                <span>Specify Rejection Reason or Document Request Notes</span>
              </div>
              <Textarea
                placeholder="e.g. Document copy is blurry or expired. Please upload a clear photo of the original."
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                rows={2}
                className="bg-white border-red-200 focus:border-red-400 text-md"
                errorMessage={rejectError || undefined}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={verifyMutation.isPending}
                  onClick={handleReject}
                  className="gap-1.5"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  Confirm Rejection &amp; Request New
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Verification Buttons */}
        <div className="pt-4 border-t border-border-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-md text-slate-500">
            {document.status === "Verified" ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="size-3.5" /> Verified by Registered Manager / Admin
              </span>
            ) : document.status === "Rejected" ? (
              <span className="inline-flex items-center gap-1.5 text-red-700 font-medium text-md">
                <XCircle className="size-3.5" /> Document rejected (New document requested)
              </span>
            ) : (
              <Text size={'md'}>Document requires Registered Manager / Admin verification</Text>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4">
              Close
            </Button>

            {/* RM / Admin Verification Controls */}
            {canVerify && document.status !== "Archived" && (
              <>
                {document.status === "Verified" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={verifyMutation.isPending}
                    onClick={handleRevertToPending}
                    className="h-9 px-3 text-md text-slate-600 hover:text-amber-800 hover:bg-amber-50 gap-1.5"
                  >
                    <RotateCcw className="size-3.5" /> Revert to Pending
                  </Button>
                ) : (
                  <>
                    {!showRejectForm && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={verifyMutation.isPending}
                        onClick={() => setShowRejectForm(true)}
                      >
                        <XCircle className="size-3.5" /> Reject / Request New
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={verifyMutation.isPending}
                      onClick={handleVerify}
                    >
                      {verifyMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-3.5" />
                      )}
                      Verify Document
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

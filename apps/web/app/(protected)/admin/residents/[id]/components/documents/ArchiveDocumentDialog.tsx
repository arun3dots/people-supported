"use client";

import React from "react";
import { Archive, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Text,
} from "@repo/ui/components/ui";
import { useArchiveDocumentMutation } from "../../../../../../../lib/queries/residents/useDocumentsQuery";

interface ArchiveDocumentDialogProps {
  documentId: string | null;
  residentId: string;
  onClose: () => void;
}

export function ArchiveDocumentDialog({
  documentId,
  residentId,
  onClose,
}: ArchiveDocumentDialogProps) {
  const archiveMutation = useArchiveDocumentMutation();

  const handleArchive = () => {
    if (!documentId) return;
    archiveMutation.mutate(
      { documentId, residentId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={!!documentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-text-body">
            Archive Document?
          </DialogTitle>
        </DialogHeader>
        <Text size="md" className="text-text-description py-2">
          This document will be moved to the archive. It will be removed from active resident records, but can be viewed or restored from the Archived filter at any time.
        </Text>
        <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-border-secondary">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-md"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            type="button"
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
            className="h-9 px-4 text-md gap-1.5"
          >
            {archiveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" /> Archiving…
              </span>
            ) : (
              <>
                <Archive className="size-4" />
                Archive
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


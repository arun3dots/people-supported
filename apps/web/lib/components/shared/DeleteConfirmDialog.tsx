import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Processing..." : (confirmText || "Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { UserCircle, Camera, Loader2, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  toast,
} from "@repo/ui/components/ui";
import { useUploadResidentPhotoMutation } from "../../../lib/queries/residents";

/** Max upload size (bytes). Keep in sync with backend limits if added there. */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface ResidentPhotoProps {
  residentId: string;
  photoUrl?: string | null;
  /** Resident's full name — used for alt text and the enlarged-view title. */
  name: string;
  /** Whether the current user may change the photo (e.g. Admin). */
  canEdit: boolean;
  /**
   * Display style:
   * - "avatar" (default): circular thumbnail.
   * - "cover": fills its parent container edge-to-edge (the parent sets the
   *   height). Used as the large banner at the top of the profile card.
   */
  variant?: "avatar" | "cover";
}

/**
 * Resident profile photo: opens an enlarged view on click, with an in-dialog
 * upload/replace control for permitted users. Renders either as a circular
 * avatar or as a full-bleed cover image depending on `variant`.
 */
export function ResidentPhoto({
  residentId,
  photoUrl,
  name,
  canEdit,
  variant = "avatar",
}: ResidentPhotoProps) {
  const [open, setOpen] = useState(false);
  const { mutate: uploadPhoto, isPending: isUploading } =
    useUploadResidentPhotoMutation(residentId);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Please choose a JPEG, PNG, WEBP or GIF image.",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Profile photos must be 5MB or smaller.",
      });
      return;
    }

    uploadPhoto(file);
  };

  const isCover = variant === "cover";

  const triggerClassName = isCover
    ? "group relative h-full w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5"
    : "group w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center -mt-12 mx-auto relative shadow-md overflow-hidden";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View profile photo"
        className={triggerClassName}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <UserCircle
              className={
                isCover
                  ? "h-20 w-20 text-muted-foreground/40"
                  : "h-16 w-16 text-muted-foreground/40"
              }
            />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className={isCover ? "h-8 w-8 text-white" : "h-6 w-6 text-white"} />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center overflow-hidden rounded-xl bg-muted/30">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="max-h-[70vh] w-auto object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <UserCircle className="w-24 h-24 opacity-40" />
                <p className="mt-2 text-md">No profile photo</p>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-center pt-2">
              <Button asChild variant="outline" disabled={isUploading}>
                <label className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {photoUrl ? "Change photo" : "Upload photo"}
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                  />
                </label>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

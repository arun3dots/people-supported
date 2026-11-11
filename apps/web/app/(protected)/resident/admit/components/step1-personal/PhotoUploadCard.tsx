"use client";

import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Button, toast } from "@repo/ui/components/ui";
import { User, Upload, Trash2, Camera, Loader2 } from "lucide-react";
import {
  useUploadResidentPhotoMutation,
  useUploadAdmissionPhotoMutation,
} from "../../../../../../lib/queries/residents";
import { ADMISSION_UPLOAD_LIMITS } from "../../data/admissionFormFields";

interface PhotoUploadCardProps {
  photoUrl?: string;
  draftResidentId?: string | null;
  onPhotoChange: (photoUrl: string) => void;
}

export function PhotoUploadCard({
  photoUrl,
  draftResidentId,
  onPhotoChange,
}: PhotoUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localBlobRef = useRef<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(photoUrl || "");
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    if (photoUrl && !photoUrl.startsWith("data:")) {
      // If we don't have an active local blob in this session, use the prop photoUrl
      if (!localBlobRef.current) {
        setPreviewUrl(photoUrl);
        setHasImageError(false);
      }
    } else if (!photoUrl) {
      if (localBlobRef.current) {
        URL.revokeObjectURL(localBlobRef.current);
        localBlobRef.current = null;
      }
      setPreviewUrl("");
      setHasImageError(false);
    }
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (localBlobRef.current) {
        URL.revokeObjectURL(localBlobRef.current);
      }
    };
  }, []);

  const uploadResidentPhotoMutation = useUploadResidentPhotoMutation(
    draftResidentId || "",
  );
  const uploadAdmissionPhotoMutation = useUploadAdmissionPhotoMutation();

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPEG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > ADMISSION_UPLOAD_LIMITS.PHOTO.maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Photo must be smaller than ${ADMISSION_UPLOAD_LIMITS.PHOTO.maxSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    // 1. Show immediate local preview
    if (localBlobRef.current) {
      URL.revokeObjectURL(localBlobRef.current);
    }
    const localBlobUrl = URL.createObjectURL(file);
    localBlobRef.current = localBlobUrl;
    setPreviewUrl(localBlobUrl);
    setHasImageError(false);
    setIsUploadingPhoto(true);

    // 2. Upload file directly to S3 via backend service
    try {
      let remoteUrl = "";
      if (draftResidentId) {
        const res = (await uploadResidentPhotoMutation.mutateAsync(file)) as {
          photoUrl?: string;
        };
        remoteUrl = res?.photoUrl || "";
      } else {
        const res = await uploadAdmissionPhotoMutation.mutateAsync(file);
        remoteUrl = res?.photoUrl || res?.fileUrl || "";
      }

      if (remoteUrl) {
        // Store S3 streaming URL in parent state
        onPhotoChange(remoteUrl);
      }
    } catch {
      if (localBlobRef.current) {
        URL.revokeObjectURL(localBlobRef.current);
        localBlobRef.current = null;
      }
      setPreviewUrl("");
      setHasImageError(false);
      onPhotoChange("");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (localBlobRef.current) {
      URL.revokeObjectURL(localBlobRef.current);
      localBlobRef.current = null;
    }
    setPreviewUrl("");
    setHasImageError(false);
    onPhotoChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="md:col-span-3 flex flex-col items-center justify-center p-5 border border-dashed border-slate-300 rounded-2xl bg-white space-y-3 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        accept={ADMISSION_UPLOAD_LIMITS.PHOTO.accept}
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="size-24 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center overflow-hidden border-2 border-emerald-100 cursor-pointer relative group hover:opacity-90 transition-opacity"
        title="Click to select photo"
      >
        {previewUrl && !hasImageError ? (
          <img
            src={previewUrl}
            alt="Resident"
            crossOrigin="use-credentials"
            onError={() => setHasImageError(true)}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-10 text-emerald-800" />
        )}
        {isUploadingPhoto ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
            <Camera className="size-5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingPhoto}
          className="font-semibold rounded-xl px-3 gap-1.5 shadow-none border-slate-200 hover:bg-slate-50"
        >
          <Upload className="size-3 text-emerald-800" />
          {previewUrl ? "Change" : "Upload Photo"}
        </Button>
        {previewUrl && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleRemovePhoto}
            className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
            title="Remove Photo"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <p className="text-sm sm:text-md text-slate-500 font-normal">
        {ADMISSION_UPLOAD_LIMITS.PHOTO.hint}
      </p>
    </div>
  );
}

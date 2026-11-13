"use client";

import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button, toast } from "@repo/ui/components/ui";
import { ImagePreviewModal } from "./ImagePreviewModal";

export interface FindingPhoto {
  id: string;
  gcsPath: string;
  fileType: string;
  createdAt: string;
}

interface FindingPhotosSectionProps {
  photos: FindingPhoto[];
  isOpen: boolean;
  trackingId: string;
  onUploadPhoto?: (file: File) => void;
  photoStreamBaseUrl?: string;
}

export function FindingPhotosSection({
  photos = [],
  isOpen,
  trackingId,
  onUploadPhoto,
  photoStreamBaseUrl = "/api/body-map-photos",
}: FindingPhotosSectionProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Photo must be smaller than 5MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      onUploadPhoto?.(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-md font-semibold text-slate-700">
            Clinical Photographs ({photos.length})
          </p>
          <p className="text-md text-slate-400">JPG, PNG, WEBP (Max 5MB)</p>
        </div>
        {isOpen && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-md gap-1"
            >
              <Camera className="size-3.5" />
              Attach Photo
            </Button>
          </>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const url = `${photoStreamBaseUrl}/${photo.id}/stream`;
            return (
              <div
                key={photo.id}
                onClick={() => setPreviewImageUrl(url)}
                className="group relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer transition-all hover:ring-2 hover:ring-teal-700"
              >
                <img
                  src={url}
                  alt="Clinical photograph"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-md text-slate-400 italic py-1">
          No clinical photographs attached.
        </p>
      )}

      <ImagePreviewModal
        open={Boolean(previewImageUrl)}
        onOpenChange={(open) => !open && setPreviewImageUrl(null)}
        imageUrl={previewImageUrl}
        title={`Clinical Photograph · ${trackingId}`}
      />
    </div>
  );
}

"use client";

import React, { useRef, useState } from "react";
import { Image as ImageIcon, Plus, X, Loader2, Eye } from "lucide-react";
import { Button, Label, Text, Dialog, DialogContent, toast } from "@repo/ui/components/ui";
import { useUploadMedicationImageMutation } from "../../../../../../../lib/queries/residents";

interface MedicationImageUploaderProps {
  residentId: string;
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export function MedicationImageUploader({
  residentId,
  imageUrls,
  onChange,
  disabled = false,
}: MedicationImageUploaderProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMedicationImageMutation();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file format",
          description: "Please select an image file (JPG, PNG, WEBP).",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 5MB limit. Photo must be smaller than 5MB.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const res = await uploadMutation.mutateAsync({ residentId, file });
        if (res?.imageUrl) {
          uploadedUrls.push(res.imageUrl);
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...imageUrls, ...uploadedUrls]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(imageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="flex items-center gap-1.5 font-medium text-md text-slate-700">
            <ImageIcon className="size-3.5 text-slate-500" />
            Medication Images / Blister Packaging (Optional)
          </Label>
          <p className="text-sm text-slate-500 mt-0.5">
            Supported formats: JPG, PNG, WEBP · Max size: 5MB per photo
          </p>
        </div>
        <Text size="sm" variant="muted">
          {imageUrls.length} {imageUrls.length === 1 ? "image" : "images"} attached
        </Text>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Uploaded Image Cards */}
        {imageUrls.map((url, index) => (
          <div
            key={url + index}
            className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center"
          >
            { }
            <img
              src={url}
              alt={`Medication ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Hover Actions */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(url)}
                className="size-7 p-0 rounded-lg bg-white/80 hover:bg-white text-slate-800"
                title="Preview full image"
              >
                <Eye className="size-3.5" />
              </Button>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                  className="size-7 p-0 rounded-lg bg-red-500/80 hover:bg-red-600 text-white"
                  title="Remove image"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Upload Button */}
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="aspect-video rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin text-emerald-800" />
                <span className="text-md font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="size-4" />
                <span className="text-md font-medium">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Full-screen preview modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl bg-white p-2 rounded-2xl overflow-hidden">
            { }
            <img
              src={previewImage}
              alt="Medication Preview"
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

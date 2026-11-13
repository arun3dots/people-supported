"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, Building2, Trash2, Camera, Loader2 } from "lucide-react";
import { Card, Button, Text, toast } from "@repo/ui/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { GET_ORGANIZATION_PROFILE } from "@repo/endpoints";
import { useUploadAdmissionPhotoMutation } from "../../../../../../lib/queries/residents";
import { useUpdateOrganizationProfileMutation } from "../../../../../../lib/queries/organization/organizationMutations";

interface OrgBrandingCardProps {
  initialLogoUrl?: string | null;
  onLogoChange?: (logoUrl: string) => void;
}

export function OrgBrandingCard({ initialLogoUrl, onLogoChange }: OrgBrandingCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();
  const uploadMutation = useUploadAdmissionPhotoMutation();
  const updateProfileMutation = useUpdateOrganizationProfileMutation();

  useEffect(() => {
    if (initialLogoUrl !== undefined) {
      setLogoUrl(initialLogoUrl || "");
    }
  }, [initialLogoUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, SVG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setLogoUrl(localPreview);
    setIsUploading(true);

    try {
      const res = await uploadMutation.mutateAsync(file);
      const uploadedUrl = res?.photoUrl || res?.fileUrl || localPreview;

      // Persist logoUrl in the tenant database
      await updateProfileMutation.mutateAsync({ logoUrl: uploadedUrl });
      await queryClient.invalidateQueries({ queryKey: [GET_ORGANIZATION_PROFILE] });

      setLogoUrl(uploadedUrl);
      onLogoChange?.(uploadedUrl);
      toast({
        title: "Logo Uploaded",
        description: "Your organisation logo has been saved successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Upload Failed",
        description: "Failed to upload or save logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      await updateProfileMutation.mutateAsync({ logoUrl: null });
      await queryClient.invalidateQueries({ queryKey: [GET_ORGANIZATION_PROFILE] });
      setLogoUrl("");
      onLogoChange?.("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Logo Removed",
        description: "Organisation logo has been cleared and saved.",
      });
    } catch {
      toast({
        title: "Remove Failed",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-5 border border-slate-200/80 shadow-none w-full font-sans">
      {/* ==================== HEADER ==================== */}
      <div>
        <Text size={'base'} weight={'bold'} className="text-slate-900">
          Branding
        </Text>
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          Your supported living service&apos;s brand identity
        </Text>
      </div>

      {/* ==================== LOGO SECTION ==================== */}
      <div className="flex flex-col items-center justify-center gap-3 w-full">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Logo Circle */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="size-32 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-slate-200 cursor-pointer relative group hover:opacity-90 transition-opacity shrink-0"
          title="Click to change logo"
        >
          {logoUrl ? (

            <img
              src={logoUrl}
              alt="Supported Living Service Logo"
              className="size-full object-cover"
            />
          ) : (
            <Building2 className="size-12 text-white/80 stroke-[1.5]" />
          )}

          {isUploading ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera className="size-5" />
            </div>
          )}
        </div>

        {/* Subtext */}
        <Text size="md" weight="regular" className="text-center text-slate-400">
          JPG, PNG, or SVG · Max 2MB
        </Text>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xl h-9 px-3.5 text-md font-regular flex items-center gap-1.5 shrink-0 shadow-none border-slate-200"
          >
            <Upload className="size-3.5 text-emerald-800" />
            <span>{logoUrl ? "Change Logo" : "Upload Logo"}</span>
          </Button>

          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="size-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
              title="Remove Logo"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

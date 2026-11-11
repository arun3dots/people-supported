"use client";

import React, { useState } from "react";
import { Mail, Phone, ShieldCheck, MapPin, CheckCircle2, AlertTriangle, Edit, User, Heart, Camera } from "lucide-react";
import { Badge, Button, Card, CardContent, InfoField, Text } from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { cn } from "@repo/ui/lib/utils";
import { StaffEditForm } from "./forms/StaffEditForm";
import { useParams } from "next/navigation";
import { useGetStaffMemberQuery, useUploadStaffPhotoMutation } from "../../../../../../lib/queries/staff";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

interface StaffProfileSidebarProps {
  className?: string;
}

export function StaffProfileSidebar({ className }: StaffProfileSidebarProps = {}) {
  const { id: staffId } = useParams<{ id: string }>();
  const { data: staff, isLoading } = useGetStaffMemberQuery(staffId);
  const uploadPhotoMutation = useUploadStaffPhotoMutation(staffId);
  const { toast } = useToast();
  const [staffEditOpen, setStaffEditOpen] = useState(false);
  const [staffEditMode, setStaffEditMode] = useState<"contact" | "employment" | "all">("all");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Photo must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const res = await uploadPhotoMutation.mutateAsync(file);
      if (res?.photoUrl) {
        setPhotoUrl(res.photoUrl);
      }
      toast({
        title: "Photo Saved",
        description: "Profile photo saved to storage and database updated successfully.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload profile photo to storage.";
      toast({
        title: "Photo Upload Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      e.target.value = "";
    }
  };

  if (isLoading || !staff) {
    return (
      <Card className={cn("w-full h-full border border-border shadow-none animate-pulse", className)}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = photoUrl || staff.avatarUrl;

  return (
    <Card className={cn("h-full flex flex-col justify-between", className)}>
      <CardContent className="flex flex-col justify-start h-full p-6">
        {/* Avatar & Profile Overview Header */}
        <div className="flex flex-col items-center text-center w-full">
          {/* Square Full Width Profile Photo Card */}
          <Card className="relative w-full max-w-[200px] aspect-square p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm mx-auto">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={staff.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#4A706A]/10 via-[#4A706A]/20 to-[#4A706A]/30 flex flex-col items-center justify-center gap-1 text-[#4A706A]">
                <span className="text-4xl font-bold tracking-tight">{staff.fullName.charAt(0)}</span>
              </div>
            )}

            {/* Status Indicator Badge (Top Right) */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-md z-10">
              {staff.isActive ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Update Photo Button Overlay (Bottom Right) */}
            <label
              htmlFor={`photo-upload-${staff.id}`}
              className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-[#141F1E] p-2.5 rounded-full shadow-md cursor-pointer transition-all hover:scale-105 flex items-center justify-center z-10 border border-slate-200"
              title="Update Profile Photo"
            >
              {uploadPhotoMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-[#4A706A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-[#4A706A]" />
              )}
              <input
                id={`photo-upload-${staff.id}`}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handlePhotoChange}
                disabled={uploadPhotoMutation.isPending}
                className="hidden"
              />
            </label>
          </Card>

          {/* Allowed File Formats & Max Size Hint */}
          <p className="mt-2 text-sm text-slate-500 font-normal">
            JPG, PNG, WEBP · Max 5MB
          </p>

          <Text as="h3" size="md" weight="bold" className="mt-3 text-foreground">
            {staff.fullName}
          </Text>

          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary/70" />
            <Text size="sm" weight="medium" className="text-muted-foreground">
              {staff.role?.name || "No Role Assigned"}
            </Text>
          </div>

          <Badge
            variant={staff.isActive ? "default" : "secondary"}
            className={cn(
              "mt-3",
              staff.isActive
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            )}
          >
            {staff.isActive ? "Active Employee" : "Inactive"}
          </Badge>
        </div>

        {/* Contact Information Section */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-h7 font-medium">
              Contact Information
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStaffEditMode("contact");
                setStaffEditOpen(true);
              }}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            <InfoField
              icon={Mail}
              label="Email"
              value={staff.email}
            />

            <InfoField
              icon={Phone}
              label="Phone"
              value={staff.phoneNumber || "Not provided"}
            />

            {staff.address && (
              <InfoField
                icon={MapPin}
                label="Address"
                value={staff.address}
                multiline
              />
            )}
          </div>
        </div>


      </CardContent>

      {staff && (
        <StaffEditForm
          staff={staff}
          open={staffEditOpen}
          onOpenChange={setStaffEditOpen}
          mode={staffEditMode}
        />
      )}
    </Card>
  );
}

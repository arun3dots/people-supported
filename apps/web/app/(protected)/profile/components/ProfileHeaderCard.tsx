"use client";

import React, { useRef, useState, useEffect } from "react";
import { Heart, Camera, Mail, Loader2 } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Text } from "@repo/ui/components/ui/Text";
import { Card } from "@repo/ui/components/ui/Card";
import { toast } from "@repo/ui/components/ui";
import { format } from "date-fns";
import { useUploadMyProfilePhotoMutation } from "../../../../lib/queries/profile/useMyProfileQueries";

interface ProfileHeaderCardProps {
  fullName: string;
  roleName: string;
  email?: string;
  department?: string | null;
  photoUrl?: string | null;
  onEditPhoto?: () => void;
}

export function ProfileHeaderCard({
  fullName,
  roleName,
  email,
  department,
  photoUrl,
  onEditPhoto,
}: ProfileHeaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(photoUrl || null);
  const uploadPhotoMutation = useUploadMyProfilePhotoMutation();

  useEffect(() => {
    setCurrentPhoto(photoUrl || null);
  }, [photoUrl]);

  const handleTriggerUpload = () => {
    if (onEditPhoto) {
      onEditPhoto();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Photo must be smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setCurrentPhoto(previewUrl);

    try {
      const res = await uploadPhotoMutation.mutateAsync(file);
      if (res?.photoUrl) {
        setCurrentPhoto(res.photoUrl);
      }
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo to storage.",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card
      variant="primary"
      className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6 p-6 sm:p-7 rounded-2xl w-full border-none shadow-none relative overflow-hidden font-sans"
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploadPhotoMutation.isPending}
      />

      {/* Decorative ambient highlights */}
      <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-28 h-28 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

      {/* Left — Avatar + Name + Role */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 w-full md:w-auto z-10">
        {/* Avatar Container */}
        <div
          onClick={handleTriggerUpload}
          className="relative size-20 sm:size-22 shrink-0 cursor-pointer group"
          title="Click to change photo"
        >
          <div className="size-full rounded-full ring-4 ring-white/20 bg-white/15 backdrop-blur-xs flex items-center justify-center text-white font-bold text-2xl sm:text-3xl overflow-hidden shadow-inner group-hover:opacity-90 transition-opacity">
            {currentPhoto ? (

              <img
                src={currentPhoto}
                alt={fullName}
                className="size-full object-cover"
              />
            ) : (
              <span>{fullName ? fullName.charAt(0).toUpperCase() : "U"}</span>
            )}
          </div>

          {/* Camera Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerUpload();
            }}
            disabled={uploadPhotoMutation.isPending}
            className="absolute bottom-0 right-0 size-7.5 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-105 border border-slate-200 text-emerald-800 disabled:opacity-60 z-20"
            title="Edit photo"
          >
            {uploadPhotoMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </button>
        </div>

        {/* Text Details Container */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
          {/* Name + Role Badge Container */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="font-bold text-2xl sm:text-3xl text-white tracking-tight">
              {fullName}
            </span>
            <Badge
              state="success"
              className="text-md bg-emerald-100 text-emerald-900 border border-emerald-200/80 font-medium px-2.5 py-0.5 rounded-full shadow-none"
            >
              {roleName}
            </Badge>
            {department && (
              <Badge
                state="info"
                className="text-md bg-white/20 text-white border border-white/25 font-medium px-2.5 py-0.5 rounded-full shadow-none"
              >
                {department}
              </Badge>
            )}
          </div>

          {/* Subtitles (Email + Care Haven) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-md text-white/90">
            {email && (
              <div className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-emerald-200 shrink-0" />
                <span>{email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="size-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Heart className="size-2.5 text-white fill-white" />
              </div>
              <Text size="sm" weight="medium" className="text-white/90">
                {department}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Last Login Pill */}
      <div className="flex flex-col items-center md:items-end justify-center gap-1.5 text-center md:text-right shrink-0 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/15 z-10">
        <Text size="sm" weight="medium" className="text-emerald-100/90 uppercase tracking-wider text-sm">
          Last Login
        </Text>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <Text size="sm" weight="semibold" className="text-white whitespace-nowrap">
            Today, {format(new Date(), "HH:mm")}
          </Text>
        </div>
      </div>
    </Card>
  );
}

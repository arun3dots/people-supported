"use client";

import Image from "next/image";
import { ChevronRight, Settings, DoorOpen } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";

interface EntitySuccessStepProps {
  title?: string;
  description?: string;
  entityName?: string;
  action1Title?: string;
  action1Subtext?: string;
  action1ButtonText?: string;
  action2Title?: string;
  action2Subtext?: string;
  action2ButtonText?: string;
  onGoToRooms: () => void;
  onViewWings: () => void;
}

export function EntitySuccessStep({
  title,
  description,
  entityName,
  action1Title = "Continue Setting Up",
  action1Subtext = "Add more rooms or beds to complete your setup.",
  action1ButtonText = "Go to Bed Details",
  action2Title = "View All Beds",
  action2Subtext = "Return to Bed management and view all details",
  action2ButtonText = "View All Details",
  onGoToRooms,
  onViewWings,
}: EntitySuccessStepProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-5 font-sans">
      {/* Header Section (Illustration & Titles) */}
      <div className="w-full flex flex-col items-center gap-3">
        {/* Image / Illustration */}
        <div className="relative w-48 h-28 flex items-center justify-center">
          <Image
            src="/images/common/created-success.png"
            alt="Created Success Illustration"
            width={200}
            height={120}
            style={{ width: "auto", height: "auto" }}
            className="object-contain"
            priority
          />
        </div>

        {/* Text Group */}
        <div className="flex flex-col items-center gap-1 w-full text-center">
          <h3 className="font-medium text-xl text-foreground">
            {title || "Bed added Successfully!"}
          </h3>
          <p className="text-md text-muted-foreground">
            {description || `${entityName || "Bed"} has been created Successfully.`}
          </p>
        </div>
      </div>

      {/* Decorative Line Separator with Dot */}
      <div className="w-44 flex items-center justify-center gap-1 py-1">
        <div className="flex-1 h-px bg-[#BCD3CD]" />
        <div className="size-1.5 rounded-full bg-[#6C958D] shrink-0" />
        <div className="flex-1 h-px bg-[#BCD3CD]" />
      </div>

      {/* Action Cards Container */}
      <div className="w-full flex flex-col gap-3">
        {/* Card 1: Continue Setting Up */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          {/* Left Icon + Text Group */}
          <div className="flex items-center gap-3">
            {/* Icon + Vertical Line Container */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="size-11 rounded-full bg-emerald-100 flex items-center justify-center">
                <Settings className="size-5 text-[#4A706A]" />
              </div>
              <div className="h-8 w-px bg-slate-200" />
            </div>

            {/* Content Labels */}
            <div className="flex flex-col gap-0.5 text-left">
              <h4 className="font-medium text-md text-slate-900">
                {action1Title}
              </h4>
              <p className="text-md text-muted-foreground leading-tight max-w-[170px]">
                {action1Subtext}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Button
            type="button"
            onClick={onGoToRooms}
            className="w-full sm:w-36 h-11 bg-[#4A706A] hover:bg-[#3d5d58] text-white rounded-xl text-md font-normal flex items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer shadow-none"
          >
            {action1ButtonText}
            <ChevronRight className="size-3.5 shrink-0" />
          </Button>
        </div>

        {/* Card 2: View All Details */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          {/* Left Icon + Text Group */}
          <div className="flex items-center gap-3">
            {/* Icon + Vertical Line Container */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="size-11 rounded-full bg-[#DEE9E6]/60 flex items-center justify-center">
                <DoorOpen className="size-5 text-[#4A706A]" />
              </div>
              <div className="h-8 w-px bg-[#BCD3CD]" />
            </div>

            {/* Content Labels */}
            <div className="flex flex-col gap-0.5 text-left">
              <h4 className="font-['Outfit'] font-medium text-md text-[#141F1E]">
                {action2Title}
              </h4>
              <p className="font-['Outfit'] text-md text-muted-foreground leading-tight max-w-[170px]">
                {action2Subtext}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Button
            type="button"
            onClick={onViewWings}
            className="w-full sm:w-36 h-11 bg-transparent hover:bg-[#DEE9E6]/30 border border-[#4A706A] text-[#4A706A] rounded-xl text-md font-normal flex items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer shadow-none"
          >
            {action2ButtonText}
            <ChevronRight className="size-3.5 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}
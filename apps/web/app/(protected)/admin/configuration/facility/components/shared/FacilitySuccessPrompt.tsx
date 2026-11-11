"use client";

import Image from "next/image";
import { Button } from "@repo/ui/components/ui/Button";
import { Plus, ChevronRight } from "lucide-react";

interface FacilitySuccessPromptProps {
  title: string;
  description: string;
  entityName: string;
  addAnotherLabel?: string;
  onAddAnother?: () => void;
  addNextLabel?: string;
  onAddNext?: () => void;
  onFinish: () => void;
  isEdit?: boolean;
}

export function FacilitySuccessPrompt({
  title,
  description,
  entityName,
  addAnotherLabel,
  onAddAnother,
  addNextLabel,
  onAddNext,
  onFinish,
  isEdit = false,
}: FacilitySuccessPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 max-w-full w-full mx-auto select-none overflow-x-hidden">
      {/* Illustration or Check Graphic */}
      <div className="relative w-28 h-24 flex items-center justify-center">
        <Image
          src="/images/common/great-job.png"
          alt="Success Illustration"
          width={112}
          height={96}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
          priority
        />
      </div>

      {/* Headings */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900 font-sans">
          {title}
        </h3>
        <p className="text-md text-slate-500 font-normal font-sans">
          {description}
        </p>
      </div>

      {!isEdit && (
        <p className="text-md font-semibold text-slate-700 pt-1">
          What would you like to do next?
        </p>
      )}

      {/* Responsive action row; wrap instead of overflowing narrow dialogs */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full pt-2">
        {/* Add Next (e.g. Add Wings / Add Rooms / Add Beds) */}
        {!isEdit && addNextLabel && onAddNext && (
          <Button
            type="button"
            onClick={onAddNext}
            variant="primary"
            className="h-10 w-full sm:w-auto px-3.5 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 text-sm sm:text-md whitespace-nowrap"
          >
            {addNextLabel} <ChevronRight className="size-3.5" />
          </Button>
        )}

        {/* Add Another (e.g. Add Another Unit) */}
        {!isEdit && addAnotherLabel && onAddAnother && (
          <Button
            type="button"
            onClick={onAddAnother}
            variant="outline"
            className="h-10 w-full sm:w-auto px-3.5 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 text-sm sm:text-md whitespace-nowrap border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="size-3.5" /> {addAnotherLabel}
          </Button>
        )}

        {/* Finish for Now / Done (Green Outline Cancel Button) */}
        <Button
          type="button"
          onClick={onFinish}
          variant="outline"
          className="h-10 w-full sm:w-auto px-3.5 sm:px-4 rounded-xl bg-white hover:bg-[#4A706A]/10 !border-2 !border-[#4A706A] !text-[#4A706A] transition-colors cursor-pointer font-medium text-sm sm:text-md whitespace-nowrap shadow-none"
        >
          {isEdit ? "Done" : "Finish for Now"}
        </Button>
      </div>
    </div>
  );
}

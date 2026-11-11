"use client";

import Image from "next/image";
import { Button, Text } from "@repo/ui/components/ui";
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
        <Text as="h3" size="lg" weight="semibold" className="text-slate-900 font-sans">
          {title}
        </Text>
        <Text size="md" variant="muted" className="font-sans">
          {description}
        </Text>
      </div>

      {!isEdit && (
        <Text size="md" weight="medium" className="text-slate-700 pt-1">
          What would you like to do next?
        </Text>
      )}

      {/* Responsive action row; wrap instead of overflowing narrow dialogs */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full pt-2">
        {/* Add Next (e.g. Add Wings / Add Rooms / Add Beds) */}
        {!isEdit && addNextLabel && onAddNext && (
          <Button
            type="button"
            onClick={onAddNext}
            variant="primary"
            className="h-10 w-full sm:w-auto px-3.5 sm:px-4 gap-1.5 whitespace-nowrap"
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
            className="h-10 w-full sm:w-auto px-3.5 sm:px-4 gap-1.5 whitespace-nowrap"
          >
            <Plus className="size-3.5" /> {addAnotherLabel}
          </Button>
        )}

        {/* Finish for Now / Done (Outline Button) */}
        <Button
          type="button"
          onClick={onFinish}
          variant="outline"
          className="h-10 w-full sm:w-auto px-3.5 sm:px-4 whitespace-nowrap"
        >
          {isEdit ? "Done" : "Finish for Now"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { Button } from "@repo/ui/components/ui/Button";

interface WingCreatedPopupProps {
  wingName: string;
  onFinish: () => void;
  onAddRoom: () => void;
  isEdit?: boolean;
}

export function WingCreatedPopup({
  wingName,
  onFinish,
  onAddRoom,
  isEdit = false,
}: WingCreatedPopupProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      {/* Character Illustration */}
      <div className="relative size-32 flex items-center justify-center">
        <Image
          src="/images/common/great-job.png"
          alt="Great Job Illustration"
          width={120}
          height={120}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
          priority
        />
      </div>

      <div>
        <h3 className="text-xl font-bold text-foreground">
          {wingName || "Residential Wing"} {isEdit ? "Updated" : "Created"}!
        </h3>
        <p className="text-md text-muted-foreground mt-1 max-w-[260px] mx-auto">
          Wing has been {isEdit ? "updated" : "created"} successfully.{!isEdit ? " What would you like to do next?" : ""}
        </p>
      </div>

      <div className="flex items-center gap-3 w-full pt-2">
        <Button
          variant="outline"
          onClick={onFinish}
          className="flex-1 h-10 rounded-xl bg-white hover:bg-[#4A706A]/10 !border-2 !border-[#4A706A] !text-[#4A706A] text-md font-medium shadow-none"
        >
          {isEdit ? "Done" : "Finish for now"}
        </Button>
        {!isEdit && (
          <Button
            onClick={onAddRoom}
            variant="primary"
            className="flex-1 h-10 rounded-xl text-white text-md font-medium shadow-sm"
          >
            Add Room →
          </Button>
        )}
      </div>
    </div>
  );
}

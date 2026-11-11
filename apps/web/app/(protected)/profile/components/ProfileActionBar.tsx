"use client";

import React from "react";
import { RefreshCcw, Shield } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";

export function ProfileActionBar() {
  return (
    <div className="sticky -bottom-4 -mx-8 bg-white/95 backdrop-blur-sm border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-end gap-3 z-40">
      <Button
        variant="outline"
        className="gap-2 rounded-xl border-[#BCD3CD] text-[#141F1E]"
      >
        <RefreshCcw className="w-4 h-4" /> Reset Changes
      </Button>
      <Button className="gap-2 rounded-xl bg-[#4A706A] hover:bg-[#3D5C57] text-white">
        <Shield className="w-4 h-4" /> Save Profile
      </Button>
    </div>
  );
}

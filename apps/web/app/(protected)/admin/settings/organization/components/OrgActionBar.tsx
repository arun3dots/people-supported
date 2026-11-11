"use client";

import React from "react";
import { RefreshCcw, Save, Loader2, Shield, Pencil } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

interface OrgActionBarProps {
  isPending: boolean;
  onReset: () => void;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function OrgActionBar({
  isPending,
  onReset,
  isEditing = true,
  onEditClick,
}: OrgActionBarProps) {
  return (
    <div className="sticky -bottom-4 -mx-8 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-8 py-3.5 flex items-center justify-between z-40 font-sans">
      <div className="flex items-center gap-2.5 text-slate-500">
        <Shield className="size-4 text-emerald-800 shrink-0" />
        <div className="flex flex-col text-left">
          <Text size="sm" weight="medium" className="text-slate-700">
            Your information is securely stored and encrypted
          </Text>
          <Text size="sm" weight="regular" className="text-slate-400 text-[11px]">
            Last updated on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-md font-regular h-10 px-4 flex items-center gap-1.5 shadow-none border-slate-200 bg-white hover:bg-slate-50"
              onClick={onReset}
            >
              <RefreshCcw className="size-3.5" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="rounded-xl text-md font-semibold h-10 px-5 flex items-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Save Profile</span>
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-md font-regular h-10 px-4 flex items-center gap-1.5 shadow-none border-slate-200 bg-white hover:bg-slate-50"
            onClick={onEditClick}
          >
            <Pencil className="size-3.5 text-emerald-800" />
            <span>Edit Profile</span>
          </Button>
        )}
      </div>
    </div>
  );
}

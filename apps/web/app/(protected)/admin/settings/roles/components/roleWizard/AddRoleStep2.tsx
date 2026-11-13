"use client";

import {
  KeyRound,
  Home,
  Users,
  Calendar,
  Building2,
  Folder,
  BarChart3,
  Settings,
  CheckCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { UseFormReturn } from "react-hook-form";

interface AddRoleStep2Props {
  form: UseFormReturn<any>;
}

export const MODULE_CONFIG = [
  { id: "residents", label: "Resident Directory", icon: Home },
  { id: "staff", label: "Staff Directory", icon: Users },
  { id: "rota", label: "Rota Management", icon: Calendar },
  { id: "facilities", label: "Facility Setup", icon: Building2 },
  { id: "resources", label: "Resources", icon: Folder },
  { id: "reports", label: "Report & Audit", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const GRANULAR_ACTIONS = [
  { id: "view", label: "View" },
  { id: "create", label: "Create" },
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete" },
  { id: "publish", label: "Publish" },
  { id: "archive", label: "Archive" },
  { id: "export", label: "Export" },
];

export const ALL_GRANULAR_ACTION_IDS = GRANULAR_ACTIONS.map((a) => a.id);

export function AddRoleStep2({ form }: AddRoleStep2Props) {
  const { watch, setValue } = form;
  const moduleLevels = watch("moduleLevels") || {};

  const handleLevelChange = (modId: string, value: string) => {
    setValue(`moduleLevels.${modId}`, value);
    if (value === "Full Access") {
      setValue(`granularPermissions.${modId}`, [...ALL_GRANULAR_ACTION_IDS]);
    } else if (value === "No Access") {
      setValue(`granularPermissions.${modId}`, []);
    }
  };

  const handleSetAllFullAccess = () => {
    const updatedLevels: Record<string, string> = {};
    const updatedGranular: Record<string, string[]> = {};
    MODULE_CONFIG.forEach((m) => {
      updatedLevels[m.id] = "Full Access";
      updatedGranular[m.id] = [...ALL_GRANULAR_ACTION_IDS];
    });
    setValue("moduleLevels", updatedLevels);
    setValue("granularPermissions", updatedGranular);
  };

  return (
    <div className="flex flex-col gap-[11px] text-left font-['Outfit',sans-serif]">
      {/* Header Banner Card */}
      <div className="w-full h-[57.31px] bg-[#F5F8F7] border border-[#BCD3CD] border-[0.5px] rounded-xl p-[10px] flex items-center justify-between">
        <div className="flex items-center gap-[5.91px]">
          {/* Icon Container */}
          <div className="size-[37.31px] rounded-xl bg-[#DEE9E6] flex items-center justify-center shrink-0">
            <KeyRound className="size-[20px] text-[#4A706A]" />
          </div>

          {/* Text Container */}
          <div className="flex flex-col gap-[2px]">
            <h3 className="text-[14px] font-medium leading-[18px] text-[#141F1E]">
              Module Permissions
            </h3>
            <p className="text-md font-normal leading-[13px] text-[#5D5D5D]">
              Select the modules this role can access.
            </p>
          </div>
        </div>

        {/* Set All Full Access Shortcut */}
        <button
          type="button"
          onClick={handleSetAllFullAccess}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-[#4A706A] border border-[#BCD3CD] rounded-lg text-md font-medium transition-colors cursor-pointer shadow-2xs"
        >
          <CheckCheck className="size-3.5" />
          Set All Full Access
        </button>
      </div>

      {/* Modules List Container */}
      <div className="w-full bg-[#F7F7F7] rounded-xl py-[10px] px-[12px] flex flex-col justify-center gap-[6px]">
        {MODULE_CONFIG.map((mod) => {
          const Icon = mod.icon;
          const level = moduleLevels[mod.id] || "Full Access";

          return (
            <div
              key={mod.id}
              className="w-full h-[48px] flex items-center justify-between px-[10px]"
            >
              {/* Left Side: Icon & Title */}
              <div className="flex items-center gap-[10px]">
                <div className="size-[30px] rounded-lg bg-[#DEE9E6] flex items-center justify-center shrink-0">
                  <Icon className="size-[16px] text-[#4A706A]" />
                </div>
                <span className="text-md font-normal leading-[15px] text-[#141F1E]">
                  {mod.label}
                </span>
              </div>

              {/* Right Side: Select Dropdown */}
              <Select
                value={level}
                onValueChange={(val) => handleLevelChange(mod.id, val)}
              >
                <SelectTrigger className="w-[110px] h-[36px] !bg-white border border-[#BCD3CD] border-[0.5px] rounded-xl px-[10px] text-md font-normal text-[#141F1E] focus:ring-0 focus:ring-offset-0 shadow-none justify-between">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#BCD3CD] border-[0.5px] rounded-xl">
                  <SelectItem value="Full Access" className="text-md">
                    Full Access
                  </SelectItem>
                  <SelectItem value="Custom Access" className="text-md">
                    Custom Access
                  </SelectItem>
                  <SelectItem value="No Access" className="text-md">
                    No Access
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

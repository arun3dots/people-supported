"use client";

import { FileText, KeyRound, SlidersHorizontal, Ban } from "lucide-react";
import { Input } from "@repo/ui/components/ui/Input";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@repo/ui/lib/utils";
import { MODULE_CONFIG, ALL_GRANULAR_ACTION_IDS } from "./AddRoleStep2";

interface AddRoleStep1Props {
  form: UseFormReturn<any>;
}

export function AddRoleStep1({ form }: AddRoleStep1Props) {
  const { register, watch, setValue, formState } = form;
  const accessType = watch("accessType") || "Custom Access";

  const handleSelectAccessPreset = (presetId: string) => {
    setValue("accessType", presetId);

    const updatedLevels: Record<string, string> = {};
    const updatedGranular: Record<string, string[]> = {};

    if (presetId === "Full Access") {
      MODULE_CONFIG.forEach((m) => {
        updatedLevels[m.id] = "Full Access";
        updatedGranular[m.id] = [...ALL_GRANULAR_ACTION_IDS];
      });
    } else if (presetId === "Audit Access") {
      MODULE_CONFIG.forEach((m) => {
        updatedLevels[m.id] = "No Access";
        updatedGranular[m.id] = [];
      });
    } else if (presetId === "Custom Access") {
      MODULE_CONFIG.forEach((m, idx) => {
        updatedLevels[m.id] = idx < 3 ? "Custom Access" : "Full Access";
        updatedGranular[m.id] = [...ALL_GRANULAR_ACTION_IDS];
      });
    }
    setValue("moduleLevels", updatedLevels);
    setValue("granularPermissions", updatedGranular);
  };

  const accessOptions = [
    {
      id: "Full Access",
      title: "Full Access",
      desc: "Access to all Modules and feature",
      icon: KeyRound,
    },
    {
      id: "Custom Access",
      title: "Custom Access",
      desc: "Select specific module and permission",
      icon: SlidersHorizontal,
    },
    {
      id: "Audit Access",
      title: "Audit Access",
      desc: "No access to any module",
      icon: Ban,
    },
  ];

  return (
    <div className="flex flex-col gap-5 text-left font-['Outfit',sans-serif]">
      {/* Header Banner Card (Frame 1124) */}
      <div className="w-full bg-[#F5F8F7] border border-[#BCD3CD] border-[0.5px] rounded-xl p-[10px] flex items-center gap-[10px]">
        {/* Icon Container (Frame 1123) */}
        <div className="size-[37.31px] rounded-xl bg-[#DEE9E6] flex items-center justify-center shrink-0">
          <FileText className="size-[20px] text-[#4A706A]" />
        </div>

        {/* Text Container */}
        <div className="flex flex-col gap-[2px]">
          <h3 className="text-[14px] font-medium leading-[18px] text-[#141F1E]">
            Basic Information
          </h3>
          <p className="text-md font-normal leading-[13px] text-[#5D5D5D]">
            Enter the basic details of the new role.
          </p>
        </div>
      </div>

      {/* Role Name Section (Frame 1126) */}
      <div className="flex flex-col gap-[6px]">
        <label className="text-md font-medium leading-[13px] text-[#141F1E]">
          Role Name <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Enter role name"
          className="h-[36px] bg-white border-[#BCD3CD] border-[0.5px] rounded-xl px-[10px] text-md font-normal text-[#141F1E] placeholder:text-[#5D5D5D] focus-visible:ring-1 focus-visible:ring-[#4A706A]"
          {...register("name", { required: true })}
        />
        {formState.errors.name?.message && (
          <p className="text-md font-medium text-red-600">
            {String(formState.errors.name.message)}
          </p>
        )}
      </div>

      {/* Access Preset Cards (Frame 1827 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] sm:gap-[20px]">
        {accessOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = accessType === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => handleSelectAccessPreset(opt.id)}
              className={cn(
                "h-[118px] rounded-xl p-[10px] py-[20px] cursor-pointer transition-all border flex flex-col items-center justify-between text-center select-none",
                isSelected
                  ? "bg-[#F5F8F7] border-[#4A706A] border-[0.5px]"
                  : "bg-white border-[#BCD3CD] border-[0.4px] hover:border-[#4A706A]/50"
              )}
            >
              {/* Icon Container (Frame 1864) */}
              <div className="size-[32px] rounded-lg bg-[#DEE9E6] flex items-center justify-center shrink-0">
                <Icon className="size-[18px] text-[#4A706A]" />
              </div>

              {/* Title & Description */}
              <div className="flex flex-col items-center gap-[2px] w-full">
                <h4 className="text-md font-normal leading-[15px] text-[#141F1E]">
                  {opt.title}
                </h4>
                <p className="text-md font-normal leading-[10px] text-[#5D5D5D] max-w-[100px] line-clamp-2">
                  {opt.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Description Section (Frame 1775) */}
      <div className="flex flex-col gap-[7px]">
        <label className="text-md font-medium leading-[13px] text-[#141F1E]">
          Description
        </label>
        <textarea
          rows={2}
          placeholder="Add any additional notes about this room.."
          className="w-full h-[43px] rounded-xl bg-white border border-[#BCD3CD] border-[0.5px] p-[10px] text-md font-normal text-[#141F1E] placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#4A706A] resize-none leading-[13px]"
          {...register("description")}
        />
      </div>
    </div>
  );
}
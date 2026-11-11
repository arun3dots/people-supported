"use client";

import React from "react";
import { Edit3, CheckSquare, User, ListFilter, Building2, Users, Calendar, Settings, ShieldCheck, FileText, Wrench } from "lucide-react";
import { MODULE_CONFIG } from "./AddRoleStep2";
import { cn } from "@repo/ui/lib/utils";

interface AddRoleStep4Props {
  formData: any;
  onGoToStep: (step: 1 | 2 | 3 | 4) => void;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  resident: <Building2 className="size-[14px] text-[#4A706A]" />,
  staff: <Users className="size-[14px] text-[#4A706A]" />,
  rota: <Calendar className="size-[14px] text-[#4A706A]" />,
  facility: <Building2 className="size-[14px] text-[#4A706A]" />,
  resources: <Wrench className="size-[14px] text-[#4A706A]" />,
  report: <FileText className="size-[14px] text-[#4A706A]" />,
  settings: <Settings className="size-[14px] text-[#4A706A]" />,
};

export function AddRoleStep4({ formData, onGoToStep }: AddRoleStep4Props) {
  const roleName = formData.name || "Clinical Lead";
  const accessLevel = formData.accessType || "Custom Access";
  const moduleLevels = formData.moduleLevels || {};

  const getModuleLevel = (modId: string, index: number) => {
    return moduleLevels[modId] || (index < 3 ? "Custom Access" : "Full Access");
  };

  const fullAccessCount = MODULE_CONFIG.filter(
    (mod, idx) => getModuleLevel(mod.id, idx) === "Full Access"
  ).length;

  const customAccessCount = MODULE_CONFIG.filter(
    (mod, idx) => getModuleLevel(mod.id, idx) === "Custom Access"
  ).length;

  const noAccessCount = MODULE_CONFIG.filter(
    (mod, idx) => getModuleLevel(mod.id, idx) === "No Access"
  ).length;

  return (
    <div className="flex flex-col gap-[11px] text-left font-['Outfit',sans-serif] w-full mx-auto">
      {/* Header Banner Card */}
      <div className="w-full h-[57.31px] bg-[#F5F8F7] border border-[#BCD3CD] border-[0.4px] rounded-xl p-[10px] flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          {/* Green Container with Check Icon */}
          <div className="size-[37.31px] rounded-xl bg-[#DEE9E6] flex items-center justify-center shrink-0">
            <CheckSquare className="size-[20px] text-[#4A706A]" />
          </div>

          <div className="flex flex-col justify-center gap-[2px]">
            <h3 className="text-[14px] font-medium leading-[18px] text-[#141F1E]">
              Review & Confirm
            </h3>
            <p className="text-[10px] font-normal leading-[13px] text-[#5D5D5D]">
              Set specific permissions for this module.
            </p>
          </div>
        </div>

        {/* Decorative Image Side */}
        <div className="pr-2 shrink-0">
          <img
            src="/images/common/add-role.png"
            alt="Add Role"
            className="h-[36px] w-auto object-contain"
          />
        </div>
      </div>

      {/* Grid: 2 Summary Cards (Role Information & Module Summary) */}
      <div className="grid grid-cols-2 gap-[10px] w-full">
        {/* Card 1: Role Information */}
        <div className="bg-[#FFFFFF] border-2 border-[#F7F7F7] rounded-xl p-[15px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <User className="size-[14px] text-[#4A706A]" />
              <span className="text-[12px] font-medium text-[#141F1E]">
                Role Information
              </span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="px-[8px] py-[3px] border border-[#BCD3CD] rounded-lg text-[10px] text-[#141F1E] flex items-center gap-[4px] bg-white hover:bg-gray-50"
            >
              <Edit3 className="size-[10px]" /> Edit
            </button>
          </div>

          <div className="flex flex-col gap-[8px] text-[12px]">
            <div className="flex justify-between items-center pb-[6px] border-b border-[#BCD3CD]/40">
              <span className="text-[#141F1E]">Role Name</span>
              <span className="text-[#5D5D5D]">{roleName}</span>
            </div>
            {formData.description ? (
              <div className="flex justify-between items-center pb-[6px] border-b border-[#BCD3CD]/40">
                <span className="text-[#141F1E]">Description</span>
                <span className="text-[#5D5D5D] truncate max-w-[150px]">{formData.description}</span>
              </div>
            ) : null}
            <div className="flex justify-between items-center">
              <span className="text-[#141F1E]">Access Level</span>
              <span className="px-2.5 py-0.5 bg-[#FDFBE9] border border-[#C38C0B]/30 rounded-full text-md font-medium text-[#C38C0B]">
                {accessLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Module Summary */}
        <div className="bg-[#FFFFFF] border-2 border-[#F7F7F7] rounded-xl p-[15px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <ListFilter className="size-[14px] text-[#4A706A]" />
              <span className="text-[12px] font-medium text-[#141F1E]">
                Module Summary
              </span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="px-[8px] py-[3px] border border-[#BCD3CD] rounded-lg text-[10px] text-[#141F1E] flex items-center gap-[4px] bg-white hover:bg-gray-50"
            >
              <Edit3 className="size-[10px]" /> Edit
            </button>
          </div>

          <div className="flex flex-col gap-[8px] text-[12px]">
            <div className="flex justify-between items-center pb-[6px] border-b border-[#BCD3CD]/40">
              <span className="text-[#141F1E]">Full Access</span>
              <span className="text-[#5D5D5D]">{String(fullAccessCount).padStart(2, "0")}</span>
            </div>
            <div className="flex justify-between items-center pb-[6px] border-b border-[#BCD3CD]/40">
              <span className="text-[#141F1E]">Custom Access</span>
              <span className="text-[#5D5D5D]">{String(customAccessCount).padStart(2, "0")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#141F1E]">No Access</span>
              <span className="text-[#5D5D5D]">{String(noAccessCount).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Overview Container */}
      <div className="w-full bg-[#FFFFFF] border-2 border-[#F7F7F7] rounded-xl p-6 flex flex-col">
        {MODULE_CONFIG.map((mod, index) => {
          const level = getModuleLevel(mod.id, index);
          const isCustom = level === "Custom Access";
          const isNoAccess = level === "No Access";

          return (
            <React.Fragment key={mod.id}>
              <div className="flex items-center justify-between py-[10px]">
                {/* Module Icon + Name */}
                <div className="flex items-center gap-[10px]">
                  <div className="size-[28px] rounded-lg bg-[#DEE9E6]/60 flex items-center justify-center shrink-0">
                    {MODULE_ICONS[mod.id] || <Building2 className="size-[14px] text-[#4A706A]" />}
                  </div>
                  <span className="text-[12px] font-medium text-[#141F1E]">
                    {mod.label}
                  </span>
                </div>

                {/* Status Badge + Edit Button */}
                <div className="flex items-center gap-[10px]">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-md font-medium border",
                      isNoAccess
                        ? "bg-slate-100 border-slate-200 text-slate-500"
                        : isCustom
                          ? "bg-[#FDFBE9] border-[#C38C0B]/40 text-[#C38C0B]"
                          : "bg-[#EBF7EE] border-[#22973F]/30 text-[#22973F]"
                    )}
                  >
                    {level}
                  </span>

                  <button
                    type="button"
                    onClick={() => onGoToStep(3)}
                    className="p-[4px] text-[#5D5D5D] hover:text-[#141F1E] transition-colors"
                  >
                    <Edit3 className="size-[13px]" />
                  </button>
                </div>
              </div>

              {/* Row Separator Line */}
              {index < MODULE_CONFIG.length - 1 && (
                <div className="w-full border-b border-[#BCD3CD]/30" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
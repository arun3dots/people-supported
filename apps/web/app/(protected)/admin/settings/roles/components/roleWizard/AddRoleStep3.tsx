"use client";

import React, { useState } from "react";
import { Sliders, Check, CheckCheck } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import {
  MODULE_CONFIG,
  GRANULAR_ACTIONS,
  ALL_GRANULAR_ACTION_IDS,
} from "./AddRoleStep2";
import { cn } from "@repo/ui/lib/utils";

interface AddRoleStep3Props {
  form: UseFormReturn<any>;
}

export { GRANULAR_ACTIONS };

function getActionLabel(actId: string, modId: string): string {
  const modNoun =
    modId === "staff"
      ? "Staff"
      : modId === "facilities"
        ? "Facility"
        : modId === "residents"
          ? "Resident"
          : "Rota";

  switch (actId) {
    case "view":
      return `View ${modNoun}`;
    case "create":
      return `Create ${modNoun}`;
    case "edit":
      return `Edit ${modNoun}`;
    case "delete":
      return `Delete ${modNoun}`;
    case "publish":
      return `Publish ${modNoun}`;
    case "archive":
      return `Archive ${modNoun}`;
    case "export":
      return `Export ${modNoun}`;
    default:
      return actId;
  }
}

export function AddRoleStep3({ form }: AddRoleStep3Props) {
  const { watch, setValue } = form;
  const [selectedModule, setSelectedModule] = useState(
    MODULE_CONFIG[2]?.id || "rota"
  );
  const granularPermissions = watch("granularPermissions") || {};
  const moduleLevels = watch("moduleLevels") || {};

  const activeModLabel =
    MODULE_CONFIG.find((m) => m.id === selectedModule)?.label || "Module";

  // When a module has Full Access or isn't explicitly customized yet, default to ALL action IDs
  const getModuleActions = (modId: string): string[] => {
    if (granularPermissions[modId] !== undefined) {
      return granularPermissions[modId];
    }
    const level = moduleLevels[modId];
    if (level === "No Access") {
      return [];
    }
    return [...ALL_GRANULAR_ACTION_IDS];
  };

  const currentActions = getModuleActions(selectedModule);
  const isAllSelected =
    ALL_GRANULAR_ACTION_IDS.length > 0 &&
    ALL_GRANULAR_ACTION_IDS.every((id) => currentActions.includes(id));

  const toggleAction = (modId: string, actionId: string) => {
    const current = getModuleActions(modId);
    let updated: string[];
    if (modId === "rota") {
      if (actionId === "view" && current.includes("view")) {
        updated = [];
      } else if (current.includes(actionId)) {
        updated = current.filter((a: string) => a !== actionId);
      } else {
        const dependentActions =
          actionId === "create" ||
          actionId === "edit" ||
          actionId === "delete" ||
          actionId === "publish" ||
          actionId === "archive" ||
          actionId === "export";
        updated = dependentActions
          ? [...new Set([...current, "view", actionId])]
          : [...current, actionId];
      }
    } else {
      updated = current.includes(actionId)
        ? current.filter((a: string) => a !== actionId)
        : [...current, actionId];
    }
    setValue(`granularPermissions.${modId}`, updated);
    if (updated.length === 0) {
      setValue(`moduleLevels.${modId}`, "No Access");
    } else if (modId === "rota") {
      setValue(`moduleLevels.${modId}`, "Custom Access");
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setValue(`granularPermissions.${selectedModule}`, []);
    } else {
      setValue(`granularPermissions.${selectedModule}`, [
        ...ALL_GRANULAR_ACTION_IDS,
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-[11px] text-left font-['Outfit',sans-serif] w-full mx-auto">
      {/* Header Banner Card */}
      <div className="w-full h-[57.31px] bg-[#F5F8F7] border border-[#BCD3CD] border-[0.4px] rounded-xl p-[10px] flex items-center gap-[10px]">
        {/* Icon Container */}
        <div className="size-[37.31px] rounded-xl bg-[#DEE9E6] flex items-center justify-center shrink-0">
          <Sliders className="size-[20px] text-[#4A706A]" />
        </div>

        {/* Text Area */}
        <div className="flex flex-col justify-center gap-[2px]">
          <h3 className="text-[14px] font-medium leading-[18px] text-[#141F1E]">
            {activeModLabel} Permissions
          </h3>
          <p className="text-md font-normal leading-[13px] text-[#5D5D5D]">
            Set specific permissions for this module.
          </p>
        </div>
      </div>

      {/* Two-Column Equal Grid Layout */}
      {form.formState.errors.root?.permissions && (
        <p className="text-md font-medium text-red-600">
          {String(form.formState.errors.root.permissions.message)}
        </p>
      )}
      <div className="w-full h-[331px] grid grid-cols-2 gap-[10px]">
        {/* Left — Module Sidebar */}
        <div className="h-full bg-[#F7F7F7] rounded-xl py-[10px] px-0 flex flex-col gap-[5px]">
          {MODULE_CONFIG.slice(1, 4).map((mod) => {
            const isSelected = selectedModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModule(mod.id)}
                className={cn(
                  "h-[37px] w-full px-[16px] flex items-center justify-start rounded-lg text-md font-normal leading-[15px] transition-colors whitespace-nowrap",
                  isSelected
                    ? "bg-[#4A706A] text-white"
                    : "bg-transparent text-[#141F1E] hover:bg-black/5"
                )}
              >
                {mod.label}
              </button>
            );
          })}
        </div>

        {/* Right — Action Checkboxes */}
        <div className="h-full bg-[#F7F7F7] rounded-xl px-[15px] flex flex-col items-start py-[10px] overflow-y-auto">
          {/* Header with Select All toggle */}
          <div className="flex items-center justify-between w-full px-[10px] pb-1.5 mb-1 border-b border-[#BCD3CD]/40">
            <span className="text-md font-medium text-[#5D5D5D]">
              Permissions ({currentActions.length}/{ALL_GRANULAR_ACTION_IDS.length})
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1 text-md font-medium text-[#4A706A] hover:underline cursor-pointer"
            >
              <CheckCheck className="size-3" />
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex flex-col w-full gap-0">
            {GRANULAR_ACTIONS.map((act, index) => {
              const isChecked = currentActions.includes(act.id);
              const label = getActionLabel(act.id, selectedModule);

              return (
                <React.Fragment key={act.id}>
                  {/* Action Item Row */}
                  <div
                    onClick={() => toggleAction(selectedModule, act.id)}
                    className="h-[36px] w-full flex items-center gap-[15px] px-[10px] cursor-pointer hover:bg-black/5 rounded-lg transition-colors"
                  >
                    {/* Checkbox Icon Box */}
                    <div
                      className={cn(
                        "size-[18px] rounded-md flex items-center justify-center shrink-0 transition-all",
                        isChecked
                          ? "bg-[#22973F] text-white"
                          : "bg-white border-[1.8px] border-[#5D5D5D]"
                      )}
                    >
                      {isChecked && (
                        <Check className="size-[12px] stroke-[3]" />
                      )}
                    </div>

                    {/* Action Label */}
                    <span className="text-md font-normal leading-[15px] text-[#141F1E]">
                      {label}
                    </span>
                  </div>

                  {/* Partial Divider Line */}
                  {index < GRANULAR_ACTIONS.length - 1 && (
                    <div className="w-[171px] border-b border-[#BCD3CD]/40 border-[0.2px] my-0 ml-[10px] self-start" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

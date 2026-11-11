"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@repo/ui/components/ui";
import { Loader2, Edit3, Save, UserCheck } from "lucide-react";
import { UserFormSection } from "./data/addUserFields";

interface UserPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Record<string, any>;
  formSections: UserFormSection[];
  roles?: any[];
  departments?: any[];
  staffList?: any[];
  onConfirmSubmit: () => void;
  isPending?: boolean;
  isEditing?: boolean;
}

export function UserPreviewModal({
  open,
  onOpenChange,
  formData = {},
  formSections = [],
  roles = [],
  departments = [],
  staffList = [],
  onConfirmSubmit,
  isPending,
  isEditing,
}: UserPreviewModalProps) {
  const activeSections = formSections.filter(
    (sec) => sec.sectionFields && sec.sectionFields.length > 0
  );

  const getFieldValue = (fieldName: string, rawVal: any) => {
    if (rawVal === undefined || rawVal === null || rawVal === "") {
      return "N/A";
    }

    if (fieldName === "roleId" && roles.length > 0) {
      const foundRole = roles.find((r) => r.id === rawVal);
      if (foundRole) return foundRole.name;
    }

    if (fieldName === "department" && departments.length > 0) {
      const foundDept = departments.find(
        (d) => d.id === rawVal || d.name === rawVal
      );
      if (foundDept) return foundDept.name;
    }

    if (fieldName === "managerId" && staffList.length > 0) {
      const foundStaff = staffList.find((s) => s.id === rawVal);
      if (foundStaff) return foundStaff.fullName;
    }

    return String(rawVal);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="3xl">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#F0F7F5] text-[#4A706A] flex items-center justify-center border border-[#D5E6E1]">
              <UserCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isEditing ? "Preview User Update" : "Preview & Confirm User Details"}
              </DialogTitle>
              <p className="text-md text-slate-500">
                Take a moment to review the information before submitting.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {activeSections.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl bg-slate-50/80 border border-slate-200 p-5 space-y-3"
            >
              <h4 className="text-md font-bold text-[#4A706A]  tracking-wider">
                {section.sectionTitle}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
                {section.sectionFields.map((field) => {
                  if (field.type === "password") return null;
                  const rawVal = formData[field.name];
                  const displayVal = getFieldValue(field.name, rawVal);

                  return (
                    <div key={field.id} className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500">
                        {field.label}
                      </p>
                      <p className="text-md font-medium text-slate-900 break-words bg-white px-3 py-2 rounded-xl border border-slate-200/70 shadow-2xs">
                        {displayVal}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="bg-[#EDF5F3] hover:bg-[#E1EFEA] text-[#3D5C57] font-semibold rounded-2xl h-11 px-5 text-md border border-[#D0E4DF]"
          >
            <Edit3 className="size-3.5 mr-1.5" /> Edit Details
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={onConfirmSubmit}
            className="bg-[#4A706A] hover:bg-[#3D5C57] text-white font-semibold rounded-2xl h-11 px-6 text-md flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {isEditing ? "Confirm Update" : "Confirm & Invite User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

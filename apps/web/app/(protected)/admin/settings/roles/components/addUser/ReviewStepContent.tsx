import React from "react";
import { Edit3 } from "lucide-react";
import type { AddUserDTO } from "@repo/schema";
import { Card, InfoField } from "@repo/ui/components/ui";
import type { StaffMember } from "../../../../../../../lib/types/staff";

interface ReviewStepContentProps {
  formData: Partial<AddUserDTO>;
  roles?: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string }>;
  staffList?: StaffMember[];
  onGoToStep: (stepIndex: number) => void;
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export function ReviewStepContent({
  formData,
  roles = [],
  departments = [],
  staffList = [],
  onGoToStep,
  sectionTitle,
  sectionSubtitle,
}: ReviewStepContentProps) {
  const fullName =
    `${formData.firstName || ""} ${formData.lastName || ""}`.trim() ||
    formData.fullName ||
    "N/A";
  const roleName =
    roles.find((r) => r.id === formData.roleId)?.name ||
    formData.roleId ||
    "N/A";
  const deptName =
    departments.find((d) => d.id === formData.department || d.name === formData.department)?.name ||
    formData.department ||
    "N/A";
  const managerName =
    staffList.find((s) => s.id === formData.managerId)?.fullName ||
    formData.managerId ||
    "N/A";

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base font-bold text-text-heading">
          {sectionTitle || "Review & Invite"}
        </h3>
        <p className="text-md text-text-description">
          {sectionSubtitle || "Review the details before inviting the user to the platform"}
        </p>
      </div>

      {/* Card 1: Personal Information */}
      <Card variant="surface" className="p-4 sm:p-5 space-y-3 gap-0 border border-border-secondary/40">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-bold text-text-primary  tracking-wider">
            Personal Information
          </h4>
          <button
            type="button"
            onClick={() => onGoToStep(0)}
            className="text-md font-semibold text-text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="size-3.5" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border-secondary/30">
          <InfoField label="Full Name" value={fullName} />
          <InfoField label="Email Address" value={formData.email || "N/A"} />
          <InfoField label="Phone Number" value={formData.phone || "N/A"} />
          <InfoField label="Department" value={deptName} />
          <InfoField label="Username" value={formData.username || "N/A"} />
        </div>
      </Card>

      {/* Card 2: Role & Access */}
      <Card variant="surface" className="p-4 sm:p-5 space-y-3 gap-0 border border-border-secondary/40">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-bold text-text-primary  tracking-wider">
            Role & Access
          </h4>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-md font-semibold text-text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="size-3.5" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border-secondary/30">
          <InfoField label="Assigned Role" value={roleName} />
        </div>
      </Card>

      {/* Card 3: Additional Information */}
      <Card variant="surface" className="p-4 sm:p-5 space-y-3 gap-0 border border-border-secondary/40">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-bold text-text-primary  tracking-wider">
            Additional Information
          </h4>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="text-md font-semibold text-text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="size-3.5" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border-secondary/30">
          <InfoField label="Job Title" value={formData.jobTitle || "N/A"} />
          <InfoField label="Employee ID" value={formData.employeeId || "N/A"} />
          <InfoField label="Work Location" value={formData.location || "N/A"} />
          <InfoField label="Time Zone" value={formData.timeZone || "N/A"} />
          <InfoField label="Manager" value={managerName} />
          <InfoField label="Notes" value={formData.notes || "N/A"} className="sm:col-span-3" />
        </div>
      </Card>
    </div>
  );
}

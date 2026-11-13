"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGetStaffMemberQuery } from "../../../../../../../lib/queries/staff/useGetStaffMemberQuery";
import { PenSquare } from "lucide-react";
import { format } from "date-fns";

import { RtwVerificationForm } from "../forms/RtwVerificationForm";
import { RtwDetailsModal } from "../forms/RtwDetailsModal";
import { StaffEditForm } from "../forms/StaffEditForm";

import { RtwRecord, useGetStaffComplianceQuery } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { Button, Card, InfoField, Text } from "@repo/ui/components/ui";
import { calculateAge } from "@repo/schema";

export function PersonalDetailsTab() {
  const { id: staffId } = useParams<{ id: string }>();
  const { data: staff, isLoading } = useGetStaffMemberQuery(staffId);
  const [rtwFormOpen, setRtwFormOpen] = useState(false);
  const [rtwDetailsOpen, setRtwDetailsOpen] = useState(false);
  const [staffEditOpen, setStaffEditOpen] = useState(false);
  const [staffEditMode, setStaffEditMode] = useState<
    "contact" | "employment" | "all"
  >("all");

  const { data: complianceData, isLoading: complianceLoading } =
    useGetStaffComplianceQuery(staffId);
  const rtwData = complianceData?.rtw;

  if (isLoading || !staff) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const rtw: RtwRecord | null | undefined = rtwData ?? (staff.rightToWork
    ? ({
      id: "",
      userId: staff.id,
      verificationType: "Manual",
      documentType: staff.rightToWork.documentType,
      rtwStatus:
        staff.rightToWork.status === "Valid"
          ? "Verified"
          : staff.rightToWork.status,
      expiryDate: staff.rightToWork.expiryDate,
    } as RtwRecord)
    : null);

  const age = calculateAge(staff.dob);

  return (
    <div className="space-y-6">
      <div className="flex gap-6">


        {/* RIGHT — Info Sections */}
        <Card className="w-full h-full flex flex-col gap-[30px] sm:gap-[36px]">

          {/* 1. EMPLOYMENT DETAILS SECTION */}
          <div className="w-full flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h3 className="text-h7 font-medium">
                Employment Details
              </h3>
              {/* Edit Button Badge */}
              <Button
                variant="ghost"
                size="icon"
                className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
                title="Edit employment details"
                onClick={() => {
                  setStaffEditMode("employment");
                  setStaffEditOpen(true);
                }}
              >
                <PenSquare className="w-4 h-4 text-[#141F1E]" />
              </Button>
            </div>

            <div className="flex flex-col gap-[20px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoField
                  label="Employee ID"
                  value={
                    staff.id
                      ? `EMP-${staff.id.substring(0, 5).toUpperCase()}`
                      : "Not assigned"
                  }
                />
                <InfoField
                  label="Role"
                  value={staff.role?.name || "Not assigned"}
                />
                <InfoField
                  label="Department"
                  value={staff.department || "Not assigned"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoField
                  label="Start Date"
                  value={
                    staff.startDate
                      ? format(new Date(staff.startDate), "dd MMMM yyyy")
                      : "Not set"
                  }
                />
                <InfoField
                  label="Assigned Unit / Wing"
                  value={
                    staff.assignedWings?.[0]
                      ? `${staff.assignedWings[0].name}${staff.assignedWings[0].unit
                        ? ` (${staff.assignedWings[0].unit.name})`
                        : ""
                      }`
                      : "Unassigned"
                  }
                />
                <InfoField
                  label="Key Worker For"
                  value={
                    staff?.keyWorkerCount !== undefined
                      ? `${staff.keyWorkerCount} Residents`
                      : "0 Residents"
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoField
                  label="NI Number"
                  value={staff.niNumber || "Not provided"}
                />
                <InfoField
                  label="DBS Number"
                  value={staff.dbsNumber || "Not provided"}
                />
                <InfoField
                  label="DBS Expiry Date"
                  value={
                    staff.dbsExpiryDate
                      ? format(new Date(staff.dbsExpiryDate), "dd MMMM yyyy")
                      : "Not set"
                  }
                />
              </div>
            </div>
          </div>

          {/* 2. PERSONAL DETAILS SECTION */}
          <div className="w-full flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h3 className="text-h7 font-medium">
                Personal Details
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
                title="Edit personal details"
                onClick={() => {
                  setStaffEditMode("contact");
                  setStaffEditOpen(true);
                }}
              >
                <PenSquare className="w-4 h-4 text-[#141F1E]" />
              </Button>
            </div>

            {(() => {
              const nameParts = staff.fullName ? staff.fullName.trim().split(/\s+/) : [];
              const firstName = nameParts[0] || "Not set";
              const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Not set";
              const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "None";

              return (
                <div className="flex flex-col gap-[20px]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoField label="First Name" value={firstName} />
                    <InfoField label="Middle Name" value={middleName} />
                    <InfoField label="Last Name" value={lastName} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoField
                      label="Date of Birth"
                      value={
                        staff.dob
                          ? format(new Date(staff.dob), "dd MMMM yyyy")
                          : "Not set"
                      }
                    />
                    <InfoField
                      label="Age"
                      value={age !== null ? `${age} years` : "Not set"}
                    />
                    <InfoField label="Gender" value={staff.gender || "Not specified"} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoField
                      label="Home Address"
                      value={staff.address || "Not provided"}
                      multiline
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 3. NEXT OF KIN / CONTACT PERSON SECTION */}
          <div className="w-full flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h3 className="text-h7 font-medium">
                Next of Kin / Contact Person
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
                title="Edit Next of Kin details"
                onClick={() => {
                  setStaffEditMode("contact");
                  setStaffEditOpen(true);
                }}
              >
                <PenSquare className="w-4 h-4 text-[#141F1E]" />
              </Button>
            </div>

            {staff.emergencyContacts && staff.emergencyContacts.length > 0 ? (
              <div className="flex flex-col gap-[20px]">
                {staff.emergencyContacts.map((kin: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoField
                      label="Next of Kin Name"
                      value={kin.name || "Not provided"}
                    />
                    <InfoField
                      label="Relationship"
                      value={kin.relation || "Not specified"}
                    />
                    <InfoField
                      label="Phone Number"
                      value={kin.phone || "Not provided"}
                    />
                    {kin.email && (
                      <InfoField
                        label="Email Address"
                        value={kin.email}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Text size="md" weight="regular" className="text-[#5D5D5D] italic">
                No Next of Kin / Contact Person recorded.
              </Text>
            )}
          </div>

        </Card>
      </div>

      {/* <RtwVerificationForm
        staffId={staff.id}
        staffName={staff.fullName}
        existing={rtwData}
        open={rtwFormOpen}
        onOpenChange={setRtwFormOpen}
      /> */}

      {/* <RtwDetailsModal
        staffName={staff.fullName}
        data={rtwData}
        open={rtwDetailsOpen}
        onOpenChange={setRtwDetailsOpen}
      /> */}

      <StaffEditForm
        staff={staff}
        open={staffEditOpen}
        onOpenChange={setStaffEditOpen}
        mode={staffEditMode}
      />
    </div >
  );
}
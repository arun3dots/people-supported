"use client";

import React from "react";
import { IdCard, PenSquare } from "lucide-react";
import { Card, Button, Text, InfoField, Badge } from "@repo/ui/components/ui";

interface OverviewPersonalCardProps {
  resident: any;
  data: any;
  isAdmin: boolean;
  onEdit?: () => void;
  formatDOB: (dob?: string) => string;
}

export function OverviewPersonalCard({
  resident,
  data,
  isAdmin,
  onEdit,
  formatDOB,
}: OverviewPersonalCardProps) {
  const profile = resident.profile || {};
  const isInterpreterRequired = Boolean(profile.interpreterRequired ?? resident.interpreterRequired);

  const addressString = [
    data.addressLine1 || profile.addressLine1,
    profile.addressLine2,
    data.city || profile.city,
    profile.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const languages =
    Array.isArray(profile.languagesSpoken) && profile.languagesSpoken.length > 0
      ? profile.languagesSpoken.join(", ")
      : data.preferredLanguage || "English";

  const formatAdmissionDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-4 shadow-none font-sans">
      <div className="flex items-center justify-between border-b border-border-secondary/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-surface-primary-light border border-emerald-100 flex items-center justify-center text-icon-primary shrink-0">
            <IdCard className="size-4" />
          </div>
          <Text
            as="h3"
            size="lg"
            weight="semibold"
            className="text-slate-900"
          >
            Personal Information
          </Text>
        </div>
        {isAdmin && onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl bg-white border border-slate-200 text-icon-primary hover:bg-slate-50 cursor-pointer shrink-0"
            title="Edit Personal Information"
            onClick={onEdit}
          >
            <PenSquare className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField
          label="Address"
          value={addressString || "Not provided"}
          multiline
        />
        <InfoField
          label="Nationality"
          value={data.country || profile.country || "Not provided"}
        />
        <InfoField
          label="Phone"
          value={data.phoneNumber || profile.phoneNumber || "Not provided"}
        />
        <InfoField
          label="Religion"
          value={data.religion || profile.religion || "Not provided"}
        />
        <InfoField
          label="Email"
          value={data.email || resident.email || "Not provided"}
        />
        <InfoField
          label="NHS / National ID"
          value={data.nhsNumber || profile.nationalId || "Not provided"}
        />
        <InfoField label="Date of Birth" value={formatDOB(data.dob)} />
        <InfoField
          label="Admission Date"
          value={formatAdmissionDate(
            resident.admissionDate ||
              data.admissionDate ||
              resident.admission?.admissionDate,
          )}
        />
        <InfoField
          label="Marital Status"
          value={profile.maritalStatus || "Not specified"}
        />
        <InfoField label="Languages Spoken" value={languages} />
        <div className="flex flex-col gap-1">
          <Text size="md" weight="medium" className="text-slate-500">
            Interpreter Required
          </Text>
          <div>
            <Badge
              variant="secondary"
              state={isInterpreterRequired ? "danger" : "inactive"}
              className="px-2.5 py-0.5 shadow-none text-md"
            >
              {isInterpreterRequired ? "Yes (Interpreter Needed)" : "No"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

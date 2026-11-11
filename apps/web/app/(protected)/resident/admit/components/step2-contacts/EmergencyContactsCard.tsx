"use client";

import React from "react";
import {
  Input,
  Label,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { isInvalidResidentName, RESIDENT_NAME_ERROR } from "@repo/schema";
import { AdmissionFormData } from "../../types";
import { RelationshipSelect } from "../common/RelationshipSelect";
import { PhoneInputWithValidation } from "../common/PhoneInputWithValidation";

interface EmergencyContactsCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function EmergencyContactsCard({
  formData,
  updateFormData,
}: EmergencyContactsCardProps) {
  const handlePrimaryNameChange = (part: "first" | "middle" | "last", val: string) => {
    const first = part === "first" ? val : (formData.primaryContact.firstName ?? "");
    const middle = part === "middle" ? val : (formData.primaryContact.middleName ?? "");
    const last = part === "last" ? val : (formData.primaryContact.lastName ?? "");
    const full = [first, middle, last].filter(Boolean).join(" ").trim();
    updateFormData({
      primaryContact: {
        ...formData.primaryContact,
        firstName: first,
        middleName: middle,
        lastName: last,
        name: full,
      },
    });
  };

  const handleSecondaryNameChange = (part: "first" | "middle" | "last", val: string) => {
    const sec = formData.secondaryContact || {};
    const first = part === "first" ? val : (sec.firstName ?? "");
    const middle = part === "middle" ? val : (sec.middleName ?? "");
    const last = part === "last" ? val : (sec.lastName ?? "");
    const full = [first, middle, last].filter(Boolean).join(" ").trim();
    updateFormData({
      secondaryContact: {
        ...sec,
        firstName: first,
        middleName: middle,
        lastName: last,
        name: full,
      },
    });
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold" >
          Emergency Contacts
        </Text>
        <Text size="sm" weight="regular" variant="subdued" >
          Primary and secondary emergency contacts for the resident.
        </Text>
      </div>

      <div className="space-y-6">
        {/* Primary Contact */}
        <div className="space-y-4">
          <Text as="h3" size="sm" weight="medium" className="text-slate-700">
            Primary Emergency Contact <span className="text-red-500">*</span>
          </Text>

          {/* 3 Name Fields for Primary Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.primaryContact.firstName) && "[&_[data-slot=input-error]]:hidden")}>
              <Label required >First Name</Label>
              <Input
                type="text"
                placeholder="e.g. Jane"
                value={formData.primaryContact.firstName || ""}
                onChange={(e) => handlePrimaryNameChange("first", e.target.value)}
                errorMessage={isInvalidResidentName(formData.primaryContact.firstName) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.primaryContact.middleName) && "[&_[data-slot=input-error]]:hidden")}>
              <Label >Middle Name</Label>
              <Input
                type="text"
                placeholder="e.g. Marie"
                value={formData.primaryContact.middleName || ""}
                onChange={(e) => handlePrimaryNameChange("middle", e.target.value)}
                errorMessage={isInvalidResidentName(formData.primaryContact.middleName) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.primaryContact.lastName) && "[&_[data-slot=input-error]]:hidden")}>
              <Label required >Last Name</Label>
              <Input
                type="text"
                placeholder="e.g. Whitmore"
                value={formData.primaryContact.lastName || ""}
                onChange={(e) => handlePrimaryNameChange("last", e.target.value)}
                errorMessage={isInvalidResidentName(formData.primaryContact.lastName) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
          </div>

          {/* Contact Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <RelationshipSelect
                label="Relationship"
                required
                value={formData.primaryContact.relationship}
                onChange={(val) =>
                  updateFormData({
                    primaryContact: { ...formData.primaryContact, relationship: val },
                  })
                }
              />
            </div>
            <div>
              <PhoneInputWithValidation
                label="Phone"
                required
                placeholder="e.g. +44 7700 900077"
                value={formData.primaryContact.phone}
                onChange={(val) =>
                  updateFormData({
                    primaryContact: { ...formData.primaryContact, phone: val },
                  })
                }
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. jane@example.com"
                value={formData.primaryContact.emailAddress || ""}
                onChange={(e) =>
                  updateFormData({
                    primaryContact: { ...formData.primaryContact, emailAddress: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Secondary Contact */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <Text as="h3" size="sm" weight="medium" className="text-slate-700">
            Secondary Emergency Contact (Optional)
          </Text>

          {/* 3 Name Fields for Secondary Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.secondaryContact?.firstName) && "[&_[data-slot=input-error]]:hidden")}>
              <Label >First Name</Label>
              <Input
                type="text"
                placeholder="e.g. Robert"
                value={formData.secondaryContact?.firstName || ""}
                onChange={(e) => handleSecondaryNameChange("first", e.target.value)}
                errorMessage={isInvalidResidentName(formData.secondaryContact?.firstName) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.secondaryContact?.middleName) && "[&_[data-slot=input-error]]:hidden")}>
              <Label >Middle Name</Label>
              <Input
                type="text"
                placeholder="e.g. James"
                value={formData.secondaryContact?.middleName || ""}
                onChange={(e) => handleSecondaryNameChange("middle", e.target.value)}
                errorMessage={isInvalidResidentName(formData.secondaryContact?.middleName) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.secondaryContact?.lastName) && "[&_[data-slot=input-error]]:hidden")}>
              <Label >Last Name</Label>
              <Input
                type="text"
                placeholder="e.g. Whitmore"
                value={formData.secondaryContact?.lastName || ""}
                onChange={(e) => handleSecondaryNameChange("last", e.target.value)}
                errorMessage={isInvalidResidentName(formData.secondaryContact?.lastName) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
          </div>

          {/* Contact Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <RelationshipSelect
                label="Relationship"
                value={formData.secondaryContact?.relationship || ""}
                onChange={(val) =>
                  updateFormData({
                    secondaryContact: { ...formData.secondaryContact, relationship: val },
                  })
                }
              />
            </div>
            <div>
              <PhoneInputWithValidation
                label="Phone"
                placeholder="e.g. +44 7700 900088"
                value={formData.secondaryContact?.phone || ""}
                onChange={(val) =>
                  updateFormData({
                    secondaryContact: { ...formData.secondaryContact, phone: val },
                  })
                }
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. robert@example.com"
                value={formData.secondaryContact?.emailAddress || ""}
                onChange={(e) =>
                  updateFormData({
                    secondaryContact: { ...formData.secondaryContact, emailAddress: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

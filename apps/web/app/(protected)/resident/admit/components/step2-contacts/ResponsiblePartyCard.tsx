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

interface ResponsiblePartyCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function ResponsiblePartyCard({
  formData,
  updateFormData,
}: ResponsiblePartyCardProps) {
  const handleRespPartyNameChange = (part: "first" | "middle" | "last", val: string) => {
    const first = part === "first" ? val : (formData.responsibleParty.firstName ?? "");
    const middle = part === "middle" ? val : (formData.responsibleParty.middleName ?? "");
    const last = part === "last" ? val : (formData.responsibleParty.lastName ?? "");
    const full = [first, middle, last].filter(Boolean).join(" ").trim();
    updateFormData({
      responsibleParty: {
        ...formData.responsibleParty,
        firstName: first,
        middleName: middle,
        lastName: last,
        name: full,
      },
      billingResponsibleParty: {
        ...formData.billingResponsibleParty,
        firstName: first,
        middleName: middle,
        lastName: last,
        name: full,
      },
    });
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 space-y-4 shadow-none border-none font-sans">
      <div className="pb-3 border-b border-slate-200/80">
        <Text as="h3" size="sm" weight="bold" className="text-slate-900  tracking-wider">
          Financially Responsible Party
        </Text>
      </div>

      <div className="space-y-4">
        {/* 3 Name Fields for Financially Responsible Party */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={cn("space-y-1.5", !isInvalidResidentName(formData.responsibleParty.firstName) && "[&_[data-slot=input-error]]:hidden")}>
            <Label required >First Name</Label>
            <Input
              type="text"
              placeholder="e.g. Jane"
              value={formData.responsibleParty.firstName || ""}
              onChange={(e) => handleRespPartyNameChange("first", e.target.value)}
              errorMessage={isInvalidResidentName(formData.responsibleParty.firstName) ? RESIDENT_NAME_ERROR : undefined}
            />
          </div>
          <div className={cn("space-y-1.5", !isInvalidResidentName(formData.responsibleParty.middleName) && "[&_[data-slot=input-error]]:hidden")}>
            <Label >Middle Name</Label>
            <Input
              type="text"
              placeholder="e.g. Marie"
              value={formData.responsibleParty.middleName || ""}
              onChange={(e) => handleRespPartyNameChange("middle", e.target.value)}
              errorMessage={isInvalidResidentName(formData.responsibleParty.middleName) ? RESIDENT_NAME_ERROR : undefined}
            />
          </div>
          <div className={cn("space-y-1.5", !isInvalidResidentName(formData.responsibleParty.lastName) && "[&_[data-slot=input-error]]:hidden")}>
            <Label required >Last Name</Label>
            <Input
              type="text"
              placeholder="e.g. Whitmore"
              value={formData.responsibleParty.lastName || ""}
              onChange={(e) => handleRespPartyNameChange("last", e.target.value)}
              errorMessage={isInvalidResidentName(formData.responsibleParty.lastName) ? RESIDENT_NAME_ERROR : undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <RelationshipSelect
              label="Relationship"
              required
              value={formData.responsibleParty.relationship}
              onChange={(val) => {
                const updated = {
                  responsibleParty: { ...formData.responsibleParty, relationship: val },
                  billingResponsibleParty: { ...formData.billingResponsibleParty, relationship: val },
                };
                updateFormData(updated);
              }}
            />
          </div>
          <div>
            <PhoneInputWithValidation
              label="Phone"
              required
              placeholder="e.g. +44 7700 900077"
              value={formData.responsibleParty.phone}
              onChange={(val) => {
                updateFormData({
                  responsibleParty: { ...formData.responsibleParty, phone: val },
                  billingResponsibleParty: { ...formData.billingResponsibleParty, phone: val },
                });
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label >Billing Address</Label>
          <Input
            type="text"
            placeholder="Full Billing Address"
            value={formData.responsibleParty.address || ""}
            onChange={(e) => {
              const val = e.target.value;
              updateFormData({
                responsibleParty: { ...formData.responsibleParty, address: val },
                billingResponsibleParty: { ...formData.billingResponsibleParty, address: val },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

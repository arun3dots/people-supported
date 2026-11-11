"use client";

import React from "react";
import { Button, Text, toast } from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AdmissionFormData } from "../../types";
import { isValidPhoneNumber, isOptionalPhoneValid } from "../../utils/phoneValidation";
import { EmergencyContactsCard } from "./EmergencyContactsCard";
import { ResponsiblePartyCard } from "./ResponsiblePartyCard";
import { LegalRepCard } from "./LegalRepCard";
import { CareProvidersCard } from "./CareProvidersCard";

interface Step2ContactsProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function Step2Contacts({
  formData,
  updateFormData,
  onPrev,
  onNext,
  isSubmitting,
}: Step2ContactsProps) {
  const handleContinue = () => {
    // Validate Primary Contact Phone
    if (!isValidPhoneNumber(formData.primaryContact.phone)) {
      toast({
        title: "Validation Error",
        description: "Primary contact phone is invalid. Please enter 7–15 digits (e.g. +44 7700 900077).",
        variant: "destructive",
      });
      return;
    }

    // Validate Primary Contact Email
    const primaryEmail = formData.primaryContact.emailAddress?.trim();
    if (!primaryEmail) {
      toast({
        title: "Validation Error",
        description: "Primary emergency contact email address is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate Secondary Contact Phone (if entered)
    if (!isOptionalPhoneValid(formData.secondaryContact?.phone)) {
      toast({
        title: "Validation Error",
        description: "Secondary contact phone is invalid. Please enter a valid phone number or leave blank.",
        variant: "destructive",
      });
      return;
    }

    // Validate Responsible Party Phone
    if (!isValidPhoneNumber(formData.responsibleParty.phone)) {
      toast({
        title: "Validation Error",
        description: "Financially responsible party phone is invalid. Please enter 7–15 digits.",
        variant: "destructive",
      });
      return;
    }

    // Validate GP Phone
    if (!isValidPhoneNumber(formData.generalPractitioner.phone)) {
      toast({
        title: "Validation Error",
        description: "GP surgery phone is invalid. Please enter 7–15 digits (e.g. +44 161 999 1234).",
        variant: "destructive",
      });
      return;
    }

    // Validate Other Providers Phones (if entered)
    for (const provider of formData.otherProviders) {
      if (provider.phone && !isValidPhoneNumber(provider.phone)) {
        toast({
          title: "Validation Error",
          description: `Phone number for provider "${provider.name || provider.type}" is invalid.`,
          variant: "destructive",
        });
        return;
      }
    }

    onNext();
  };

  const isFormValid =
    Boolean(formData.primaryContact.name?.trim()) &&
    Boolean(formData.primaryContact.phone?.trim()) &&
    Boolean(formData.primaryContact.emailAddress?.trim()) &&
    Boolean(formData.responsibleParty.name?.trim()) &&
    Boolean(formData.responsibleParty.phone?.trim()) &&
    Boolean(formData.generalPractitioner.name?.trim()) &&
    Boolean(formData.generalPractitioner.phone?.trim());

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Emergency Contacts */}
      <EmergencyContactsCard formData={formData} updateFormData={updateFormData} />

      {/* 2. Responsible Party & Legal Representative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResponsiblePartyCard formData={formData} updateFormData={updateFormData} />
        <LegalRepCard formData={formData} updateFormData={updateFormData} />
      </div>

      {/* 3. Care Providers */}
      <CareProvidersCard formData={formData} updateFormData={updateFormData} />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onPrev}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          disabled={!isFormValid || isSubmitting}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

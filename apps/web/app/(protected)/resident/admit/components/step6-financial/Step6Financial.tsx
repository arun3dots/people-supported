"use client";

import {
  Input,
  Label,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  toast,
} from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { PAYMENT_METHODS } from "../../data/admissionFormFields";
import { AdmissionFormData } from "../../types";
import { DocumentUploadField } from "../common/DocumentUploadField";
import { RelationshipSelect } from "../common/RelationshipSelect";
import { PhoneInputWithValidation } from "../common/PhoneInputWithValidation";
import { isOptionalPhoneValid } from "../../utils/phoneValidation";

interface Step6FinancialProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function Step6Financial({
  formData,
  updateFormData,
  onPrev,
  onNext,
  isSubmitting,
}: Step6FinancialProps) {
  const handleContinue = () => {
    const phoneToValidate = formData.billingResponsibleParty.phone || formData.responsibleParty.phone;
    if (phoneToValidate && !isOptionalPhoneValid(phoneToValidate)) {
      toast({
        title: "Validation Error",
        description: "Billing responsible contact phone is invalid. Please enter 7–15 digits or leave blank.",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Payment Method & Coverage */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Primary Payment Method &amp; Coverage
          </Text>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Primary Payment Method</Label>
              <Select
                value={formData.primaryPaymentMethod}
                onValueChange={(val) => updateFormData({ primaryPaymentMethod: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Secondary / Supplemental Coverage</Label>
              <Input
                type="text"
                placeholder="Supplemental policy if applicable"
                value={formData.secondaryCoverage || ""}
                onChange={(e) => updateFormData({ secondaryCoverage: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Insurance Provider</Label>
              <Input
                type="text"
                placeholder="Insurance Company"
                value={formData.insuranceProvider || ""}
                onChange={(e) => updateFormData({ insuranceProvider: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Policy / Group Number</Label>
              <Input
                type="text"
                placeholder="Policy # (e.g. POL-99882)"
                value={formData.insurancePolicyNumber || ""}
                onChange={(e) => updateFormData({ insurancePolicyNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Benefit / Government ID</Label>
              <Input
                type="text"
                placeholder="Benefit or reference ID"
                value={formData.benefitId || ""}
                onChange={(e) => updateFormData({ benefitId: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Billing Responsible Party */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Financially / Billing Responsible Party
          </Text>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Billing Responsible Name</Label>
              <Input
                type="text"
                placeholder="Responsible Person Name"
                value={formData.billingResponsibleParty.name || formData.responsibleParty.name}
                onChange={(e) => {
                  const val = e.target.value;
                  updateFormData({
                    billingResponsibleParty: { ...formData.billingResponsibleParty, name: val },
                    responsibleParty: { ...formData.responsibleParty, name: val },
                  });
                }}
              />
            </div>

            <div>
              <RelationshipSelect
                label="Relationship to Resident"
                required
                value={formData.billingResponsibleParty.relationship || formData.responsibleParty.relationship || "Self"}
                onChange={(val) => {
                  updateFormData({
                    billingResponsibleParty: { ...formData.billingResponsibleParty, relationship: val },
                    responsibleParty: { ...formData.responsibleParty, relationship: val },
                  });
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInputWithValidation
                label="Contact Phone"
                required
                placeholder="e.g. +44 7700 900077"
                value={formData.billingResponsibleParty.phone || formData.responsibleParty.phone || ""}
                onChange={(val) => {
                  updateFormData({
                    billingResponsibleParty: { ...formData.billingResponsibleParty, phone: val },
                    responsibleParty: { ...formData.responsibleParty, phone: val },
                  });
                }}
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Billing Address</Label>
              <Input
                type="text"
                placeholder="Full Billing Address"
                value={formData.billingResponsibleParty.address || formData.responsibleParty.address || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateFormData({
                    billingResponsibleParty: { ...formData.billingResponsibleParty, address: val },
                    responsibleParty: { ...formData.responsibleParty, address: val },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Rates, Deposit & Payment Schedule */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Agreed Rates, Deposit &amp; Payment Schedule
          </Text>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Agreed Room Rate</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={formData.agreedRoomRate || ""}
                  onChange={(e) => updateFormData({ agreedRoomRate: parseFloat(e.target.value) || 0 })}
                />
                <Select
                  value={formData.agreedRoomRatePeriod}
                  onValueChange={(val) => updateFormData({ agreedRoomRatePeriod: val })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Month">/ Month</SelectItem>
                    <SelectItem value="Week">/ Week</SelectItem>
                    <SelectItem value="Day">/ Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Deposit Amount Received</Label>
              <Input
                type="number"
                placeholder="Deposit amount"
                value={formData.depositAmount || ""}
                onChange={(e) => updateFormData({ depositAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Payment Schedule</Label>
              <Select
                value={formData.paymentSchedule}
                onValueChange={(val) => updateFormData({ paymentSchedule: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly in Advance</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Four-Weekly">Four-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/80">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Bank / Direct Debit Details</Label>
              <Input
                type="text"
                placeholder='Account details or "Set up later"'
                value={formData.directDebitDetails || ""}
                onChange={(e) => updateFormData({ directDebitDetails: e.target.value })}
              />
            </div>

            <div>
              <DocumentUploadField
                label="Financial POA Document"
                placeholder="Upload Financial POA document or enter URL"
                value={formData.financialPoaDocUrl || ""}
                onChange={(url) => updateFormData({ financialPoaDocUrl: url })}
                helperText="Upload signed Financial Power of Attorney or Deputyship documentation"
              />
            </div>
          </div>
        </div>
      </div>

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
          disabled={!formData.primaryPaymentMethod || isSubmitting}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

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
  Checkbox,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AdmissionFormData } from "../../types";
import { DocumentUploadButton, DocumentUploadField } from "../common/DocumentUploadField";
import { ADMISSION_UPLOAD_LIMITS } from "../../data/admissionFormFields";

interface Step5LegalProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function Step5Legal({
  formData,
  updateFormData,
  onPrev,
  onNext,
  isSubmitting,
}: Step5LegalProps) {
  const toggleConsentSigned = (index: number) => {
    const updated = [...formData.consentChecklist];
    if (updated[index]) {
      const nextSigned = !updated[index].signed;
      updated[index].signed = nextSigned;
      if (nextSigned && !updated[index].dateSigned) {
        updated[index].dateSigned = new Date().toISOString().split("T")[0];
      }
    }
    updateFormData({ consentChecklist: updated });
  };

  const setConsentDate = (index: number, dateSigned: string) => {
    const updated = [...formData.consentChecklist];
    if (updated[index]) {
      updated[index].dateSigned = dateSigned;
    }
    updateFormData({ consentChecklist: updated });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Consent Checklist */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Mandatory Consents &amp; Authorisations
          </Text>
          <Text size="sm" weight="regular" variant="subdued">
            Verify execution of signed admission agreements and policies. (Supported uploads: {ADMISSION_UPLOAD_LIMITS.DOCUMENT.hint})
          </Text>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200/70 rounded-2xl overflow-hidden bg-white">
          {formData.consentChecklist.map((item, index) => (
            <div key={item.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={item.signed}
                  onCheckedChange={() => toggleConsentSigned(index)}
                />
                <div>
                  <Text as="h4" size="sm" weight="bold">
                    {item.name} {item.required && <span className="text-red-500">*</span>}
                  </Text>
                  <Text size="sm" variant="subdued" className="mt-0.5">
                    {item.signed ? "Signed & executed on file" : "Pending signature"}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center [&_[data-slot=input-error]]:hidden">
                <div className="w-36">
                  <DatePicker
                    value={item.dateSigned || ""}
                    maxDate={new Date()}
                    onChange={(date) =>
                      setConsentDate(index, date ? format(date, "yyyy-MM-dd") : "")
                    }
                  />
                </div>
                <DocumentUploadButton
                  value={item.documentUrl}
                  onChange={(url) => {
                    const updated = [...formData.consentChecklist];
                    if (updated[index]) {
                      updated[index].documentUrl = url;
                      if (url) {
                        updated[index].signed = true;
                        if (!updated[index].dateSigned) {
                          updated[index].dateSigned = new Date().toISOString().split("T")[0];
                        }
                      }
                    }
                    updateFormData({ consentChecklist: updated });
                  }}
                  buttonText="Upload Form"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Advance Directives & DNAR Status */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Advance Directives &amp; Resuscitation (DNAR)
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Living Will on File?</Label>
            <Select
              value={formData.advanceDirectives.livingWillOnFile}
              onValueChange={(val) =>
                updateFormData({
                  advanceDirectives: { ...formData.advanceDirectives, livingWillOnFile: val },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes — Document on File</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="N/A">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>Resuscitation Status (DNAR)</Label>
            <Select
              value={formData.advanceDirectives.dnarStatus}
              onValueChange={(val) =>
                updateFormData({
                  advanceDirectives: { ...formData.advanceDirectives, dnarStatus: val },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full code">Full Code (Resuscitate)</SelectItem>
                <SelectItem value="DNR">DNR / DNAR</SelectItem>
                <SelectItem value="Not yet discussed">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Healthcare Proxy Named</Label>
            <Input
              type="text"
              placeholder="Proxy Full Name & Relation"
              value={formData.advanceDirectives.healthcareProxyNamed || ""}
              onChange={(e) =>
                updateFormData({
                  advanceDirectives: { ...formData.advanceDirectives, healthcareProxyNamed: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* 3. Legal & Guardianship Documents */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Legal &amp; Guardianship Document References
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-1">
            <DocumentUploadField
              label="Power of Attorney Document"
              placeholder="Upload POA document or enter URL"
              value={formData.poaDocumentUrl || ""}
              onChange={(url) => updateFormData({ poaDocumentUrl: url })}
              helperText="Upload official Power of Attorney document"
            />
          </div>

          <div className="col-span-1">
            <DocumentUploadField
              label="Guardianship Court Order"
              placeholder="Upload court order or enter URL"
              value={formData.guardianshipOrderUrl || ""}
              onChange={(url) => updateFormData({ guardianshipOrderUrl: url })}
              helperText="Upload official court-ordered Guardianship or Deputyship documentation"
            />
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Insurance Assignment of Benefits</Label>
            <Select
              value={formData.insuranceAssignmentStatus}
              onValueChange={(val) => updateFormData({ insuranceAssignmentStatus: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Signed">Signed & Executed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="N/A">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
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
          onClick={onNext}
          disabled={isSubmitting}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

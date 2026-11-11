"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { LEGAL_REP_TYPES } from "../../data/admissionFormFields";
import { AdmissionFormData } from "../../types";
import { DocumentUploadField } from "../common/DocumentUploadField";

interface LegalRepCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function LegalRepCard({
  formData,
  updateFormData,
}: LegalRepCardProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 space-y-4 shadow-none border-none font-sans">
      <div className="pb-3 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold" className="text-slate-900  tracking-wider">
          Legal Representative &amp; POA
        </Text>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label >Legal Representative Type</Label>
          <Select
            value={formData.legalRep.type === "None" ? "" : (formData.legalRep.type || "")}
            onValueChange={(val) =>
              updateFormData({ legalRep: { ...formData.legalRep, type: val } })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_REP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label >Representative Name &amp; Contact</Label>
          <Input
            type="text"
            placeholder="Name, Phone / Law firm"
            value={formData.legalRep.nameContact || ""}
            onChange={(e) =>
              updateFormData({
                legalRep: { ...formData.legalRep, nameContact: e.target.value },
              })
            }
          />
        </div>

        <DocumentUploadField
          label="POA / Representation Document"
          placeholder="Upload POA document or enter reference URL"
          value={formData.legalRep.supportingDocumentUrl || ""}
          onChange={(url) =>
            updateFormData({
              legalRep: { ...formData.legalRep, supportingDocumentUrl: url },
            })
          }
          helperText="Upload official Power of Attorney, Guardianship or Deputyship order"
        />
      </div>
    </div>
  );
}

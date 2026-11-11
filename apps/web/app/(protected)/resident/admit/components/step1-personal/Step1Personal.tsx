"use client";

import {
  Input, Label, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Button, Text, DatePicker,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { isInvalidResidentName, RESIDENT_NAME_ERROR, isValidNhsNumber } from "@repo/schema";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { AdmissionFormData } from "../../types";
import { PhotoUploadCard } from "./PhotoUploadCard";

interface Step1PersonalProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onNext: () => void;
  isSubmitting?: boolean;
  draftResidentId?: string | null;
}

export function Step1Personal({
  formData,
  updateFormData,
  onNext,
  isSubmitting,
  draftResidentId,
}: Step1PersonalProps) {
  const handleNameChange = (part: "first" | "middle" | "last", val: string) => {
    const first = part === "first" ? val : formData.firstName;
    const middle = part === "middle" ? val : formData.middleName || "";
    const last = part === "last" ? val : formData.lastName;
    const full = [first, middle, last].filter(Boolean).join(" ").trim();
    updateFormData({
      ...(part === "first" && { firstName: val }),
      ...(part === "middle" && { middleName: val }),
      ...(part === "last" && { lastName: val }),
      fullName: full,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold" >
            Identity &amp; Demographics
          </Text>
          <Text size="md" weight="regular" variant="subdued" >
            Required legal identifiers, photo profile, and personal demographics.
          </Text>
        </div>

        <div className="space-y-5">
          {/* Photo & Core Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <PhotoUploadCard
              photoUrl={formData.photoUrl}
              draftResidentId={draftResidentId}
              onPhotoChange={(photoUrl) => updateFormData({ photoUrl })}
            />

            <div className="md:col-span-9 space-y-4">
              {/* 3 Name Fields: First, Middle, Last */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={cn("space-y-1.5", !isInvalidResidentName(formData.firstName) && "[&_[data-slot=input-error]]:hidden")}>
                  <Label required >First Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Alice"
                    value={formData.firstName}
                    onChange={(e) => handleNameChange("first", e.target.value)}
                    errorMessage={isInvalidResidentName(formData.firstName) ? RESIDENT_NAME_ERROR : undefined}
                  />
                </div>

                <div className={cn("space-y-1.5", !isInvalidResidentName(formData.middleName) && "[&_[data-slot=input-error]]:hidden")}>
                  <Label >Middle Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Marie"
                    value={formData.middleName || ""}
                    onChange={(e) => handleNameChange("middle", e.target.value)}
                    errorMessage={isInvalidResidentName(formData.middleName) ? RESIDENT_NAME_ERROR : undefined}
                  />
                </div>

                <div className={cn("space-y-1.5", !isInvalidResidentName(formData.lastName) && "[&_[data-slot=input-error]]:hidden")}>
                  <Label required >Last Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Whitmore"
                    value={formData.lastName}
                    onChange={(e) => handleNameChange("last", e.target.value)}
                    errorMessage={isInvalidResidentName(formData.lastName) ? RESIDENT_NAME_ERROR : undefined}
                  />
                </div>
              </div>

              {/* Preferred Name, DOB, Gender & Marital Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={cn("space-y-1.5", !isInvalidResidentName(formData.preferredName) && "[&_[data-slot=input-error]]:hidden")}>
                  <Label >Preferred Name / Nickname</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Ali"
                    value={formData.preferredName || ""}
                    onChange={(e) => updateFormData({ preferredName: e.target.value })}
                    errorMessage={isInvalidResidentName(formData.preferredName) ? RESIDENT_NAME_ERROR : undefined}
                  />
                </div>

                <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
                  <Label required >Date of Birth</Label>
                  <DatePicker
                    variant="dob"
                    value={formData.dob}
                    onChange={(date) =>
                      updateFormData({
                        dob: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
                    <Label required >Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => updateFormData({ gender: val })}
                    >
                      <SelectTrigger >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
                    <Label >Marital</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(val) => updateFormData({ maritalStatus: val })}
                    >
                      <SelectTrigger >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NHS Number & National ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/80">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>NHS Number</Label>
              <Input
                type="text"
                placeholder="10-digit NHS Number (e.g. 943 476 5919)"
                value={formData.nhsNumber ?? formData.nationalId ?? ""}
                onChange={(e) =>
                  updateFormData({
                    nhsNumber: e.target.value,
                    nationalId: e.target.value,
                  })
                }
              />
              {Boolean(formData.nhsNumber && !isValidNhsNumber(formData.nhsNumber)) && (
                <p className="text-md text-rose-500 font-medium mt-1">
                  Invalid NHS number (fails Modulus 11 check).
                </p>
              )}
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Other National ID / Passport</Label>
              <Input
                type="text"
                placeholder="Optional National Insurance or Passport Number"
                value={formData.nationalIdType && formData.nationalIdType !== "Passport / National ID" ? formData.nationalIdType : ""}
                onChange={(e) => updateFormData({ nationalIdType: e.target.value })}
              />
            </div>
          </div>

          {/* Religion & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/80">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Religion / Spiritual Preference</Label>
              <Input
                type="text"
                placeholder="e.g. Christian, Hindu, None"
                value={formData.religion || ""}
                onChange={(e) => updateFormData({ religion: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Languages Spoken</Label>
              <Input
                type="text"
                placeholder="e.g. English, Spanish"
                value={formData.languagesSpoken.join(", ")}
                onChange={(e) => {
                  const val = e.target.value;
                  updateFormData({
                    languagesSpoken: val.trim() === "" ? [] : val.split(",").map((s) => s.trim()).filter(Boolean),
                  });
                }}
              />
            </div>
          </div>

          {/* Background & Life History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/80">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label >Former Occupation</Label>
              <Input
                type="text"
                placeholder="e.g. School Teacher, Engineer"
                value={formData.formerOccupation || ""}
                onChange={(e) => updateFormData({ formerOccupation: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label >Hobbies &amp; Interests</Label>
              <Input
                type="text"
                placeholder="e.g. Gardening, Classical Music, Chess"
                value={formData.hobbies || ""}
                onChange={(e) => updateFormData({ hobbies: e.target.value })}
              />
            </div>
          </div>

          {/* Previous Residential Address */}
          <div className="space-y-1.5 pt-4 border-t border-slate-200/80 [&_[data-slot=input-error]]:hidden">
            <Label >Previous Residential Address</Label>
            <Input
              type="text"
              placeholder="Full previous home address..."
              value={formData.previousAddress || ""}
              onChange={(e) => updateFormData({ previousAddress: e.target.value })}
            />
          </div>

          {/* Admission Specifics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required >Admission Date</Label>
              <DatePicker
                value={formData.admissionDate}
                minDate={new Date()}
                onChange={(date) =>
                  updateFormData({
                    admissionDate: date ? format(date, "yyyy-MM-dd") : "",
                  })
                }
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label >Admission Type</Label>
              <Select
                value={formData.admissionType}
                onValueChange={(val) => updateFormData({ admissionType: val })}
              >
                <SelectTrigger >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Respite">Respite</SelectItem>
                  <SelectItem value="Short-term">Short-term / Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label >Admitted From</Label>
              <Select
                value={formData.admittedFrom}
                onValueChange={(val) => updateFormData({ admittedFrom: val })}
              >
                <SelectTrigger >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Hospital">Hospital</SelectItem>
                  <SelectItem value="Other facility">Other facility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label >Referring Facility</Label>
              <Input
                type="text"
                placeholder="e.g. St. Jude Hospital"
                value={formData.referringFacilityName || ""}
                onChange={(e) => updateFormData({ referringFacilityName: e.target.value })}

              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-end pt-4">
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={
            !formData.firstName ||
            !formData.lastName ||
            !formData.dob ||
            new Date(formData.dob).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) ||
            isSubmitting
          }
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Input,
  Label,
  Text,
} from "@repo/ui/components/ui";
import { RelationshipSelect } from "../../../../resident/admit/components/common/RelationshipSelect";
import { PhoneInputWithValidation } from "../../../../resident/admit/components/common/PhoneInputWithValidation";
import type { OverviewFormData } from "./ResidentOverviewSchemas";

interface EditNokSectionProps {
  formState: OverviewFormData;
  setFormState: React.Dispatch<React.SetStateAction<OverviewFormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function EditNokSection({
  formState,
  setFormState,
  errors,
  setErrors,
}: EditNokSectionProps): React.JSX.Element {
  return (
    <div className="space-y-4 text-md font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label required>First Name</Label>
          <Input
            value={formState.nokFirstName}
            onChange={(e) => {
              const val = e.target.value;
              const full = [val, formState.nokMiddleName, formState.nokLastName].filter(Boolean).join(" ").trim();
              setFormState((prev) => ({ ...prev, nokFirstName: val, nokName: full }));
              if (errors.nokFirstName) setErrors((prev) => ({ ...prev, nokFirstName: "" }));
            }}
            placeholder="e.g. Jane"
            errorMessage={errors.nokFirstName}
          />
        </div>
        <div className="space-y-1">
          <Label>Middle Name</Label>
          <Input
            value={formState.nokMiddleName}
            onChange={(e) => {
              const val = e.target.value;
              const full = [formState.nokFirstName, val, formState.nokLastName].filter(Boolean).join(" ").trim();
              setFormState((prev) => ({ ...prev, nokMiddleName: val, nokName: full }));
              if (errors.nokMiddleName) setErrors((prev) => ({ ...prev, nokMiddleName: "" }));
            }}
            placeholder="e.g. Marie"
            errorMessage={errors.nokMiddleName}
          />
        </div>
        <div className="space-y-1">
          <Label required>Last Name</Label>
          <Input
            value={formState.nokLastName}
            onChange={(e) => {
              const val = e.target.value;
              const full = [formState.nokFirstName, formState.nokMiddleName, val].filter(Boolean).join(" ").trim();
              setFormState((prev) => ({ ...prev, nokLastName: val, nokName: full }));
              if (errors.nokLastName) setErrors((prev) => ({ ...prev, nokLastName: "" }));
            }}
            placeholder="e.g. Whitmore"
            errorMessage={errors.nokLastName}
          />
        </div>
      </div>
      <div className="space-y-1">
        <PhoneInputWithValidation
          label="Phone Number"
          value={formState.nokPhone}
          onChange={(val: string) => {
            setFormState((prev) => ({ ...prev, nokPhone: val }));
            if (errors.nokPhone) setErrors((prev) => ({ ...prev, nokPhone: "" }));
          }}
          placeholder="e.g. +44 7700 900077"
          error={errors.nokPhone}
        />
      </div>
      <div className="space-y-1">
        <RelationshipSelect
          label="Relationship"
          value={formState.nokRelation}
          onChange={(val: string) => {
            setFormState((prev) => ({ ...prev, nokRelation: val }));
            if (errors.nokRelation) setErrors((prev) => ({ ...prev, nokRelation: "" }));
          }}
          error={errors.nokRelation}
        />
      </div>
      <div className="border-t border-slate-200 pt-4">
        <Text size="sm" weight="bold" className="text-slate-700 mb-3">
          Secondary Contact
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>First Name</Label>
            <Input
              value={formState.secondaryNokFirstName}
              onChange={(e) => {
                const val = e.target.value;
                const full = [val, formState.secondaryNokMiddleName, formState.secondaryNokLastName].filter(Boolean).join(" ").trim();
                setFormState((prev) => ({ ...prev, secondaryNokFirstName: val, secondaryNokName: full }));
                if (errors.secondaryNokFirstName) setErrors((prev) => ({ ...prev, secondaryNokFirstName: "" }));
              }}
              placeholder="e.g. John"
              errorMessage={errors.secondaryNokFirstName}
            />
          </div>
          <div className="space-y-1">
            <Label>Middle Name</Label>
            <Input
              value={formState.secondaryNokMiddleName}
              onChange={(e) => {
                const val = e.target.value;
                const full = [formState.secondaryNokFirstName, val, formState.secondaryNokLastName].filter(Boolean).join(" ").trim();
                setFormState((prev) => ({ ...prev, secondaryNokMiddleName: val, secondaryNokName: full }));
                if (errors.secondaryNokMiddleName) setErrors((prev) => ({ ...prev, secondaryNokMiddleName: "" }));
              }}
              placeholder="e.g. David"
              errorMessage={errors.secondaryNokMiddleName}
            />
          </div>
          <div className="space-y-1">
            <Label>Last Name</Label>
            <Input
              value={formState.secondaryNokLastName}
              onChange={(e) => {
                const val = e.target.value;
                const full = [formState.secondaryNokFirstName, formState.secondaryNokMiddleName, val].filter(Boolean).join(" ").trim();
                setFormState((prev) => ({ ...prev, secondaryNokLastName: val, secondaryNokName: full }));
                if (errors.secondaryNokLastName) setErrors((prev) => ({ ...prev, secondaryNokLastName: "" }));
              }}
              placeholder="e.g. Smith"
              errorMessage={errors.secondaryNokLastName}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <PhoneInputWithValidation
            label="Phone Number"
            value={formState.secondaryNokPhone}
            onChange={(val: string) => {
              setFormState((prev) => ({ ...prev, secondaryNokPhone: val }));
              if (errors.secondaryNokPhone) setErrors((prev) => ({ ...prev, secondaryNokPhone: "" }));
            }}
            placeholder="e.g. +44 7700 900077"
            error={errors.secondaryNokPhone}
          />
          <div className="space-y-1">
            <RelationshipSelect
              label="Relationship"
              value={formState.secondaryNokRelation}
              onChange={(val: string) => setFormState((prev) => ({ ...prev, secondaryNokRelation: val }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


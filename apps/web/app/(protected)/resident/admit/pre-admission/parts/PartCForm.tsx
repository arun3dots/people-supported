"use client";

import type { PreAdmissionPartCDTO } from "@repo/schema";
import type { PartFormProps } from "../shared/types";
import { PartCAllergiesSection } from "./PartCAllergiesSection";
import { PartCHealthSection } from "./PartCHealthSection";
import { PartCMedicinesSection } from "./PartCMedicinesSection";

export function PartCForm({
  value,
  onChange,
  errors,
  residentId,
}: PartFormProps<PreAdmissionPartCDTO> & { residentId?: string | null }) {
  return (
    <div className="space-y-6 font-sans">
      <PartCHealthSection
        value={value}
        onChange={onChange}
        errors={errors}
      />

      <PartCAllergiesSection
        allergies={value.allergies}
        noKnownAllergies={value.noKnownAllergies}
        onChange={onChange}
        errorMessage={errors?.allergies}
      />

      <PartCMedicinesSection
        medicines={value.medicines}
        onChange={(medicines) => onChange({ medicines })}
        residentId={residentId}
      />
    </div>
  );
}

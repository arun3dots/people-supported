"use client";

import type { PreAdmissionPartBDTO } from "@repo/schema";
import type { PartFormProps } from "../shared/types";
import { PartBContactSection } from "./PartBContactSection";
import { PartBLegalAuthoritySection } from "./PartBLegalAuthoritySection";
import { PartBLpaSection } from "./PartBLpaSection";
import { PartBProfessionalsSection } from "./PartBProfessionalsSection";

export function PartBForm({
  value,
  onChange,
  errors,
}: PartFormProps<PreAdmissionPartBDTO>) {
  return (
    <div className="space-y-6 font-sans">
      <PartBContactSection
        items={value.nextOfKin}
        onChange={(nextOfKin) => onChange({ nextOfKin })}
        errorMessage={errors?.nextOfKin}
      />

      <PartBLpaSection
        items={value.lpa}
        onChange={(lpa) => onChange({ lpa })}
      />

      <PartBLegalAuthoritySection
        items={value.otherLegalAuthority}
        onChange={(otherLegalAuthority) => onChange({ otherLegalAuthority })}
      />

      <PartBProfessionalsSection
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

import admissionDropdownsData from "../data/admissionDropdowns.json";

export interface DropdownOption {
  value: string;
  label: string;
}

export type AdmissionDropdownKey = keyof typeof admissionDropdownsData;

export const ADMISSION_DROPDOWNS = admissionDropdownsData as Record<AdmissionDropdownKey, DropdownOption[]>;

/** Utility to retrieve label for a given value/code from a dropdown dataset key */
export function getDropdownLabel(key: AdmissionDropdownKey, value: string): string {
  const options = ADMISSION_DROPDOWNS[key];
  if (!options) return value;
  const match = options.find((opt) => opt.value === value);
  return match ? match.label : value;
}

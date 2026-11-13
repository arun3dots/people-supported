import type { PropertyItem } from "../../../../../../../../lib/types/facility";

/** Returns the linked scheme label without misleading hardcoded fallbacks. */
export function getPropertySchemeLabel(property: PropertyItem): string {
  return property.scheme?.name || "Unassigned / Standalone";
}

/** Returns the housing partner / landlord label, or "—" when unspecified. */
export function getPropertyPartnerLabel(property: PropertyItem): string {
  return (
    property.parsedPropertyDetails?.landlordDetails?.name ||
    property.scheme?.housingPartner ||
    "—"
  );
}

/** Returns the property manager label, or "Unassigned". */
export function getPropertyManagerLabel(property: PropertyItem): string {
  return (
    property.parsedPropertyDetails?.propertyManagerName ||
    property.primaryContact ||
    "Unassigned"
  );
}


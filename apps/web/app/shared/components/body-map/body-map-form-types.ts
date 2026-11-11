import {
  type BodyMapFindingTypeValue,
  type BodyMapSeverityValue,
} from "@repo/schema";

export type PrimaryFindingType =
  | "Pressure ulcer"
  | "Skin tear"
  | "Bruise"
  | "Laceration"
  | "Rash"
  | "Moisture lesion";

export const PRIMARY_FINDING_TYPES: PrimaryFindingType[] = [
  "Bruise",
  "Skin tear",
  "Laceration",
  "Rash",
  "Moisture lesion",
  "Pressure ulcer",
];

export interface TypeConfig {
  subCategories?: string[];
  subCategoryLabel: string;
  hasExudate: boolean;
  sizeLabel: string;
  sizePlaceholder: string;
  secondaryFieldLabel: string;
  secondaryFieldPlaceholder: string;
  symptomLabel?: string;
  symptomOptions?: string[];
  defaultSubCategory?: string;
}

export const FINDING_TYPE_CONFIGS: Record<PrimaryFindingType, TypeConfig> = {
  "Pressure ulcer": {
    subCategoryLabel: "Pressure Ulcer Category *",
    subCategories: [
      "Pressure ulcer — category 1",
      "Pressure ulcer — category 2",
      "Pressure ulcer — category 3",
      "Pressure ulcer — category 4",
      "Unstageable / deep tissue injury",
    ],
    defaultSubCategory: "Unstageable / deep tissue injury",
    hasExudate: true,
    sizeLabel: "Size (L × W × D cm) and appearance *",
    sizePlaceholder: "e.g. 2 × 3 × 0.5 cm, slough present",
    secondaryFieldLabel: "Dressing / treatment",
    secondaryFieldPlaceholder: "e.g. Foam dressing applied, barrier cream",
  },
  "Skin tear": {
    subCategoryLabel: "Skin Tear Classification (ISTAP) *",
    subCategories: [
      "Type 1 — No skin loss (flap edges align)",
      "Type 2 — Partial flap loss",
      "Type 3 — Total flap loss",
    ],
    defaultSubCategory: "Type 1 — No skin loss (flap edges align)",
    hasExudate: true,
    sizeLabel: "Size (L × W cm) and appearance *",
    sizePlaceholder: "e.g. 3 × 1 cm, clean wound edges",
    secondaryFieldLabel: "Dressing / treatment",
    secondaryFieldPlaceholder: "e.g. Silicone foam dressing, skin barrier",
  },
  Bruise: {
    subCategoryLabel: "Bruise Color & Age Stage *",
    subCategories: [
      "Red / Dark Purple (New, 0-2 days)",
      "Blue / Violet (2-5 days)",
      "Greenish-Yellow (5-7 days)",
      "Brown / Fading (7+ days)",
    ],
    defaultSubCategory: "Red / Dark Purple (New, 0-2 days)",
    hasExudate: false,
    sizeLabel: "Size (L × W cm) and appearance *",
    sizePlaceholder: "e.g. 4 × 3 cm oval, dark purple center",
    secondaryFieldLabel: "Suspected cause / Mechanism",
    secondaryFieldPlaceholder: "e.g. Minor bump on bed rail, manual transfer",
    symptomLabel: "Tenderness & Swelling",
    symptomOptions: ["None", "Mild tenderness", "Moderate edema", "Severe pain"],
  },
  Laceration: {
    subCategoryLabel: "Laceration Depth & Wound Type *",
    subCategories: [
      "Superficial (Skin level, clean edges)",
      "Partial depth (Gaping edges)",
      "Deep / Extensive (Requires clinical review)",
    ],
    defaultSubCategory: "Superficial (Skin level, clean edges)",
    hasExudate: true,
    sizeLabel: "Size (Length × Depth cm) *",
    sizePlaceholder: "e.g. 2.5 cm length, superficial dermis",
    secondaryFieldLabel: "Dressing / First aid applied",
    secondaryFieldPlaceholder: "e.g. Sterile gauze, steristrips, pressure dressing",
  },
  Rash: {
    subCategoryLabel: "Rash Characteristics *",
    subCategories: [
      "Erythematous / Redness",
      "Maculopapular (Raised bumps)",
      "Dry / Flaking / Scaly",
      "Urticaria / Hives",
    ],
    defaultSubCategory: "Erythematous / Redness",
    hasExudate: false,
    sizeLabel: "Distribution & Area affected *",
    sizePlaceholder: "e.g. Patchy across lower sacrum / buttocks",
    secondaryFieldLabel: "Topical cream / Treatment",
    secondaryFieldPlaceholder: "e.g. Emollient barrier cream applied",
    symptomLabel: "Sensation & Discomfort",
    symptomOptions: ["None", "Pruritic (Itchy)", "Burning", "Painful"],
  },
  "Moisture lesion": {
    subCategoryLabel: "Moisture Lesion Stage (MASD) *",
    subCategories: [
      "Mild (Blanching erythema, skin intact)",
      "Moderate (Non-blanching, superficial erosion)",
      "Severe (Denuded skin, weeping excoriation)",
    ],
    defaultSubCategory: "Mild (Blanching erythema, skin intact)",
    hasExudate: true,
    sizeLabel: "Size (L × W cm) and appearance *",
    sizePlaceholder: "e.g. Diffuse redness in skin fold, superficial peeling",
    secondaryFieldLabel: "Incontinence care / Barrier applied",
    secondaryFieldPlaceholder: "e.g. Zinc barrier cream, repositioning protocol",
  },
};

export function mapToSchemaFindingType(
  primaryType: PrimaryFindingType,
): BodyMapFindingTypeValue {
  switch (primaryType) {
    case "Bruise":
      return "Bruise";
    case "Skin tear":
      return "Skin Tear";
    case "Laceration":
      return "Wound";
    case "Rash":
      return "Rash";
    case "Moisture lesion":
      return "Other";
    case "Pressure ulcer":
    default:
      return "Pressure Injury";
  }
}

export function inferSeverity(
  primaryType: PrimaryFindingType,
  subCategory: string,
  exudateOrSymptom: string,
): BodyMapSeverityValue {
  if (
    subCategory.includes("category 4") ||
    subCategory.includes("category 3") ||
    subCategory.includes("Unstageable") ||
    subCategory.includes("Deep") ||
    subCategory.includes("Severe") ||
    exudateOrSymptom === "High" ||
    exudateOrSymptom.includes("Severe")
  ) {
    return "Severe";
  }
  if (
    subCategory.includes("category 2") ||
    subCategory.includes("Type 2") ||
    subCategory.includes("Moderate") ||
    exudateOrSymptom === "Moderate"
  ) {
    return "Moderate";
  }
  return "Mild";
}

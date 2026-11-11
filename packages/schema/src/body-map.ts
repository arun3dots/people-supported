import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Anatomy Hierarchy & Types
// ─────────────────────────────────────────────────────────────

export type AnatomyLevel = "region" | "structure" | "subpart" | "detail";
export type Laterality = "Left" | "Right" | "Bilateral" | "Midline";
export type BodyMapVariant = "male" | "female" | "neutral";
export type BodyMapView = "Front" | "Back";

export interface AnatomyNode {
  id: string;
  label: string;
  level: AnatomyLevel;
  parentId: string | null;
  region: "head-neck" | "torso" | "upper-limb" | "lower-limb";
  anatomicalRegion?: string;
  bodyPart?: string;
  subPart?: string;
  detail?: string;
  laterality?: Laterality;
  supportedViews: ("Front" | "Back")[];
  description?: string;
}

export const DEFAULT_BODY_MAP_ASSET_VERSION = "body-map-assets-v1";
export const COORDINATE_SPACE_ANATOMY_BBOX = "anatomy-bbox";

export const ANATOMY_CATALOGUE: AnatomyNode[] = [
  // ═══════════════════════════════════════════════════════════
  // HEAD & NECK
  // ═══════════════════════════════════════════════════════════
  {
    id: "head-neck", label: "Head & Neck", parentId: null,
    level: "region",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head_neck",
    supportedViews: ["Front", "Back"],
  },
  // Head
  {
    id: "head",
    label: "Head",
    parentId: "head-neck",
    level: "structure",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "cranium",
    label: "Cranium / Scalp",
    parentId: "head",
    level: "subpart",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    subPart: "cranium",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "face",
    label: "Face",
    parentId: "head",
    level: "subpart",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    subPart: "face",
    supportedViews: ["Front"],
  },
  {
    id: "forehead",
    label: "Forehead",
    parentId: "face",
    level: "detail",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    subPart: "face",
    detail: "forehead",
    supportedViews: ["Front"],
  },
  {
    id: "nose",
    label: "Nose",
    parentId: "face",
    level: "detail",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    subPart: "face",
    detail: "nose",
    laterality: "Midline",
    supportedViews: ["Front"],
  },
  {
    id: "mouth",
    label: "Mouth / Lips",
    parentId: "face",
    level: "detail",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    subPart: "face",
    detail: "mouth",
    laterality: "Midline",
    supportedViews: ["Front"],
  },
  {
    id: "chin",
    label: "Chin",
    parentId: "face",
    level: "detail",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    subPart: "face",
    detail: "chin",
    laterality: "Midline",
    supportedViews: ["Front"],
  },
  {
    id: "left-ear",
    label: "Left Ear",
    parentId: "head",
    level: "detail",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    detail: "ear",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-ear",
    label: "Right Ear",
    parentId: "head",
    level: "detail",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "head",
    detail: "ear",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  // Neck
  {
    id: "neck",
    label: "Neck",
    parentId: "head-neck",
    level: "structure",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "neck",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "anterior-neck",
    label: "Anterior Neck (Throat)",
    parentId: "neck",
    level: "subpart",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "neck",
    subPart: "anterior_neck",
    supportedViews: ["Front"],
  },
  {
    id: "posterior-neck",
    label: "Posterior Neck (Nape)",
    parentId: "neck",
    level: "subpart",
    region: "head-neck", anatomicalRegion: "head_neck",
    bodyPart: "neck",
    subPart: "posterior_neck",
    supportedViews: ["Back"],
  },

  // ═══════════════════════════════════════════════════════════
  // TORSO (CHEST, ABDOMEN, BACK, PELVIS)
  // ═══════════════════════════════════════════════════════════
  {
    id: "torso", label: "Torso", parentId: null,
    level: "region",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "torso",
    supportedViews: ["Front", "Back"],
  },
  // Chest
  {
    id: "chest",
    label: "Chest",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "chest",
    supportedViews: ["Front"],
  },
  {
    id: "right-chest",
    label: "Right Chest",
    parentId: "chest",
    level: "subpart",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "chest",
    laterality: "Right",
    supportedViews: ["Front"],
  },
  {
    id: "left-chest",
    label: "Left Chest",
    parentId: "chest",
    level: "subpart",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "chest",
    laterality: "Left",
    supportedViews: ["Front"],
  },
  // Abdomen
  {
    id: "abdomen",
    label: "Abdomen",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "abdomen",
    supportedViews: ["Front"],
  },
  {
    id: "upper-abdomen",
    label: "Upper Abdomen (Epigastrium)",
    parentId: "abdomen",
    level: "subpart",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "abdomen",
    subPart: "upper_abdomen",
    supportedViews: ["Front"],
  },
  {
    id: "lower-abdomen",
    label: "Lower Abdomen",
    parentId: "abdomen",
    level: "subpart",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "abdomen",
    subPart: "lower_abdomen",
    supportedViews: ["Front"],
  },
  {
    id: "groin",
    label: "Groin / Pelvis",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "groin",
    laterality: "Midline",
    supportedViews: ["Front"],
  },
  // Back
  {
    id: "upper-back",
    label: "Upper Back",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "upper_back",
    supportedViews: ["Back"],
  },
  {
    id: "lower-back",
    label: "Lower Back (Lumbar)",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "lower_back",
    supportedViews: ["Back"],
  },
  {
    id: "sacrum",
    label: "Sacrum / Coccyx",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "sacrum",
    laterality: "Midline",
    supportedViews: ["Back"],
  },
  {
    id: "right-buttock",
    label: "Right Buttock",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "buttock",
    laterality: "Right",
    supportedViews: ["Back"],
  },
  {
    id: "left-buttock",
    label: "Left Buttock",
    parentId: "torso",
    level: "structure",
    region: "torso", anatomicalRegion: "torso",
    bodyPart: "buttock",
    laterality: "Left",
    supportedViews: ["Back"],
  },

  // ═══════════════════════════════════════════════════════════
  // UPPER LIMBS (RIGHT & LEFT)
  // ═══════════════════════════════════════════════════════════
  {
    id: "upper-limb", label: "Upper Limbs", parentId: null,
    level: "region",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "upper_limb",
    supportedViews: ["Front", "Back"],
  },

  // Right Upper Limb
  {
    id: "right-shoulder",
    label: "Right Shoulder",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "shoulder",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-upper-arm",
    label: "Right Upper Arm",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "upper_arm",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-elbow",
    label: "Right Elbow",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "elbow",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-forearm",
    label: "Right Forearm",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "forearm",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-wrist",
    label: "Right Wrist",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "wrist",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-hand",
    label: "Right Hand",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  // Right Hand Digits
  {
    id: "right-thumb",
    label: "Right Thumb",
    parentId: "right-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "thumb",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-thumb-nail",
    label: "Right Thumb Nail",
    parentId: "right-thumb",
    level: "detail",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "thumb",
    detail: "nail",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-index-finger",
    label: "Right Index Finger",
    parentId: "right-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "index_finger",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-index-finger-nail",
    label: "Right Index Finger Nail",
    parentId: "right-index-finger",
    level: "detail",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "index_finger",
    detail: "nail",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-middle-finger",
    label: "Right Middle Finger",
    parentId: "right-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "middle_finger",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-ring-finger",
    label: "Right Ring Finger",
    parentId: "right-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "ring_finger",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-little-finger",
    label: "Right Little Finger",
    parentId: "right-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "little_finger",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },

  // Left Upper Limb
  {
    id: "left-shoulder",
    label: "Left Shoulder",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "shoulder",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-upper-arm",
    label: "Left Upper Arm",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "upper_arm",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-elbow",
    label: "Left Elbow",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "elbow",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-forearm",
    label: "Left Forearm",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "forearm",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-wrist",
    label: "Left Wrist",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "wrist",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-hand",
    label: "Left Hand",
    parentId: "upper-limb",
    level: "structure",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  // Left Hand Digits
  {
    id: "left-thumb",
    label: "Left Thumb",
    parentId: "left-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "thumb",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-thumb-nail",
    label: "Left Thumb Nail",
    parentId: "left-thumb",
    level: "detail",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "thumb",
    detail: "nail",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-index-finger",
    label: "Left Index Finger",
    parentId: "left-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "index_finger",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-index-finger-nail",
    label: "Left Index Finger Nail",
    parentId: "left-index-finger",
    level: "detail",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "index_finger",
    detail: "nail",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-middle-finger",
    label: "Left Middle Finger",
    parentId: "left-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "middle_finger",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-ring-finger",
    label: "Left Ring Finger",
    parentId: "left-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "ring_finger",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-little-finger",
    label: "Left Little Finger",
    parentId: "left-hand",
    level: "subpart",
    region: "upper-limb", anatomicalRegion: "upper_limb",
    bodyPart: "hand",
    subPart: "little_finger",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },

  // ═══════════════════════════════════════════════════════════
  // LOWER LIMBS (RIGHT & LEFT)
  // ═══════════════════════════════════════════════════════════
  {
    id: "lower-limb", label: "Lower Limbs", parentId: null,
    level: "region",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "lower_limb",
    supportedViews: ["Front", "Back"],
  },

  // Right Lower Limb
  {
    id: "right-thigh",
    label: "Right Thigh",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "thigh",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-knee",
    label: "Right Knee",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "knee",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-shin",
    label: "Right Shin",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "shin",
    laterality: "Right",
    supportedViews: ["Front"],
  },
  {
    id: "right-calf",
    label: "Right Calf",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "calf",
    laterality: "Right",
    supportedViews: ["Back"],
  },
  {
    id: "right-ankle",
    label: "Right Ankle",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "ankle",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-heel",
    label: "Right Heel",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "heel",
    laterality: "Right",
    supportedViews: ["Back"],
  },
  {
    id: "right-foot",
    label: "Right Foot",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "foot",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "right-big-toe",
    label: "Right Big Toe (Hallux)",
    parentId: "right-foot",
    level: "subpart",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "foot",
    subPart: "big_toe",
    laterality: "Right",
    supportedViews: ["Front", "Back"],
  },

  // Left Lower Limb
  {
    id: "left-thigh",
    label: "Left Thigh",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "thigh",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-knee",
    label: "Left Knee",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "knee",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-shin",
    label: "Left Shin",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "shin",
    laterality: "Left",
    supportedViews: ["Front"],
  },
  {
    id: "left-calf",
    label: "Left Calf",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "calf",
    laterality: "Left",
    supportedViews: ["Back"],
  },
  {
    id: "left-ankle",
    label: "Left Ankle",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "ankle",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-heel",
    label: "Left Heel",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "heel",
    laterality: "Left",
    supportedViews: ["Back"],
  },
  {
    id: "left-foot",
    label: "Left Foot",
    parentId: "lower-limb",
    level: "structure",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "foot",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
  {
    id: "left-big-toe",
    label: "Left Big Toe (Hallux)",
    parentId: "left-foot",
    level: "subpart",
    region: "lower-limb", anatomicalRegion: "lower_limb",
    bodyPart: "foot",
    subPart: "big_toe",
    laterality: "Left",
    supportedViews: ["Front", "Back"],
  },
];

// Map lookup by ID
// ─────────────────────────────────────────────────────────────
// Helper Functions & Lookups
// ─────────────────────────────────────────────────────────────

export const ANATOMY_BY_ID = new Map<string, AnatomyNode>(
  ANATOMY_CATALOGUE.map((node) => [node.id, node]),
);

export function getAnatomyNode(id: string): AnatomyNode | undefined {
  return ANATOMY_BY_ID.get(id);
}

export function getAnatomyAncestors(id: string): AnatomyNode[] {
  const result: AnatomyNode[] = [];
  let curr = ANATOMY_BY_ID.get(id);
  while (curr) {
    result.unshift(curr);
    curr = curr.parentId ? ANATOMY_BY_ID.get(curr.parentId) : undefined;
  }
  return result;
}

export function getAnatomyChildren(parentId: string): AnatomyNode[] {
  return ANATOMY_CATALOGUE.filter((n) => n.parentId === parentId);
}

export function buildLocationLabel(id: string): string {
  const ancestors = getAnatomyAncestors(id);
  if (ancestors.length === 0) return id;
  const displayNodes =
    ancestors.length > 1 && ancestors[0]?.level === "region"
      ? ancestors.slice(1)
      : ancestors;
  return displayNodes.map((n) => n.label).join(" → ");
}

export function getAnatomyForView(view: "Front" | "Back"): AnatomyNode[] {
  return ANATOMY_CATALOGUE.filter((n) => n.supportedViews.includes(view));
}

// ─────────────────────────────────────────────────────────────
// Enums & DTOs
// ─────────────────────────────────────────────────────────────

export const BodyMapViewEnum = z.enum(["Front", "Back"]);
export type BodyMapViewType = z.infer<typeof BodyMapViewEnum>;

export const BodyMapVariantEnum = z.enum(["male", "female", "neutral"]);
export type BodyMapVariantType = z.infer<typeof BodyMapVariantEnum>;

export const BodyMapFindingType = z.enum([
  "Bruise",
  "Skin Tear",
  "Pressure Injury",
  "Wound",
  "Rash",
  "Swelling",
  "Scar",
  "Other",
]);
export type BodyMapFindingTypeValue = z.infer<typeof BodyMapFindingType>;

export const BodyMapSeverity = z.enum(["Mild", "Moderate", "Severe"]);
export type BodyMapSeverityValue = z.infer<typeof BodyMapSeverity>;

export const BodyMapStatus = z.enum(["Open", "Resolved"]);
export type BodyMapStatusValue = z.infer<typeof BodyMapStatus>;

/** Normalized relative point inside anatomical bounding coordinate space */
export const ExactPointSchema = z.object({
  coordinateSpace: z.literal("anatomy-bbox").default("anatomy-bbox"),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type ExactPointDTO = z.infer<typeof ExactPointSchema>;

export const CreateBodyMapFindingSchema = z.object({
  view: BodyMapViewEnum,
  bodyMapVariant: BodyMapVariantEnum.default("neutral"),
  bodyMapAssetVersion: z.string().default(DEFAULT_BODY_MAP_ASSET_VERSION),
  anatomyId: z.string().min(1, "Anatomy ID is required"),
  anatomicalRegion: z.string().default("general"),
  bodyPart: z.string().default("general"),
  subPart: z.string().optional(),
  detail: z.string().optional(),
  laterality: z.enum(["Left", "Right", "Midline", "Bilateral", "left", "right", "midline", "bilateral"]).optional(),
  locationLabel: z.string().min(1, "Location label is required"),
  exactPoint: ExactPointSchema.optional(),
  findingType: BodyMapFindingType,
  severity: BodyMapSeverity,
  onsetDate: z.string().min(1, "Onset date is required"),
  description: z.string().optional(),
  linkedIncidentId: z.string().uuid().optional(),
  // G-04: EPUAP/NPIAP Pressure Ulcer Staging & Wound Measurements
  pressureUlcerCategory: z
    .enum([
      "Category 1",
      "Category 2",
      "Category 3",
      "Category 4",
      "Unstageable",
      "Deep Tissue Injury",
    ])
    .optional()
    .nullable(),
  lengthMm: z.number().min(0).max(1000).optional().nullable(),
  widthMm: z.number().min(0).max(1000).optional().nullable(),
  depthMm: z.number().min(0).max(500).optional().nullable(),
  exudateLevel: z
    .enum(["None", "Low", "Moderate", "High"])
    .optional()
    .nullable(),
  tissueType: z
    .enum(["Epithelialising", "Granulating", "Sloughy", "Necrotic"])
    .optional()
    .nullable(),
  dressingApplied: z.string().max(300).optional().nullable(),
  nextDressingDueAt: z.string().or(z.date()).optional().nullable(),
});
export type CreateBodyMapFindingDTO = z.infer<typeof CreateBodyMapFindingSchema>;

/** POST /residents/:residentId/body-map/assessments */
export const CreateBodyMapAssessmentSchema = z.object({
  notes: z.string().optional(),
  findings: z.array(CreateBodyMapFindingSchema).min(1, "At least one finding is required"),
});
export type CreateBodyMapAssessmentDTO = z.infer<
  typeof CreateBodyMapAssessmentSchema
>;

/** POST /body-map-findings/:id/resolve */
export const ResolveBodyMapFindingSchema = z.object({
  resolutionNote: z.string().optional(),
});
export type ResolveBodyMapFindingDTO = z.infer<
  typeof ResolveBodyMapFindingSchema
>;

/** POST /body-map-findings/:id/actions */
export const CreateBodyMapFindingActionSchema = z.object({
  description: z.string().trim().min(1, "Action description is required"),
});
export type CreateBodyMapFindingActionDTO = z.infer<
  typeof CreateBodyMapFindingActionSchema
>;

/** PATCH /body-map-findings/:id/actions/:actionId */
export const UpdateBodyMapFindingActionSchema = z.object({
  description: z.string().trim().min(1, "Action description is required"),
});
export type UpdateBodyMapFindingActionDTO = z.infer<
  typeof UpdateBodyMapFindingActionSchema
>;

export interface BodyMapFindingActionDTO {
  id: string;
  findingId: string;
  description: string;
  createdById: string;
  createdByName?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

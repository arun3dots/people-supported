/**
 * Body Map Clinical Constants & Tokens for Mobile (Rule #13)
 */

export const FINDING_TYPE_COLORS: Record<string, string> = {
  Bruise: '#8B5CF6',
  'Skin Tear': '#EF4444',
  'Pressure Injury': '#F97316',
  Wound: '#DC2626',
  Rash: '#EC4899',
  Swelling: '#3B82F6',
  Scar: '#6B7280',
  Other: '#A855F7',
};

export const SEVERITY_COLORS: Record<string, string> = {
  Mild: '#10B981',     // emerald
  Moderate: '#F59E0B', // amber
  Severe: '#EF4444',   // red
};

export const SEVERITY_BG_LIGHT: Record<string, string> = {
  Mild: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Moderate: 'bg-amber-50 border-amber-200 text-amber-800',
  Severe: 'bg-rose-50 border-rose-200 text-rose-800',
};

export const BODY_MAP_FINDING_TYPES = [
  'Pressure Injury',
  'Skin Tear',
  'Bruise',
  'Wound',
  'Rash',
  'Swelling',
  'Scar',
  'Other',
] as const;

export const BODY_MAP_SEVERITIES = ['Mild', 'Moderate', 'Severe'] as const;

export interface AnatomyCenterPoint {
  x: number;
  y: number;
  view: 'Front' | 'Back' | 'both';
  label: string;
}

export const ANATOMY_DEFAULT_CENTERS: Record<string, AnatomyCenterPoint> = {
  // Head & Neck
  'head-neck': { x: 0.53, y: 0.08, view: 'both', label: 'Head & Neck' },
  cranium: { x: 0.53, y: 0.06, view: 'both', label: 'Cranium / Scalp' },
  face: { x: 0.53, y: 0.11, view: 'Front', label: 'Face' },
  forehead: { x: 0.53, y: 0.08, view: 'Front', label: 'Forehead' },
  'right-ear': { x: 0.44, y: 0.11, view: 'Front', label: 'Right Ear' },
  'left-ear': { x: 0.62, y: 0.11, view: 'Front', label: 'Left Ear' },
  nose: { x: 0.53, y: 0.11, view: 'Front', label: 'Nose' },
  mouth: { x: 0.53, y: 0.13, view: 'Front', label: 'Mouth' },
  chin: { x: 0.53, y: 0.15, view: 'Front', label: 'Chin' },
  neck: { x: 0.53, y: 0.18, view: 'both', label: 'Neck' },
  'anterior-neck': { x: 0.53, y: 0.18, view: 'Front', label: 'Anterior Neck' },
  'posterior-neck': { x: 0.53, y: 0.18, view: 'Back', label: 'Posterior Neck' },

  // Torso
  torso: { x: 0.53, y: 0.34, view: 'both', label: 'Torso' },
  chest: { x: 0.53, y: 0.26, view: 'Front', label: 'Chest' },
  'right-chest': { x: 0.44, y: 0.26, view: 'Front', label: 'Right Chest' },
  'left-chest': { x: 0.62, y: 0.26, view: 'Front', label: 'Left Chest' },
  'upper-back': { x: 0.53, y: 0.26, view: 'Back', label: 'Upper Back' },
  abdomen: { x: 0.53, y: 0.36, view: 'Front', label: 'Abdomen' },
  'upper-abdomen': { x: 0.53, y: 0.33, view: 'Front', label: 'Upper Abdomen' },
  'lower-abdomen': { x: 0.53, y: 0.41, view: 'Front', label: 'Lower Abdomen' },
  'lower-back': { x: 0.53, y: 0.36, view: 'Back', label: 'Lower Back' },
  sacrum: { x: 0.53, y: 0.47, view: 'Back', label: 'Sacrum' },
  buttocks: { x: 0.53, y: 0.49, view: 'Back', label: 'Buttocks' },
  'left-buttock': { x: 0.61, y: 0.49, view: 'Back', label: 'Left Buttock' },
  'right-buttock': { x: 0.45, y: 0.49, view: 'Back', label: 'Right Buttock' },
  groin: { x: 0.53, y: 0.48, view: 'Front', label: 'Groin / Pelvis' },

  // Upper Limbs
  'upper-limb': { x: 0.72, y: 0.34, view: 'both', label: 'Upper Limbs' },
  'right-shoulder': { x: 0.34, y: 0.23, view: 'both', label: 'Right Shoulder' },
  'left-shoulder': { x: 0.72, y: 0.23, view: 'both', label: 'Left Shoulder' },
  'right-upper-arm': { x: 0.30, y: 0.32, view: 'both', label: 'Right Upper Arm' },
  'left-upper-arm': { x: 0.76, y: 0.32, view: 'both', label: 'Left Upper Arm' },
  'right-elbow': { x: 0.27, y: 0.41, view: 'both', label: 'Right Elbow' },
  'left-elbow': { x: 0.79, y: 0.41, view: 'both', label: 'Left Elbow' },
  'right-forearm': { x: 0.24, y: 0.48, view: 'both', label: 'Right Forearm' },
  'left-forearm': { x: 0.82, y: 0.48, view: 'both', label: 'Left Forearm' },
  'right-wrist': { x: 0.20, y: 0.54, view: 'both', label: 'Right Wrist' },
  'left-wrist': { x: 0.86, y: 0.54, view: 'both', label: 'Left Wrist' },
  'right-hand': { x: 0.17, y: 0.58, view: 'both', label: 'Right Hand' },
  'left-hand': { x: 0.89, y: 0.58, view: 'both', label: 'Left Hand' },

  // Lower Limbs
  'lower-limb': { x: 0.63, y: 0.70, view: 'both', label: 'Lower Limbs' },
  'right-hip': { x: 0.42, y: 0.52, view: 'both', label: 'Right Hip' },
  'left-hip': { x: 0.64, y: 0.52, view: 'both', label: 'Left Hip' },
  'right-thigh': { x: 0.43, y: 0.60, view: 'both', label: 'Right Thigh' },
  'left-thigh': { x: 0.63, y: 0.60, view: 'both', label: 'Left Thigh' },
  'right-knee': { x: 0.42, y: 0.71, view: 'both', label: 'Right Knee' },
  'left-knee': { x: 0.64, y: 0.71, view: 'both', label: 'Left Knee' },
  'right-lower-leg': { x: 0.41, y: 0.81, view: 'both', label: 'Right Lower Leg' },
  'left-lower-leg': { x: 0.65, y: 0.81, view: 'both', label: 'Left Lower Leg' },
  'right-ankle': { x: 0.40, y: 0.89, view: 'both', label: 'Right Ankle' },
  'left-ankle': { x: 0.66, y: 0.89, view: 'both', label: 'Left Ankle' },
  'right-foot': { x: 0.38, y: 0.94, view: 'both', label: 'Right Foot' },
  'left-foot': { x: 0.68, y: 0.94, view: 'both', label: 'Left Foot' },
  'right-heel': { x: 0.40, y: 0.93, view: 'Back', label: 'Right Heel' },
  'left-heel': { x: 0.66, y: 0.93, view: 'Back', label: 'Left Heel' },
};

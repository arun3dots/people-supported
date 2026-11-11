/**
 * Color Tokens & Visual Enums for Clinical Findings
 */

/** Finding type → marker color mapping */
export const FINDING_TYPE_COLORS: Record<string, string> = {
  Bruise: "#8B5CF6",            // violet
  "Skin Tear": "#EF4444",      // red
  "Pressure Injury": "#F97316", // orange
  Wound: "#DC2626",            // dark red
  Rash: "#EC4899",             // pink
  Swelling: "#3B82F6",         // blue
  Scar: "#6B7280",             // slate gray
  Other: "#A855F7",            // purple
};

/** Severity → border/badge color mapping */
export const SEVERITY_COLORS: Record<string, string> = {
  Mild: "#22C55E",      // green
  Moderate: "#F59E0B",  // amber
  Severe: "#EF4444",    // red
};

/** Severity → Badge state mapping (standard UI tokens). */
export const SEVERITY_BADGE_STATE: Record<
  string,
  "success" | "warning" | "danger" | "inactive"
> = {
  Mild: "success",
  Moderate: "warning",
  Severe: "danger",
};

/** Finding type → standard Tailwind dot color class. */
export const FINDING_TYPE_DOT_CLASS: Record<string, string> = {
  Bruise: "bg-violet-500",
  "Skin Tear": "bg-red-500",
  "Pressure Injury": "bg-orange-500",
  Wound: "bg-red-600",
  Rash: "bg-pink-500",
  Swelling: "bg-blue-500",
  Scar: "bg-slate-500",
  Other: "bg-purple-500",
};

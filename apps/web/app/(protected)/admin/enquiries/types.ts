export const RELATIONSHIPS = [
  "Daughter",
  "Son",
  "Spouse",
  "Sibling",
  "Social Worker",
  "GP / Doctor",
  "Self",
  "Other Relative",
] as const;

export const LOCATIONS = [
  "Home",
  "Hospital",
  "Another Supported Living Service",
  "Rehabilitation",
  "Other",
] as const;

export const CATEGORIES = [
  "Residential",
  "Mental Health",
  "Dementia",
  "Respite",
  "Nursing",
] as const;

export const DEPENDENCY_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

export const ENQUIRY_STATUSES = [
  "Enquiry",
  "Assessment Pending",
  "Ready for Admission",
  "Admitted",
  "Closed",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

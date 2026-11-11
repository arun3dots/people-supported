/**
 * Comprehensive standard relationship options for Next of Kin,
 * Emergency Contacts, and Financially Responsible Parties.
 */
export const RELATIONSHIP_OPTIONS = [
  "Self",
  "Spouse",
  "Partner",
  "Son",
  "Daughter",
  "Child",
  "Father",
  "Mother",
  "Parent",
  "Brother",
  "Sister",
  "Sibling",
  "Grandson",
  "Granddaughter",
  "Grandchild",
  "Niece",
  "Nephew",
  "Cousin",
  "Friend",
  "Legal Guardian / POA",
  "Solicitor / Attorney",
  "Court-Appointed Deputy",
  "Case Manager / Social Worker",
  "Local Authority",
  "Other",
] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];

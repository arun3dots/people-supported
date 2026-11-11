/**
 * The current user's own profile, returned by GET /api/profile.
 * Mirrors the backend `MyProfile` shape (dates serialised as ISO strings).
 */
export type MyProfile = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  mfaEnabled: boolean;
  emailVerified: boolean;
  role: { id: string; name: string } | null;
  dob: string | null;
  dbsNumber: string | null;
  dbsExpiryDate: string | null;
  startDate: string | null;
  department: string | null;
  preferredLanguage: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  passwordChangedAt: string | null;
};

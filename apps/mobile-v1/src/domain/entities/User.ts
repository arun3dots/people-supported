import type { AuthUserDTO } from '@repo/schema';

export type User = AuthUserDTO & {
  shiftId?: string | null;
  profilePhotoUrl?: string | null;
  profilePicture?: string | null;
  photoUrl?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  preferredLanguage?: string | null;
  dob?: string | null;
  address?: string | null;
  facilityName?: string | null;
  branchName?: string | null;
};

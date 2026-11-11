import { MyProfile } from "../../../../lib/types/profile";

/** Join the structured address parts into a single human-readable line. */
export function formatAddress(
  profile: Pick<MyProfile, "addressLine1" | "addressLine2" | "city" | "postcode">,
): string {
  return [
    profile.addressLine1,
    profile.addressLine2,
    profile.city,
    profile.postcode,
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(", ");
}

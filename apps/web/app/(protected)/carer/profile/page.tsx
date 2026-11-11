import { redirect } from "next/navigation";

// The carer profile now lives at the shared, role-agnostic /profile route.
export default function CarerProfilePage() {
  redirect("/profile");
}

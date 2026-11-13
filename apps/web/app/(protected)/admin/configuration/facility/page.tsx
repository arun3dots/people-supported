import { redirect } from "next/navigation";

export const metadata = {
  title: "Facility Configuration | Cantra Care",
};

export default function FacilityConfigurationPage() {
  redirect("/admin/configuration/facility/properties");
}

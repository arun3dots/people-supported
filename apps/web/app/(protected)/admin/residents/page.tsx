import { Suspense } from "react";
import { ResidentDirectoryClient } from "./components";

export const metadata = {
  title: "Tenant Directory | Supported Living",
  description: "View and manage all admitted tenants and their support information.",
};

export default function ResidentsPage() {
  return <ResidentDirectoryClient />;
  return (
    <Suspense fallback={null}>
      <ResidentDirectoryClient />
    </Suspense>
  );
}

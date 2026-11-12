import { Suspense } from "react";
import { ResidentDirectoryClient } from "./components";

export const metadata = {
  title: "Resident Directory | Supported Living",
  description: "View and manage all admitted residents and their care information.",
};

export default function ResidentsPage() {
  return <ResidentDirectoryClient />;
  return (
    <Suspense fallback={null}>
      <ResidentDirectoryClient />
    </Suspense>
  );
}

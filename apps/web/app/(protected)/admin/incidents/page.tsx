import { Suspense } from "react";
import { IncidentDirectoryClient } from "./components";

export default function IncidentsPage() {
  return <IncidentDirectoryClient />;
  return (
    <Suspense fallback={null}>
      <IncidentDirectoryClient />
    </Suspense>
  );
}

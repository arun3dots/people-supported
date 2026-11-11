import { Suspense } from "react";
import { EscalationsDirectory } from "./EscalationsDirectory";

export default function AdminClinicalEscalationsPage() {
  return (
    <Suspense fallback={null}>
      <EscalationsDirectory />
    </Suspense>
  );
}

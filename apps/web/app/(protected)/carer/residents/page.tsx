import React, { Suspense } from "react";
import { ResidentDirectoryClient } from "../../admin/residents/components/ResidentDirectoryClient";
import { CarerShiftGate } from "../components/CarerShiftGate";

export const metadata = {
  title: "Residents | Care Home",
  description: "View and manage residents under care.",
};

export default function CarerResidentsPage() {
  return (
    <Suspense fallback={null}>
      <CarerShiftGate
        title="Shift Required for Resident Directory"
        description="Carers must start their shift before viewing resident lists and clinical records."
      >
        <ResidentDirectoryClient assignedOnly={true} />
      </CarerShiftGate>
    </Suspense>
  );
}

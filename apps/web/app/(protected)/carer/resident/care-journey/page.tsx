"use client";

import ResidentCareJourneyPage from "../../../resident/care-journey/page";
import { CarerShiftGate } from "../../components/CarerShiftGate";

export default function CarerCareJourneyPage() {
  return (
    <CarerShiftGate
      title="Shift Required for Care Journey"
      description="Carers must start their shift before viewing or recording resident care journey routines."
    >
      <ResidentCareJourneyPage />
    </CarerShiftGate>
  );
}

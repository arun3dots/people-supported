import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_MEDICATION_PRESCRIPTIONS } from "@repo/endpoints";
import { residentKeys } from "./keys";

export interface MedicationRoundRow {
  id: string;
  prescriptionId: string | null;
  drugName: string;
  dose: string;
  form: string | null;
  route: string | null;
  frequency: string | null;
  instructions: string | null;
  imageUrls: string[];
  scheduledTime: string | null;
  status: string;
  isPRN?: boolean;
  isAdhoc?: boolean;
  administrations: {
    id: string;
    status: string;
    administeredAt: string | null;
    createdAt: string;
    performedBy: string | null;
    isSuperseded?: boolean;
    deletedAt?: string | null;
    carer?: { fullName?: string } | null;
  }[];
}

export interface MedicationPrescriptionRow {
  id: string;
  drugName: string;
  dose: string;
  form: string;
  instructions: string | null;
  imageUrls: string[];
  times: string[];
  startDate: string;
  endDate: string;
  allowLateAdministration: boolean;
  mandatoryObservations: string[];
  status: "Active" | "Stopped" | "Superseded";
  stopReason: string | null;
  supersedesId: string | null;
  pauses: { id: string; pauseFrom: string; resumeOn: string; reason: string }[];
  rounds: MedicationRoundRow[];
}

export function useGetMedicationPrescriptionsQuery(residentId: string) {
  return useQuery({
    queryKey: [
      ...residentKeys.detail(residentId),
      "medication-rounds",
      "prescriptions",
    ],
    queryFn: () =>
      makeAPICall<MedicationPrescriptionRow[]>(
        GET_MEDICATION_PRESCRIPTIONS,
        {},
        {},
        { id: residentId },
      ),
    enabled: !!residentId,
    refetchInterval: 30_000,
  });
}

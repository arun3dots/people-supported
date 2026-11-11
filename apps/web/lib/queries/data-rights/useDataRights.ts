import { useMutation } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  EXPORT_RESIDENT_SAR,
  EXPORT_STAFF_SAR,
} from "@repo/endpoints";

export function useExportResidentSarMutation() {
  return useMutation({
    mutationFn: async ({
      residentId,
      format = "json",
    }: {
      residentId: string;
      format?: "json" | "pdf";
    }) => {
      const data = await makeAPICall<Record<string, unknown>>(
        EXPORT_RESIDENT_SAR,
        {},
        { format },
        { id: residentId },
      );
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SAR-Resident-${residentId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return data;
    },
  });
}

export function useExportStaffSarMutation() {
  return useMutation({
    mutationFn: async ({
      userId,
      format = "json",
    }: {
      userId: string;
      format?: "json" | "pdf";
    }) => {
      const data = await makeAPICall<Record<string, unknown>>(
        EXPORT_STAFF_SAR,
        {},
        { format },
        { id: userId },
      );
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SAR-Staff-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return data;
    },
  });
}

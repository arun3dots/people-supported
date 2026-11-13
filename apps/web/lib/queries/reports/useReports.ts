"use client";

import { useMutation } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  EXPORT_INCIDENTS_REPORT,
  EXPORT_RESIDENTS_REPORT,
  EXPORT_ESCALATIONS_REPORT,
  EXPORT_OCCUPANCY_REPORT,
  EXPORT_MEDICATIONS_REPORT,
  EXPORT_CARE_PLANS_REPORT,
  EXPORT_SHIFTS_REPORT,
  EXPORT_CQC_COMPLIANCE_REPORT,
  EXPORT_INVOICES_REPORT,
} from "@repo/endpoints";
import { ReportCsvResponseDTO } from "@repo/schema";

export function triggerCsvDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function useCsvExportMutation(endpointKey: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await makeAPICall<ReportCsvResponseDTO>(endpointKey, {});
      if (response?.content && response?.filename) {
        triggerCsvDownload(response.filename, response.content);
      }
      return response;
    },
  });
}

export function useExportIncidentsReportMutation() {
  return useMutation({
    mutationFn: async (
      params: { startDate?: string; endDate?: string } = {},
    ) => {
      const response = await makeAPICall<ReportCsvResponseDTO>(
        EXPORT_INCIDENTS_REPORT,
        {},
        params as Record<string, string>,
      );
      if (response?.content && response?.filename) {
        triggerCsvDownload(response.filename, response.content);
      }
      return response;
    },
  });
}

export function useExportResidentsReportMutation() {
  return useCsvExportMutation(EXPORT_RESIDENTS_REPORT);
}

export function useExportEscalationsReportMutation() {
  return useCsvExportMutation(EXPORT_ESCALATIONS_REPORT);
}

export function useExportOccupancyReportMutation() {
  return useCsvExportMutation(EXPORT_OCCUPANCY_REPORT);
}

export function useExportMedicationsReportMutation() {
  return useCsvExportMutation(EXPORT_MEDICATIONS_REPORT);
}

export function useExportCarePlansReportMutation() {
  return useCsvExportMutation(EXPORT_CARE_PLANS_REPORT);
}

export function useExportShiftsReportMutation() {
  return useCsvExportMutation(EXPORT_SHIFTS_REPORT);
}

export function useExportCqcComplianceReportMutation() {
  return useCsvExportMutation(EXPORT_CQC_COMPLIANCE_REPORT);
}

export function useExportInvoicesReportMutation() {
  return useCsvExportMutation(EXPORT_INVOICES_REPORT);
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  EXPORT_INCIDENTS_REPORT,
  EXPORT_RESIDENTS_REPORT,
  EXPORT_ESCALATIONS_REPORT,
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
  return useMutation({
    mutationFn: async () => {
      const response = await makeAPICall<ReportCsvResponseDTO>(
        EXPORT_RESIDENTS_REPORT,
        {},
      );
      if (response?.content && response?.filename) {
        triggerCsvDownload(response.filename, response.content);
      }
      return response;
    },
  });
}

export function useExportEscalationsReportMutation() {
  return useMutation({
    mutationFn: async () => {
      const response = await makeAPICall<ReportCsvResponseDTO>(
        EXPORT_ESCALATIONS_REPORT,
        {},
      );
      if (response?.content && response?.filename) {
        triggerCsvDownload(response.filename, response.content);
      }
      return response;
    },
  });
}

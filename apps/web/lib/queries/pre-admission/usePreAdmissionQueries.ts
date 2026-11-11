"use client";

import { useQuery } from "@tanstack/react-query";
import type { PreAdmissionRecordDTO, PreAdmissionStatus } from "@repo/schema";
import { GET_PRE_ADMISSION, GET_PRE_ADMISSION_VERSIONS } from "@repo/endpoints";
import { makeAPICall } from "../../api";
import { preAdmissionKeys } from "./keys";

export interface PreAdmissionVersionSummary {
  id: string;
  versionNumber: number;
  status: PreAdmissionStatus;
  isCurrent: boolean;
  submittedAt: string | null;
  createdAt: string;
  assessedByName: string | null;
}

export function useGetPreAdmissionQuery(
  residentId: string,
  options: { retry?: boolean } = {},
) {
  return useQuery({
    queryKey: preAdmissionKeys.detail(residentId),
    queryFn: () =>
      makeAPICall<PreAdmissionRecordDTO>(GET_PRE_ADMISSION, {}, {}, { id: residentId }),
    enabled: !!residentId,
    staleTime: 0,
    retry: options.retry ?? 3,
  });
}

export function useGetPreAdmissionVersionsQuery(residentId: string) {
  return useQuery({
    queryKey: preAdmissionKeys.versions(residentId),
    queryFn: () =>
      makeAPICall<PreAdmissionVersionSummary[]>(
        GET_PRE_ADMISSION_VERSIONS,
        {},
        {},
        { id: residentId },
      ),
    enabled: !!residentId,
  });
}

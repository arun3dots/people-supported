"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AssessmentRecordDTO,
  CareTaskDayDTO,
  CareTaskDefinitionDTO,
  CareTaskShift,
  NeedCarePlanRecordDTO,
} from "@repo/schema";
import {
  GET_ASSESSMENT,
  GET_CARE_TASK_DAY,
  LIST_CARE_TASK_DEFINITIONS,
  LIST_NEED_CARE_PLANS,
} from "@repo/endpoints";
import { makeAPICall } from "../../api";
import { careJourneyKeys } from "./keys";

const NO_ASSESSMENT = "Assessment not found";

/** Resolves to null when the resident has no assessment yet. */
export function useGetAssessmentQuery(residentId: string) {
  return useQuery({
    queryKey: careJourneyKeys.assessment(residentId),
    queryFn: async (): Promise<AssessmentRecordDTO | null> => {
      try {
        return await makeAPICall<AssessmentRecordDTO>(
          GET_ASSESSMENT,
          {},
          {},
          { id: residentId },
        );
      } catch (error) {
        if (error instanceof Error && error.message === NO_ASSESSMENT) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!residentId,
    staleTime: 0,
  });
}

export function useListNeedCarePlansQuery(residentId: string) {
  return useQuery({
    queryKey: careJourneyKeys.plans(residentId),
    queryFn: () =>
      makeAPICall<NeedCarePlanRecordDTO[]>(
        LIST_NEED_CARE_PLANS,
        {},
        {},
        { id: residentId },
      ),
    enabled: !!residentId,
    staleTime: 0,
  });
}

export function useListCareTaskDefinitionsQuery(residentId: string) {
  return useQuery({
    queryKey: careJourneyKeys.definitions(residentId),
    queryFn: () =>
      makeAPICall<CareTaskDefinitionDTO[]>(
        LIST_CARE_TASK_DEFINITIONS,
        {},
        {},
        { id: residentId },
      ),
    enabled: !!residentId,
    staleTime: 0,
  });
}

export function useGetCareTaskDayQuery(
  residentId: string,
  shift: CareTaskShift,
  date?: string,
) {
  return useQuery({
    queryKey: careJourneyKeys.day(residentId, shift, date),
    queryFn: () =>
      makeAPICall<CareTaskDayDTO>(
        GET_CARE_TASK_DAY,
        {},
        date ? { shift, date } : { shift },
        { id: residentId },
      ),
    enabled: !!residentId,
    staleTime: 0,
  });
}

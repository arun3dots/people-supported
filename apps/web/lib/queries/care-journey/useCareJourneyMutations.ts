"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AssessmentRecordDTO,
  CareTaskDefinitionDTO,
  CreateCareTaskDTO,
  CreateNeedCarePlanDTO,
  CreateShiftNoteDTO,
  NeedCarePlanAgreementDTO,
  NeedCarePlanRecordDTO,
  RecordCareTaskDTO,
  SaveAssessmentDTO,
  SaveNeedCarePlanDTO,
  ShiftNoteDTO,
  UpdateCareTaskDTO,
} from "@repo/schema";
import {
  AGREE_NEED_CARE_PLAN,
  COMPLETE_ASSESSMENT,
  CREATE_ASSESSMENT,
  CREATE_CARE_TASK,
  CREATE_NEED_CARE_PLAN,
  CREATE_SHIFT_NOTE,
  RECORD_CARE_TASK,
  SAVE_ASSESSMENT,
  SAVE_NEED_CARE_PLAN,
  UNDO_CARE_TASK,
  UPDATE_CARE_TASK,
} from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";
import { makeAPICall } from "../../api";
import { careJourneyKeys } from "./keys";

const asPayload = (data: object) => data as Record<string, unknown>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function failure(title: string, fallback: string) {
  return (error: unknown) =>
    toast({
      title,
      description: errorMessage(error, fallback),
      variant: "destructive",
    });
}

function useRefreshAssessment() {
  const queryClient = useQueryClient();
  return (record: AssessmentRecordDTO) => {
    queryClient.setQueryData(
      careJourneyKeys.assessment(record.residentId),
      record,
    );
    queryClient.invalidateQueries({
      queryKey: careJourneyKeys.plans(record.residentId),
    });
  };
}

export function useCreateAssessmentMutation() {
  const refresh = useRefreshAssessment();
  return useMutation({
    mutationFn: (residentId: string) =>
      makeAPICall<AssessmentRecordDTO>(CREATE_ASSESSMENT, {}, {}, {
        id: residentId,
      }),
    onSuccess: refresh,
    onError: failure("Could not start the assessment", "Please try again"),
  });
}

export function useSaveAssessmentMutation() {
  const refresh = useRefreshAssessment();
  return useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: SaveAssessmentDTO;
    }) =>
      makeAPICall<AssessmentRecordDTO>(
        SAVE_ASSESSMENT,
        asPayload(data),
        {},
        { id: residentId },
      ),
    onSuccess: refresh,
    onError: failure("Could not save", "Saving the assessment failed"),
  });
}

export function useCompleteAssessmentMutation() {
  const refresh = useRefreshAssessment();
  return useMutation({
    mutationFn: (residentId: string) =>
      makeAPICall<AssessmentRecordDTO>(COMPLETE_ASSESSMENT, {}, {}, {
        id: residentId,
      }),
    onSuccess: refresh,
    onError: failure("Could not complete", "Completing the assessment failed"),
  });
}

function useRefreshPlans(residentId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: careJourneyKeys.plans(residentId),
    });
    queryClient.invalidateQueries({
      queryKey: careJourneyKeys.definitions(residentId),
    });
    queryClient.invalidateQueries({
      queryKey: careJourneyKeys.dayAll(residentId),
    });
    queryClient.invalidateQueries({
      queryKey: careJourneyKeys.assessment(residentId),
    });
  };
}

export function useCreateNeedCarePlanMutation(residentId: string) {
  const refresh = useRefreshPlans(residentId);
  return useMutation({
    mutationFn: (data: CreateNeedCarePlanDTO) =>
      makeAPICall<NeedCarePlanRecordDTO>(
        CREATE_NEED_CARE_PLAN,
        asPayload(data),
        {},
        { id: residentId },
      ),
    onSuccess: refresh,
    onError: failure("Could not create care plan", "Saving the care plan failed"),
  });
}

export function useSaveNeedCarePlanMutation(residentId: string) {
  const refresh = useRefreshPlans(residentId);
  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: string;
      data: SaveNeedCarePlanDTO;
    }) =>
      makeAPICall<NeedCarePlanRecordDTO>(
        SAVE_NEED_CARE_PLAN,
        asPayload(data),
        {},
        { id: residentId, planId },
      ),
    onSuccess: refresh,
    onError: failure("Could not save", "Saving the care plan failed"),
  });
}

export function useAgreeNeedCarePlanMutation(residentId: string) {
  const refresh = useRefreshPlans(residentId);
  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: string;
      data: NeedCarePlanAgreementDTO;
    }) =>
      makeAPICall<NeedCarePlanRecordDTO>(
        AGREE_NEED_CARE_PLAN,
        asPayload(data),
        {},
        { id: residentId, planId },
      ),
    onSuccess: refresh,
    onError: failure("Could not record agreement", "Please try again"),
  });
}

export function useCreateCareTaskMutation(residentId: string) {
  const refresh = useRefreshPlans(residentId);
  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: string;
      data: CreateCareTaskDTO;
    }) =>
      makeAPICall<CareTaskDefinitionDTO>(
        CREATE_CARE_TASK,
        asPayload(data),
        {},
        { id: residentId, planId },
      ),
    onSuccess: refresh,
    onError: failure("Could not add the task", "Please try again"),
  });
}

export function useUpdateCareTaskMutation(residentId: string) {
  const refresh = useRefreshPlans(residentId);
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateCareTaskDTO;
    }) =>
      makeAPICall<CareTaskDefinitionDTO>(
        UPDATE_CARE_TASK,
        asPayload(data),
        {},
        { id: residentId, taskId },
      ),
    onSuccess: refresh,
    onError: failure("Could not update the task", "Please try again"),
  });
}

export function useRecordCareTaskMutation(residentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: RecordCareTaskDTO;
    }) =>
      makeAPICall<unknown>(
        RECORD_CARE_TASK,
        asPayload(data),
        {},
        { id: residentId, taskId },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: careJourneyKeys.dayAll(residentId),
      }),
    onError: failure("Could not record", "Please try again"),
  });
}

export function useUndoCareTaskMutation(residentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      makeAPICall<unknown>(UNDO_CARE_TASK, {}, {}, { id: residentId, taskId }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: careJourneyKeys.dayAll(residentId),
      }),
    onError: failure("Could not undo", "Please try again"),
  });
}

export function useCreateShiftNoteMutation(residentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShiftNoteDTO) =>
      makeAPICall<ShiftNoteDTO>(CREATE_SHIFT_NOTE, asPayload(data), {}, {
        id: residentId,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: careJourneyKeys.dayAll(residentId),
      }),
    onError: failure("Could not add the note", "Please try again"),
  });
}

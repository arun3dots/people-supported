"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePreAdmissionDTO,
  PreAdmissionManagerDecisionDTO,
  PreAdmissionPartKey,
  PreAdmissionRecordDTO,
  UpdatePreAdmissionMetaDTO,
} from "@repo/schema";
import {
  CREATE_PRE_ADMISSION,
  DECIDE_PRE_ADMISSION,
  SAVE_PRE_ADMISSION_PART,
  SUBMIT_PRE_ADMISSION,
  UPDATE_PRE_ADMISSION_META,
} from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";
import { makeAPICall } from "../../api";
import { residentKeys } from "../residents/keys";
import { preAdmissionKeys } from "./keys";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function useRefreshPreAdmission() {
  const queryClient = useQueryClient();
  return (record: PreAdmissionRecordDTO) => {
    queryClient.setQueryData(
      preAdmissionKeys.detail(record.residentId),
      record,
    );
    queryClient.setQueryData(
      [
        ...residentKeys.detail(record.residentId),
        "medication-rounds",
        "onboarding",
      ],
      record.partC?.medicines ?? [],
    );
    queryClient.invalidateQueries({
      queryKey: preAdmissionKeys.versions(record.residentId),
    });
    queryClient.invalidateQueries({ queryKey: residentKeys.lists() });
    queryClient.invalidateQueries({
      queryKey: residentKeys.detail(record.residentId),
    });
  };
}

export function useCreatePreAdmissionMutation() {
  const refresh = useRefreshPreAdmission();
  return useMutation({
    mutationFn: (data: CreatePreAdmissionDTO) =>
      makeAPICall<PreAdmissionRecordDTO>(
        CREATE_PRE_ADMISSION,
        data as unknown as Record<string, unknown>,
      ),
    onSuccess: refresh,
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: errorMessage(error, "Could not start the pre-admission"),
        variant: "destructive",
      }),
  });
}

export function useSavePreAdmissionPartMutation() {
  const refresh = useRefreshPreAdmission();
  return useMutation({
    mutationFn: ({
      residentId,
      part,
      data,
    }: {
      residentId: string;
      part: PreAdmissionPartKey;
      data: object;
    }) =>
      makeAPICall<PreAdmissionRecordDTO>(
        SAVE_PRE_ADMISSION_PART,
        data as Record<string, unknown>,
        {},
        { id: residentId, part },
      ),
    onSuccess: refresh,
    onError: (error: unknown) =>
      toast({
        title: "Could not save",
        description: errorMessage(error, "Saving this part failed"),
        variant: "destructive",
      }),
  });
}

export function useUpdatePreAdmissionMetaMutation() {
  const refresh = useRefreshPreAdmission();
  return useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: UpdatePreAdmissionMetaDTO;
    }) =>
      makeAPICall<PreAdmissionRecordDTO>(
        UPDATE_PRE_ADMISSION_META,
        data as Record<string, unknown>,
        {},
        { id: residentId },
      ),
    onSuccess: refresh,
  });
}

export function useSubmitPreAdmissionMutation() {
  const refresh = useRefreshPreAdmission();
  return useMutation({
    mutationFn: (residentId: string) =>
      makeAPICall<PreAdmissionRecordDTO>(
        SUBMIT_PRE_ADMISSION,
        {},
        {},
        { id: residentId },
      ),
    onSuccess: refresh,
  });
}

export function useDecidePreAdmissionMutation() {
  const refresh = useRefreshPreAdmission();
  return useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: PreAdmissionManagerDecisionDTO;
    }) =>
      makeAPICall<PreAdmissionRecordDTO>(
        DECIDE_PRE_ADMISSION,
        data as unknown as Record<string, unknown>,
        {},
        { id: residentId },
      ),
    onSuccess: refresh,
    onError: (error: unknown) =>
      toast({
        title: "Decision failed",
        description: errorMessage(error, "Could not record the decision"),
        variant: "destructive",
      }),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/ui";
import { makeAPICall } from "../../api";
import {
  CREATE_RISK_ASSESSMENT,
  UPDATE_RISK_ASSESSMENT,
  TRANSITION_RISK_ASSESSMENT,
  DELETE_RISK_ASSESSMENT,
  CREATE_RISK_CONTROL,
  UPDATE_RISK_CONTROL,
  COMPLETE_RISK_CONTROL,
  DELETE_RISK_CONTROL,
} from "@repo/endpoints";
import type {
  CreateRiskAssessmentDTO,
  UpdateRiskAssessmentDTO,
  TransitionRiskStatusDTO,
  CreateRiskControlDTO,
  UpdateRiskControlDTO,
  CompleteRiskControlDTO,
} from "@repo/schema";
import { riskKeys } from "./keys";
import type { RiskAssessmentResponse, RiskControlResponse } from "./types";

function toastError(error: unknown): void {
  const msg = error instanceof Error ? error.message : "Action failed";
  toast({ title: "Error", description: msg, variant: "destructive" });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: riskKeys.all });
}

export function useCreateRiskAssessmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRiskAssessmentDTO) =>
      makeAPICall<RiskAssessmentResponse>(
        CREATE_RISK_ASSESSMENT,
        dto as unknown as Record<string, unknown>,
      ),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: "Success", description: "Risk assessment created." });
    },
    onError: toastError,
  });
}

export function useUpdateRiskAssessmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateRiskAssessmentDTO;
    }) =>
      makeAPICall<RiskAssessmentResponse>(
        UPDATE_RISK_ASSESSMENT,
        dto as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: "Success", description: "Risk assessment updated." });
    },
    onError: toastError,
  });
}

export function useTransitionRiskAssessmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: TransitionRiskStatusDTO;
    }) =>
      makeAPICall<RiskAssessmentResponse>(
        TRANSITION_RISK_ASSESSMENT,
        dto as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: (_, vars) => {
      invalidateAll(qc);
      toast({
        title: "Status updated",
        description: `Moved to ${vars.dto.status}.`,
      });
    },
    onError: toastError,
  });
}

export function useDeleteRiskAssessmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      makeAPICall<{ success: true }>(
        DELETE_RISK_ASSESSMENT,
        {},
        {},
        { id },
      ),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: "Deleted", description: "Risk assessment removed." });
    },
    onError: toastError,
  });
}

export function useCreateRiskControlMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      dto,
    }: {
      assessmentId: string;
      dto: CreateRiskControlDTO;
    }) =>
      makeAPICall<RiskControlResponse>(
        CREATE_RISK_CONTROL,
        dto as unknown as Record<string, unknown>,
        {},
        { id: assessmentId },
      ),
    onSuccess: () => invalidateAll(qc),
    onError: toastError,
  });
}

export function useUpdateRiskControlMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateRiskControlDTO;
    }) =>
      makeAPICall<RiskControlResponse>(
        UPDATE_RISK_CONTROL,
        dto as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: () => invalidateAll(qc),
    onError: toastError,
  });
}

export function useCompleteRiskControlMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: CompleteRiskControlDTO;
    }) =>
      makeAPICall<RiskControlResponse>(
        COMPLETE_RISK_CONTROL,
        dto as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: "Control completed" });
    },
    onError: toastError,
  });
}

export function useDeleteRiskControlMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      makeAPICall<{ success: true }>(DELETE_RISK_CONTROL, {}, {}, { id }),
    onSuccess: () => invalidateAll(qc),
    onError: toastError,
  });
}

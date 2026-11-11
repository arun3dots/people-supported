import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/ui";
import { makeAPICall } from "../../api";
import {
  GET_RISK_TEMPLATES,
  CREATE_RISK_TEMPLATE,
  UPDATE_RISK_TEMPLATE,
  DELETE_RISK_TEMPLATE,
} from "@repo/endpoints";
import type {
  CreateRiskTemplateDTO,
  UpdateRiskTemplateDTO,
} from "@repo/schema";
import { riskKeys } from "./keys";
import type { RiskTemplateResponse } from "./types";

function toastError(error: unknown): void {
  const msg = error instanceof Error ? error.message : "Action failed";
  toast({ title: "Error", description: msg, variant: "destructive" });
}

export function useGetRiskTemplatesQuery() {
  return useQuery<RiskTemplateResponse[]>({
    queryKey: riskKeys.templates(),
    queryFn: () => makeAPICall<RiskTemplateResponse[]>(GET_RISK_TEMPLATES),
  });
}

export function useCreateRiskTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRiskTemplateDTO) =>
      makeAPICall<RiskTemplateResponse>(
        CREATE_RISK_TEMPLATE,
        dto as unknown as Record<string, unknown>,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riskKeys.templates() });
      toast({ title: "Template created" });
    },
    onError: toastError,
  });
}

export function useUpdateRiskTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRiskTemplateDTO }) =>
      makeAPICall<RiskTemplateResponse>(
        UPDATE_RISK_TEMPLATE,
        dto as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riskKeys.templates() });
      toast({ title: "Template updated" });
    },
    onError: toastError,
  });
}

export function useDeleteRiskTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      makeAPICall<{ success: true }>(DELETE_RISK_TEMPLATE, {}, {}, { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riskKeys.templates() });
      toast({ title: "Template deleted" });
    },
    onError: toastError,
  });
}

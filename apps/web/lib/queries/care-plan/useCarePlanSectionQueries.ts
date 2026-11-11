import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_CARE_PLAN_SECTIONS,
  UPDATE_CARE_PLAN_SECTION,
  GET_CARE_PLAN_EXPORT_DATA,
  AUTO_DRAFT_CARE_PLAN,
} from "@repo/endpoints";
import type {
  CarePlanSectionDTO,
  UpdateCarePlanSectionDTO,
  DetailedCarePlanExportDTO,
} from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useGetCarePlanSectionsQuery(carePlanId: string) {
  return useQuery<CarePlanSectionDTO[]>({
    queryKey: carePlanKeys.sections(carePlanId),
    queryFn: () =>
      makeAPICall<CarePlanSectionDTO[]>(
        GET_CARE_PLAN_SECTIONS,
        undefined,
        {},
        { id: carePlanId },
      ),
    enabled: !!carePlanId,
  });
}

export function useGetCarePlanExportDataQuery(
  carePlanId: string,
  enabled = true,
) {
  return useQuery<DetailedCarePlanExportDTO>({
    queryKey: carePlanKeys.exportData(carePlanId),
    queryFn: () =>
      makeAPICall<DetailedCarePlanExportDTO>(
        GET_CARE_PLAN_EXPORT_DATA,
        undefined,
        {},
        { id: carePlanId },
      ),
    enabled: !!carePlanId && enabled,
  });
}

export function useUpdateCarePlanSectionMutation(carePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionName,
      data,
    }: {
      sectionName: string;
      data: UpdateCarePlanSectionDTO;
    }) =>
      makeAPICall(
        UPDATE_CARE_PLAN_SECTION,
        data as unknown as Record<string, unknown>,
        {},
        { id: carePlanId, sectionName },
      ),
    onSuccess: (_, variables) => {
      toast({
        title: "Domain Saved",
        description: `Successfully updated ${variables.sectionName}.`,
      });
      queryClient.invalidateQueries({
        queryKey: carePlanKeys.sections(carePlanId),
      });
      queryClient.invalidateQueries({
        queryKey: carePlanKeys.detail(carePlanId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update domain section",
        variant: "destructive",
      });
    },
  });
}

export function useAutoDraftCarePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (residentId: string) =>
      makeAPICall(AUTO_DRAFT_CARE_PLAN, {}, {}, { residentId }),
    onSuccess: () => {
      toast({
        title: "Care Plan Drafted",
        description:
          "Pre-admission assessment successfully synthesized into Care Plan v1 Draft.",
      });
      queryClient.invalidateQueries({
        queryKey: carePlanKeys.all,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Draft Generation Failed",
        description: error.message || "Could not synthesize care plan draft.",
        variant: "destructive",
      });
    },
  });
}

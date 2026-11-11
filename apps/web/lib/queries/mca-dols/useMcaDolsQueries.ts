import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CREATE_CAPACITY_ASSESSMENT,
  GET_RESIDENT_CAPACITY_ASSESSMENTS,
  GET_CAPACITY_ASSESSMENT,
  UPDATE_CAPACITY_ASSESSMENT,
  CREATE_DOLS_AUTHORIZATION,
  GET_RESIDENT_DOLS_AUTHORIZATIONS,
  GET_EXPIRING_DOLS,
  GET_DOLS_AUTHORIZATION,
  UPDATE_DOLS_AUTHORIZATION,
} from "@repo/endpoints";
import {
  CreateMentalCapacityAssessmentDTO,
  UpdateMentalCapacityAssessmentDTO,
  MentalCapacityAssessmentDTO,
  CreateDolsAuthorizationDTO,
  UpdateDolsAuthorizationDTO,
  DolsAuthorizationDTO,
} from "@repo/schema";
import { mcaDolsKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useGetResidentCapacityAssessmentsQuery(residentId: string) {
  return useQuery({
    queryKey: mcaDolsKeys.residentAssessments(residentId),
    queryFn: () =>
      makeAPICall<MentalCapacityAssessmentDTO[]>(
        GET_RESIDENT_CAPACITY_ASSESSMENTS,
        undefined,
        {},
        { residentId }
      ),
    enabled: !!residentId,
  });
}

export function useGetCapacityAssessmentQuery(id: string) {
  return useQuery({
    queryKey: mcaDolsKeys.assessmentDetail(id),
    queryFn: () =>
      makeAPICall<MentalCapacityAssessmentDTO>(
        GET_CAPACITY_ASSESSMENT,
        undefined,
        {},
        { id }
      ),
    enabled: !!id,
  });
}

export function useCreateCapacityAssessmentMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMentalCapacityAssessmentDTO) =>
      makeAPICall(CREATE_CAPACITY_ASSESSMENT, payload),
    onSuccess: () => {
      toast({
        title: "Assessment Recorded",
        description: "Statutory Mental Capacity Assessment (MCA 2005) saved.",
      });
      queryClient.invalidateQueries({
        queryKey: mcaDolsKeys.residentAssessments(residentId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to record mental capacity assessment",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCapacityAssessmentMutation(id: string, residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMentalCapacityAssessmentDTO) =>
      makeAPICall(UPDATE_CAPACITY_ASSESSMENT, payload, {}, { id }),
    onSuccess: () => {
      toast({
        title: "Assessment Updated",
        description: "Mental capacity assessment updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: mcaDolsKeys.assessmentDetail(id) });
      queryClient.invalidateQueries({
        queryKey: mcaDolsKeys.residentAssessments(residentId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update assessment",
        variant: "destructive",
      });
    },
  });
}

export function useGetResidentDolsQuery(residentId: string) {
  return useQuery({
    queryKey: mcaDolsKeys.residentDols(residentId),
    queryFn: () =>
      makeAPICall<DolsAuthorizationDTO[]>(
        GET_RESIDENT_DOLS_AUTHORIZATIONS,
        undefined,
        {},
        { residentId }
      ),
    enabled: !!residentId,
  });
}

export function useGetExpiringDolsQuery(daysAhead = 30) {
  return useQuery({
    queryKey: mcaDolsKeys.expiringDols(daysAhead),
    queryFn: () =>
      makeAPICall<DolsAuthorizationDTO[]>(
        GET_EXPIRING_DOLS,
        undefined,
        { daysAhead: String(daysAhead) },
        {}
      ),
  });
}

export function useGetDolsDetailQuery(id: string) {
  return useQuery({
    queryKey: mcaDolsKeys.dolsDetail(id),
    queryFn: () =>
      makeAPICall<DolsAuthorizationDTO>(
        GET_DOLS_AUTHORIZATION,
        undefined,
        {},
        { id }
      ),
    enabled: !!id,
  });
}

export function useCreateDolsMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDolsAuthorizationDTO) =>
      makeAPICall(CREATE_DOLS_AUTHORIZATION, payload),
    onSuccess: () => {
      toast({
        title: "DoLS Logged",
        description: "Deprivation of Liberty Safeguards record saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: mcaDolsKeys.residentDols(residentId) });
      queryClient.invalidateQueries({ queryKey: mcaDolsKeys.expiringDols() });
    },
    onError: (error: Error) => {
      toast({
        title: "DoLS Failed",
        description: error.message || "Failed to record DoLS authorization",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDolsMutation(id: string, residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDolsAuthorizationDTO) =>
      makeAPICall(UPDATE_DOLS_AUTHORIZATION, payload, {}, { id }),
    onSuccess: () => {
      toast({
        title: "DoLS Updated",
        description: "DoLS authorization updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: mcaDolsKeys.dolsDetail(id) });
      queryClient.invalidateQueries({ queryKey: mcaDolsKeys.residentDols(residentId) });
      queryClient.invalidateQueries({ queryKey: mcaDolsKeys.expiringDols() });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update DoLS authorization",
        variant: "destructive",
      });
    },
  });
}

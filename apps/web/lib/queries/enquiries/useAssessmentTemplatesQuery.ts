import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_ASSESSMENT_TEMPLATES,
  CREATE_ASSESSMENT_TEMPLATE,
  UPDATE_ASSESSMENT_TEMPLATE,
  DELETE_ASSESSMENT_TEMPLATE,
} from "@repo/endpoints";
import {
  AssessmentTemplateResponseDTO,
  CreateAssessmentTemplateDTO,
  UpdateAssessmentTemplateDTO,
} from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useGetAssessmentTemplatesQuery() {
  return useQuery({
    queryKey: ["assessment-templates"],
    queryFn: () =>
      makeAPICall<AssessmentTemplateResponseDTO[]>(GET_ASSESSMENT_TEMPLATES),
  });
}

export function useCreateAssessmentTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentTemplateDTO) =>
      makeAPICall<AssessmentTemplateResponseDTO>(
        CREATE_ASSESSMENT_TEMPLATE,
        data as Record<string, unknown>
      ),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["assessment-templates"] });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : "Failed to create template";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAssessmentTemplateMutation(templateId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAssessmentTemplateDTO & { id?: string }) => {
      const { id, ...data } = payload;
      const targetId = id || templateId || "";
      return makeAPICall<AssessmentTemplateResponseDTO>(
        UPDATE_ASSESSMENT_TEMPLATE,
        data as Record<string, unknown>,
        {},
        { templateId: targetId }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["assessment-templates"] });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : "Failed to update template";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAssessmentTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      makeAPICall(DELETE_ASSESSMENT_TEMPLATE, {}, {}, { templateId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["assessment-templates"] });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : "Failed to delete template";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CREATE_BODY_MAP_FINDING_ACTION,
  UPDATE_BODY_MAP_FINDING_ACTION,
  DELETE_BODY_MAP_FINDING_ACTION,
} from "@repo/endpoints";
import { bodyMapKeys } from "./keys";
import {
  CreateBodyMapFindingActionDTO,
  UpdateBodyMapFindingActionDTO,
} from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useCreateFindingActionMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      dto,
    }: {
      findingId: string;
      dto: CreateBodyMapFindingActionDTO;
    }) => {
      return makeAPICall(
        CREATE_BODY_MAP_FINDING_ACTION,
        dto as unknown as Record<string, unknown>,
        {},
        { id: findingId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bodyMapKeys.assessments(residentId),
      });
      toast({
        title: "Action Recorded",
        description: "Action has been successfully added to finding history",
      });
    },
    onError: (error: Record<string, unknown>) => {
      toast({
        title: "Error",
        description: (error.message as string) || "Failed to record action",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateFindingActionMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      actionId,
      dto,
    }: {
      findingId: string;
      actionId: string;
      dto: UpdateBodyMapFindingActionDTO;
    }) => {
      return makeAPICall(
        UPDATE_BODY_MAP_FINDING_ACTION,
        dto as unknown as Record<string, unknown>,
        {},
        { id: findingId, actionId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bodyMapKeys.assessments(residentId),
      });
      toast({
        title: "Action Updated",
        description: "Action description has been updated",
      });
    },
    onError: (error: Record<string, unknown>) => {
      toast({
        title: "Error",
        description: (error.message as string) || "Failed to update action",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteFindingActionMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      actionId,
    }: {
      findingId: string;
      actionId: string;
    }) => {
      return makeAPICall(
        DELETE_BODY_MAP_FINDING_ACTION,
        {},
        {},
        { id: findingId, actionId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bodyMapKeys.assessments(residentId),
      });
      toast({
        title: "Action Deleted",
        description: "Action has been removed from finding history",
      });
    },
    onError: (error: Record<string, unknown>) => {
      toast({
        title: "Error",
        description: (error.message as string) || "Failed to delete action",
        variant: "destructive",
      });
    },
  });
}

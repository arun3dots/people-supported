"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GET_BRANCHES, SWITCH_BRANCH } from "@repo/endpoints";
import { makeAPICall } from "../../api";
import { useAuth } from "../../context/AuthContext";

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
  status: string;
  city?: string | null;
  postcode?: string | null;
}

export const branchKeys = {
  all: ["branches"] as const,
  list: () => [...branchKeys.all, "list"] as const,
};

/** Every branch in the caller's tenant (name + id), for the branch switcher. */
export function useBranchesQuery(options?: { enabled?: boolean }) {
  return useQuery<Branch[]>({
    queryKey: branchKeys.list(),
    queryFn: () => makeAPICall<Branch[]>(GET_BRANCHES),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  });
}

/**
 * Switch the active branch. The backend rotates the access-token cookie with
 * the new `activeBranchId`, so on success we re-fetch the user and drop every
 * cached query (all list data is now branch-scoped to a different branch).
 */
export function useSwitchBranchMutation() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: (branchId: string) =>
      makeAPICall<{ success: boolean; activeBranchId: string }>(SWITCH_BRANCH, {
        branchId,
      }),
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries();
    },
  });
}

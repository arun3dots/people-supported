"use client";

import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT } from "@repo/endpoints";
import { residentKeys } from "./keys";

export function useGetResidentQuery(id: string) {
  return useQuery({
    queryKey: residentKeys.detail(id),
    queryFn: () => makeAPICall<any>(GET_RESIDENT, {}, {}, { id }),
    enabled: !!id,
  });
}

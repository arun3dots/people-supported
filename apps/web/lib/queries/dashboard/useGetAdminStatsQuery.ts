import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ADMIN_STATS } from "@repo/endpoints";

export function useGetAdminStatsQuery() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => makeAPICall(GET_ADMIN_STATS),
  });
}

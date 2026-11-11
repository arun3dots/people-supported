import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_STAFF_MEMBER, GET_STAFF } from "@repo/endpoints";
import { StaffMember } from "../../types/staff";

export function useGetStaffMemberQuery(
  id: string,
  options?: Partial<UseQueryOptions<StaffMember>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_MEMBER, id],
    queryFn: async () => {
      try {
        return await makeAPICall<StaffMember>(GET_STAFF_MEMBER, {}, {}, { id });
      } catch (error) {
        // Fallback: if the detail endpoint is unavailable, locate the member in
        // the list so the screen still renders with real data.
        console.warn(
          "Failed to fetch individual staff member, falling back to list filter",
          error,
        );
        const allStaff = await makeAPICall<StaffMember[]>(GET_STAFF);
        const staff = allStaff.find((s) => s.id === id);
        if (!staff) {
          throw new Error("Staff member not found");
        }
        return staff;
      }
    },
    ...options,
  });
}

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ROLES_LIST } from "@repo/endpoints";
import { RoleMember } from "../../types/role";
import { isSelectableStaffRole } from "../../utils/roleVisibility";

export function useGetRolesListQuery(
  options?: Partial<UseQueryOptions<RoleMember[]>>,
) {
  return useQuery({
    queryKey: [GET_ROLES_LIST],
    queryFn: async () => {
      const res = await makeAPICall<RoleMember[]>(GET_ROLES_LIST);
      const list = Array.isArray(res) ? res : [];
      return list.filter((role) => isSelectableStaffRole(role.name));
    },
    ...options,
  });
}

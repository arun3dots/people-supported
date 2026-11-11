import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_LEAVE_REQUESTS } from "@repo/endpoints";

export interface LeaveRequestItem {
  id: string;
  tenantId: string;
  staffId: string;
  type: "Annual Leave" | "Sick Leave" | "Compassionate" | "Training" | "TOIL" | "Unpaid";
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: "Pending" | "Approved" | "Declined" | "Cancelled";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    fullName: string;
    email: string;
    role?: { name: string } | null;
    profile?: {
      profilePhotoUrl?: string | null;
      phoneNumber?: string | null;
    } | null;
  } | null;
}

export function useGetLeaveRequestsQuery(
  options?: Omit<UseQueryOptions<LeaveRequestItem[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery<LeaveRequestItem[], Error>({
    queryKey: [GET_LEAVE_REQUESTS],
    queryFn: async () => {
      const response = await makeAPICall<LeaveRequestItem[]>(GET_LEAVE_REQUESTS);
      return Array.isArray(response) ? response : [];
    },
    ...options,
  });
}

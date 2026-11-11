import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_DEPARTMENTS,
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
} from "@repo/endpoints";
import { CreateDepartmentDTO, UpdateDepartmentDTO } from "@repo/schema";

interface Department {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useGetDepartmentsQuery() {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      return await makeAPICall<Department[]>(GET_DEPARTMENTS);
    },
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDepartmentDTO) => {
      return await makeAPICall<Department>(CREATE_DEPARTMENT, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDepartmentDTO }) => {
      return await makeAPICall<Department>(UPDATE_DEPARTMENT, data, {}, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<void>(DELETE_DEPARTMENT, {}, {}, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

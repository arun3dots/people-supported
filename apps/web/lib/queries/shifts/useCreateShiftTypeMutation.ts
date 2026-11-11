import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_SHIFT_TYPE } from "@repo/endpoints";
import { CreateShiftTypeDTO } from "@repo/schema";
import { ShiftType } from "../../types/shifts";

export function useCreateShiftTypeMutation(
  options?: UseMutationOptions<ShiftType, Error, CreateShiftTypeDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateShiftTypeDTO) => {
      return await makeAPICall<ShiftType>(CREATE_SHIFT_TYPE, payload);
    },
    ...options,
  });
}

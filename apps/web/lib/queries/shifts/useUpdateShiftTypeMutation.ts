import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_SHIFT_TYPE } from "@repo/endpoints";
import { CreateShiftTypeDTO } from "@repo/schema";
import { ShiftType } from "../../types/shifts";

export function useUpdateShiftTypeMutation(
  options?: UseMutationOptions<ShiftType, Error, { id: string; data: CreateShiftTypeDTO }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateShiftTypeDTO }) =>
      makeAPICall<ShiftType>(UPDATE_SHIFT_TYPE, data, {}, { id }),
    ...options,
  });
}

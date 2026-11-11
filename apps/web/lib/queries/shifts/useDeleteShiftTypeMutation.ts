import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_SHIFT_TYPE } from "@repo/endpoints";

export function useDeleteShiftTypeMutation(
  options?: UseMutationOptions<void, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await makeAPICall<void>(DELETE_SHIFT_TYPE, {}, {}, { id });
      } catch (error: unknown) {
        if (error instanceof Error) throw error;

        if (typeof error === "object" && error !== null && "message" in error) {
          const message = (error as { message?: unknown }).message;
          throw new Error(
            Array.isArray(message) ? message.join(", ") : String(message),
          );
        }

        throw new Error("Unable to delete the shift template.");
      }
    },
    ...options,
  });
}

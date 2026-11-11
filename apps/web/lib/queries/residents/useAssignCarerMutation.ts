import { useMutation } from "@tanstack/react-query";

export function useAssignCarerMutation() {
  return useMutation({
    mutationFn: async ({ residentId, carerId }: { residentId: string; carerId: string }) => {
      // Mock API call
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
  });
}

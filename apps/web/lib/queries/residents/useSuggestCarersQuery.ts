import { useQuery } from "@tanstack/react-query";

export function useSuggestCarersQuery(residentId: string) {
  return useQuery({
    queryKey: ["suggestCarers", residentId],
    queryFn: async () => {
      // Mock data for suggested carers
      return [
        { id: "c1", fullName: "Alice Smith", matchPercentage: 95 },
        { id: "c2", fullName: "Bob Jones", matchPercentage: 80 },
      ];
    },
  });
}

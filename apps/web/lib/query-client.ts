import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { cache } from "react";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // Default stale time: 5 minutes
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });

export const getQueryClient = cache(() => {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  // On client, we want a singleton
  return ((globalThis as any)._queryClient ??= makeQueryClient());
});

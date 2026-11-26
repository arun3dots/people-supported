import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_ACCESS_ROLE,
  GET_ACCESS_CONSOLE,
  UPDATE_ACCESS_MEMBERSHIP,
  UPDATE_ACCESS_ROLE,
} from "@repo/endpoints";
import type {
  AccessConsole,
  AccessMemberUpdate,
  AccessRoleCreate,
  AccessRoleUpdate,
} from "@repo/schema";
import { makeAPICall } from "../../api";

type Command =
  | { action: "create"; role: AccessRoleCreate }
  | { action: "update"; key: string; role: AccessRoleUpdate }
  | { action: "membership"; id: string; membership: AccessMemberUpdate };

const queryKey = ["access-console"] as const;

export function useAccessConsole() {
  return useQuery({
    queryKey,
    queryFn: () => makeAPICall<AccessConsole>(GET_ACCESS_CONSOLE),
    retry: false,
    gcTime: 0,
  });
}

export function useAccessConsoleMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (command: Command) => {
      if (command.action === "membership") {
        return makeAPICall<AccessConsole>(
          UPDATE_ACCESS_MEMBERSHIP,
          command.membership,
          {},
          { id: command.id },
        );
      }
      if (command.action === "update") {
        return makeAPICall<AccessConsole>(
          UPDATE_ACCESS_ROLE,
          command.role,
          {},
          { key: command.key },
        );
      }
      return makeAPICall<AccessConsole>(CREATE_ACCESS_ROLE, command.role);
    },
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
    },
    onError: async () => {
      await client.invalidateQueries({ queryKey });
    },
  });
}

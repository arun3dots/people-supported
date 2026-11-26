"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_MANAGED_STAFF,
  GET_MANAGED_STAFF,
  MANAGED_STAFF_ACTION,
} from "@repo/endpoints";
import {
  createManagedAccountSchema,
  type ManagedAccountDirectoryDTO,
} from "@repo/schema";
import { ManagedAccountsPanel } from "@repo/ui/components/ManagedAccountsPanel";
import { makeAPICall } from "../../../../../lib/api";

export default function ManagedStaffAccountsPage() {
  const enabled =
    process.env.NEXT_PUBLIC_COGNITO_PROVISIONING_ENABLED === "true";
  const client = useQueryClient();
  const key = [GET_MANAGED_STAFF];
  const query = useQuery({
    queryKey: key,
    enabled,
    queryFn: () => makeAPICall<ManagedAccountDirectoryDTO>(GET_MANAGED_STAFF),
    refetchInterval: (query) =>
      query.state.data?.accounts.some(
        (account) => account.active && account.phase !== "Activated",
      )
        ? 15_000
        : false,
  });
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Managed staff accounts
      </h1>
      {enabled && (
        <p className="text-sm text-slate-600">
          Staff receive an email verification link first. Their Cognito login
          and application access are set up after they confirm their address.
        </p>
      )}
      {!enabled ? (
        <p>Managed account provisioning is disabled.</p>
      ) : query.isPending ? (
        <p role="status">Loading managed accounts…</p>
      ) : query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <ManagedAccountsPanel
          {...query.data}
          onCreate={async (fields, requestId) => {
            const dto = createManagedAccountSchema.parse({
              ...Object.fromEntries(fields),
              requestId,
            });
            try {
              await makeAPICall(CREATE_MANAGED_STAFF, dto);
            } finally {
              await client.invalidateQueries({ queryKey: key });
            }
          }}
          onAction={async (userId, action) => {
            await makeAPICall(MANAGED_STAFF_ACTION, { action }, {}, { userId });
            await client.invalidateQueries({ queryKey: key });
          }}
        />
      )}
    </main>
  );
}

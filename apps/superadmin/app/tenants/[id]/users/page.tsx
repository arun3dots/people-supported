"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagedAccountSchema,
  type ManagedAccountDirectoryDTO,
} from "@repo/schema";
import { ManagedAccountsPanel } from "@repo/ui/components/ManagedAccountsPanel";
import { makeAPICall } from "../../../../lib/api";
import {
  CREATE_MANAGED_TENANT_USER,
  GET_MANAGED_TENANT_USERS,
  MANAGED_TENANT_USER_ACTION,
} from "../../../../lib/endpoints/tenants/endpoints";

export default function ManagedTenantUsersPage() {
  const { id } = useParams<{ id: string }>();
  const enabled =
    process.env.NEXT_PUBLIC_COGNITO_PROVISIONING_ENABLED === "true";
  const client = useQueryClient();
  const key = [GET_MANAGED_TENANT_USERS, id];
  const query = useQuery({
    queryKey: key,
    enabled,
    queryFn: () =>
      makeAPICall<ManagedAccountDirectoryDTO>(
        GET_MANAGED_TENANT_USERS,
        {},
        {},
        { id },
      ),
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
        Managed tenant users
      </h1>
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
            await makeAPICall(CREATE_MANAGED_TENANT_USER, dto, {}, { id });
            await client.invalidateQueries({ queryKey: key });
          }}
          onAction={async (userId, action) => {
            await makeAPICall(
              MANAGED_TENANT_USER_ACTION,
              { action },
              {},
              { id, userId },
            );
            await client.invalidateQueries({ queryKey: key });
          }}
        />
      )}
    </main>
  );
}

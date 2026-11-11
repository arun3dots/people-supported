"use client";

import { useQuery, type UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import type { AuditListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export interface AuditLog {
  id: string;
  tenantId?: string | null;
  userId: string;
  userEmail?: string | null;
  userFullName?: string | null;
  userRoleName?: string | null;
  categoryType: string;
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata?: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  timestamp: string;
  browser: string;
  os: string;
  device: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export type PaginatedAuditLogResponse = PaginatedResponse<AuditLog>;

export interface AuditLogFilters {
  userId?: string;
  categoryType?: string;
  actionType?: string;
  area?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Every audit log as a flat array. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedAuditLogsQuery}.
 */
export const useGetAuditLogsQuery = (
  filters: AuditLogFilters = {},
  options?: Partial<UseQueryOptions<AuditLog[]>>,
) => {
  const params: AuditListQueryInput = { ...filters, all: true };

  return useQuery<AuditLog[]>({
    queryKey: ["auditLogs", params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedAuditLogResponse | AuditLog[]>(
        "getAuditLogs",
        {},
        toQueryParams(params),
      );
      if (Array.isArray(res)) return res;
      return res?.data ?? [];
    },
    ...options,
  });
};

/** One page of audit logs plus the pagination envelope (total, totalPages, ...). */
export const useGetPaginatedAuditLogsQuery = (
  params: AuditListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedAuditLogResponse>>,
) => {
  return useQuery({
    queryKey: ["auditLogs", "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedAuditLogResponse>(
        "getAuditLogs",
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
};

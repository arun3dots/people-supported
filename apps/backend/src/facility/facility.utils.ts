/**
 * Future-proof persistence: persist every client-supplied field.
 * Protected/derived keys (tenant/branch/audit ids) are always set server-side
 * and never taken from the request body, so adding a column to a model +
 * schema automatically persists without touching this service.
 */
export function pickWritable<T extends object>(dto: T) {
  const {
    id,
    tenantId,
    branchId,
    createdAt,
    updatedAt,
    deletedAt,
    ...writable
  } = dto as Record<string, unknown>;
  return writable as Omit<
    T,
    'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt' | 'deletedAt'
  >;
}

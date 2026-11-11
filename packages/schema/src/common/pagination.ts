import { z } from "zod";

export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;

/**
 * The envelope every paginated list endpoint returns. Domain-agnostic on
 * purpose — do not re-declare this per module.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Query-string booleans arrive as the strings "true"/"false". `z.coerce.boolean()`
 * would resolve `"false"` to `true` (it is just `Boolean(input)`), so parse the
 * accepted literals explicitly instead.
 */
export const queryBoolean = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((v) => v === true || v === "true" || v === "1");

/**
 * Treat a blank/whitespace-only `?search=` as "no search" rather than an empty
 * term. Uses `.transform()` rather than `z.preprocess()` so the *input* type
 * stays `string | undefined` instead of collapsing to `unknown`.
 */
const querySearch = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

/**
 * Base list-query contract. Extend it per domain with that domain's filters and
 * its own `sortBy` union:
 *
 * ```ts
 * export const staffListQuerySchema = paginationQuerySchema.extend({
 *   roleId: z.string().optional(),
 *   sortBy: z.enum(["fullName", "createdAt"]).default("createdAt"),
 * });
 * ```
 *
 * `page`/`limit`/`sortOrder` use `.default()` WITHOUT `.optional()` so the parsed
 * output is always populated — services never need to re-default them. Callers
 * building a partial query object should use the matching `z.input<>` type.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT),
  /** Bypass pagination entirely — for dropdowns, pickers and rota grids. */
  all: queryBoolean.optional(),
  search: querySearch,
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Parsed shape seen by controllers (defaults applied).
 *
 * Services should accept `Partial<XxxListQueryDTO>` — the parsed DTO is
 * assignable to it, and it stays correct for internal callers that bypass the
 * validation pipe (`resolvePagination` re-clamps anything missing).
 */
export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;
/** Un-parsed shape web callers may send (accepts `all: "true"` from a URL). */
export type PaginationQueryInput = z.input<typeof paginationQuerySchema>;

/**
 * Runtime shape of the response envelope, for controllers that validate their
 * own output. `data` stays unknown-typed — assert the item shape per domain.
 */
export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

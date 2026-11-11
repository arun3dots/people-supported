import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  type PaginatedResponse,
} from '@repo/schema';

export interface PaginationArgs {
  page?: number;
  limit?: number;
  all?: boolean;
}

/** Resolved slice, ready to spread into a Prisma `findMany`. */
export interface PaginationSlice {
  page: number;
  limit: number;
  isAll: boolean;
  /** `undefined` in `all` mode — Prisma treats that as "no offset". */
  skip: number | undefined;
  take: number | undefined;
}

/**
 * Clamp untrusted page/limit values into a usable slice. Zod already applies
 * defaults for validated query params; this guards services called internally
 * (e.g. from another service) where the values never went through the pipe.
 */
export function resolvePagination(args: PaginationArgs = {}): PaginationSlice {
  const { page, limit, all } = args;

  const safeLimit =
    limit && limit > 0
      ? Math.min(Math.floor(limit), MAX_PAGE_LIMIT)
      : DEFAULT_PAGE_LIMIT;

  if (all === true) {
    return {
      page: 1,
      limit: safeLimit,
      isAll: true,
      skip: undefined,
      take: undefined,
    };
  }

  const safePage = page && page > 0 ? Math.floor(page) : 1;

  return {
    page: safePage,
    limit: safeLimit,
    isAll: false,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

/** Wrap rows + total in the standard envelope. */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  slice: PaginationSlice,
): PaginatedResponse<T> {
  const totalPages = slice.isAll ? 1 : Math.ceil(total / slice.limit);

  return {
    data,
    total,
    page: slice.page,
    // `limit` is documented as a positive int, so never report 0 rows-per-page.
    limit: slice.isAll ? Math.max(total, 1) : slice.limit,
    totalPages,
    hasNextPage: !slice.isAll && slice.page < totalPages,
    hasPreviousPage: !slice.isAll && slice.page > 1,
  };
}

/**
 * Run a paginated read: `count` and `findMany` in parallel, wrapped in the
 * standard envelope. In `all` mode the count query is skipped entirely — the
 * row count IS the total.
 *
 * ```ts
 * return paginate(
 *   resolvePagination(filters),
 *   (args) => prisma.user.findMany({ where, orderBy, ...args }),
 *   () => prisma.user.count({ where }),
 * );
 * ```
 */
export async function paginate<T>(
  slice: PaginationSlice,
  findMany: (args: {
    skip: number | undefined;
    take: number | undefined;
  }) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<PaginatedResponse<T>> {
  if (slice.isAll) {
    const data = await findMany({ skip: undefined, take: undefined });
    return buildPaginatedResponse(data, data.length, slice);
  }

  const [total, data] = await Promise.all([
    count(),
    findMany({ skip: slice.skip, take: slice.take }),
  ]);

  return buildPaginatedResponse(data, total, slice);
}

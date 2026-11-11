"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_LIMIT } from "@repo/schema";

export interface UseListQueryStateOptions {
  /**
   * Map of URL param name -> the "show everything" sentinel its `<Select>` uses,
   * e.g. `{ role: "All Roles", status: "All Status" }`. A filter sitting on its
   * sentinel is dropped from the URL and reported as `undefined` in
   * `filterParams`, so it is never sent to the API.
   */
  filters?: Record<string, string>;
  /** localStorage key for remembering rows-per-page. Omit to skip persistence. */
  storageKey?: string;
  defaultLimit?: number;
  /**
   * Namespace every param so multiple lists can share one URL — required for
   * tabbed pages (`paramPrefix: "units"` yields `?unitsPage=2&unitsLimit=20`).
   */
  paramPrefix?: string;
  debounceMs?: number;
}

export interface ListQueryState {
  page: number;
  limit: number;
  /** Search term for the API query — `undefined` when blank. */
  search: string | undefined;
  /** Controlled value for the search `<Input>` (updates on every keystroke). */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Filter values including sentinels — for `<Select value=...>`. */
  filters: Record<string, string>;
  /** Filter values with sentinels stripped — spread into the API query. */
  filterParams: Record<string, string | undefined>;
  setFilter: (key: string, value: string) => void;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: string) => void;
  resetFilters: () => void;
  isFiltered: boolean;
}

function toPositiveInt(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Binds a paginated list's page / limit / search / filter state to the URL query
 * string, so refreshing or sharing a link restores the exact view.
 *
 * The host component MUST be rendered inside `<Suspense>` — this hook calls
 * `useSearchParams()`, which otherwise opts the whole route out of static
 * rendering, and the one-time localStorage read assumes a client-only render.
 */
export function useListQueryState(
  options: UseListQueryStateOptions = {},
): ListQueryState {
  const {
    filters: filterConfig = {},
    storageKey,
    defaultLimit = DEFAULT_PAGE_LIMIT,
    paramPrefix,
    debounceMs = 300,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const key = useCallback(
    (name: string) =>
      paramPrefix
        ? `${paramPrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`
        : name,
    [paramPrefix],
  );

  // Latest-value refs so the commit callback never closes over a stale URL or
  // a stale filter config without re-creating itself on every render.
  const paramsStringRef = useRef(searchParams.toString());
  paramsStringRef.current = searchParams.toString();
  const configRef = useRef(filterConfig);
  configRef.current = filterConfig;

  // Read the saved rows-per-page once. Deliberately not re-read per render.
  const [storedLimit] = useState<number | null>(() => {
    if (!storageKey || typeof window === "undefined") return null;
    try {
      return toPositiveInt(window.localStorage?.getItem(storageKey)) ?? null;
    } catch {
      return null;
    }
  });

  const page = toPositiveInt(searchParams.get(key("page"))) ?? 1;
  const limit =
    toPositiveInt(searchParams.get(key("limit"))) ?? storedLimit ?? defaultLimit;
  const urlSearch = searchParams.get(key("search")) ?? "";

  const commit = useCallback(
    (
      updates: Record<string, string | number | null>,
      { replace = false }: { replace?: boolean } = {},
    ) => {
      const next = new URLSearchParams(paramsStringRef.current);
      const sentinels = configRef.current;

      Object.entries(updates).forEach(([param, value]) => {
        const isSentinel = Object.entries(sentinels).some(
          ([filterKey, sentinel]) =>
            param === key(filterKey) && value === sentinel,
        );
        if (value === null || value === "" || isSentinel) {
          next.delete(param);
        } else {
          next.set(param, String(value));
        }
      });

      const queryString = next.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [key, pathname, router],
  );

  // --- Search: debounce keystrokes, then mirror into the URL -----------------
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Adopt external URL changes (back/forward, reset) into the input.
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), debounceMs);
    return () => clearTimeout(timer);
  }, [searchInput, debounceMs]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlSearch.trim()) return;
    // `replace` so typing does not stack up browser history entries.
    commit({ [key("search")]: trimmed || null, [key("page")]: 1 }, { replace: true });
  }, [debouncedSearch, urlSearch, commit, key]);

  // --- Filters ---------------------------------------------------------------
  const filters: Record<string, string> = {};
  const filterParams: Record<string, string | undefined> = {};
  Object.entries(filterConfig).forEach(([filterKey, sentinel]) => {
    const value = searchParams.get(key(filterKey)) ?? sentinel;
    filters[filterKey] = value;
    filterParams[filterKey] = value === sentinel ? undefined : value;
  });

  const setFilter = useCallback(
    (filterKey: string, value: string) => {
      commit({ [key(filterKey)]: value, [key("page")]: 1 });
    },
    [commit, key],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      commit({ [key("page")]: nextPage });
    },
    [commit, key],
  );

  const handleLimitChange = useCallback(
    (nextLimit: string) => {
      if (storageKey && typeof window !== "undefined") {
        try {
          window.localStorage?.setItem(storageKey, nextLimit);
        } catch {
          // ignore in restricted envs
        }
      }
      commit({ [key("limit")]: nextLimit, [key("page")]: 1 });
    },
    [commit, key, storageKey],
  );

  const resetFilters = useCallback(() => {
    setSearchInput("");
    const cleared: Record<string, string | number | null> = {
      [key("search")]: null,
      [key("page")]: 1,
    };
    Object.keys(configRef.current).forEach((filterKey) => {
      cleared[key(filterKey)] = null;
    });
    commit(cleared);
  }, [commit, key]);

  const isFiltered =
    urlSearch.trim() !== "" ||
    Object.values(filterParams).some((value) => value !== undefined);

  return {
    page,
    limit,
    search: urlSearch.trim() || undefined,
    searchInput,
    setSearchInput,
    filters,
    filterParams,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
    isFiltered,
  };
}

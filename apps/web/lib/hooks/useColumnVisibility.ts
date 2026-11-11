"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface UseColumnVisibilityOptions {
  storageKey?: string;
  allColumnIds: string[];
  mandatoryColumnIds?: readonly string[];
  defaultHiddenColumnIds?: readonly string[];
}

export interface UseColumnVisibilityReturn {
  visibleColumnIds: string[];
  defaultVisibleColumnIds: string[];
  toggleColumn: (columnId: string) => void;
  applyVisibleColumns: (columnIds: string[]) => void;
  isColumnVisible: (columnId?: string) => boolean;
  resetToDefault: () => void;
  showAll: () => void;
  visibleCount: number;
  totalCount: number;
}

export function useColumnVisibility({
  storageKey,
  allColumnIds,
  mandatoryColumnIds = [],
  defaultHiddenColumnIds = [],
}: UseColumnVisibilityOptions): UseColumnVisibilityReturn {
  const allColumnIdsKey = allColumnIds.join(",");
  const defaultHiddenKey = defaultHiddenColumnIds.join(",");
  const mandatoryKey = mandatoryColumnIds.join(",");

  const defaultVisible = useMemo(() => {
    return allColumnIds.filter((id) => !defaultHiddenColumnIds.includes(id));
  }, [allColumnIdsKey, defaultHiddenKey]);

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultVisible);

  // Sync with localStorage on client mount or storageKey change
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
          // Ensure mandatory columns are always included
          const validIds = new Set<string>([
            ...parsed.filter((id) => allColumnIds.includes(id)),
            ...mandatoryColumnIds,
          ]);
          const nextArr = Array.from(validIds);
          // Only update if array contents actually differ to prevent infinite setState loops
          setVisibleColumnIds((prev) => {
            if (
              prev.length === nextArr.length &&
              prev.every((id) => nextArr.includes(id))
            ) {
              return prev;
            }
            return nextArr;
          });
        }
      }
    } catch {
      // Fall back to default on parse error
    }
  }, [storageKey, allColumnIdsKey, mandatoryKey]);

  const saveToStorage = useCallback(
    (nextIds: string[]) => {
      if (!storageKey || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextIds));
      } catch {
        // Storage quota / disabled storage fallback
      }
    },
    [storageKey],
  );

  const toggleColumn = useCallback(
    (columnId: string) => {
      // Mandatory columns cannot be toggled off
      if (mandatoryColumnIds.includes(columnId)) return;

      setVisibleColumnIds((prev) => {
        let next: string[];
        if (prev.includes(columnId)) {
          // Do not allow hiding all columns (must keep at least mandatory or 1 column)
          if (prev.length <= 1) return prev;
          next = prev.filter((id) => id !== columnId);
        } else {
          next = [...prev, columnId];
        }

        saveToStorage(next);
        return next;
      });
    },
    [mandatoryColumnIds, saveToStorage],
  );

  const isColumnVisible = useCallback(
    (columnId?: string) => {
      if (!columnId) return true;
      return visibleColumnIds.includes(columnId);
    },
    [visibleColumnIds],
  );

  const applyVisibleColumns = useCallback(
    (nextIds: string[]) => {
      const enforced = Array.from(
        new Set([
          ...nextIds.filter((id) => allColumnIds.includes(id)),
          ...mandatoryColumnIds,
        ]),
      );
      setVisibleColumnIds(enforced);
      saveToStorage(enforced);
    },
    [allColumnIds, mandatoryColumnIds, saveToStorage],
  );

  const resetToDefault = useCallback(() => {
    setVisibleColumnIds(defaultVisible);
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [defaultVisible, storageKey]);

  const showAll = useCallback(() => {
    setVisibleColumnIds(allColumnIds);
    saveToStorage(allColumnIds);
  }, [allColumnIdsKey, saveToStorage]);

  return {
    visibleColumnIds,
    defaultVisibleColumnIds: defaultVisible,
    toggleColumn,
    applyVisibleColumns,
    isColumnVisible,
    resetToDefault,
    showAll,
    visibleCount: visibleColumnIds.length,
    totalCount: allColumnIds.length,
  };
}

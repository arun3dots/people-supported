"use client";

import { useState, useEffect, useCallback } from "react";

export type ViewMode = "table" | "card";

const STORAGE_PREFIX = "view_mode_";

/**
 * useViewMode - Hook to manage and persist table/card view preferences per entity key.
 *
 * @param entityKey - Unique identifier for the entity view (e.g. "facility_units", "facility_beds")
 * @param defaultMode - Initial view mode fallback (defaults to "table")
 */
export function useViewMode(
  entityKey?: string,
  defaultMode: ViewMode = "table"
): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    if (!entityKey) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${entityKey}`);
      if (stored === "table" || stored === "card") {
        setModeState(stored);
      }
    } catch {
      // Ignore localStorage access errors (e.g. private browsing)
    }
  }, [entityKey]);

  const setMode = useCallback(
    (newMode: ViewMode) => {
      setModeState(newMode);
      if (!entityKey) return;
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${entityKey}`, newMode);
      } catch {
        // Ignore localStorage access errors
      }
    },
    [entityKey]
  );

  return [mode, setMode];
}

"use client";

import { useEffect } from "react";

const FOCUSABLE =
  'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

/**
 * Scrolls to the first field carrying a validation error and focuses it.
 * Fields opt in with `data-validation-field="<errorKey>"`.
 */
export function useScrollToFirstError(
  errors: Record<string, string> | undefined,
  fieldOrder: readonly string[],
): void {
  useEffect(() => {
    if (!errors) return;

    const firstInvalidField = fieldOrder.find((field) => errors[field]);
    if (!firstInvalidField) return;

    const field = document.querySelector<HTMLElement>(
      `[data-validation-field="${firstInvalidField}"]`,
    );
    if (!field) return;

    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field
      .querySelector<HTMLElement>(FOCUSABLE)
      ?.focus({ preventScroll: true });
  }, [errors, fieldOrder]);
}

/**
 * Drop empty/absent entries and narrow to the primitive map `makeAPICall`
 * expects, so an unset filter is omitted from the query string entirely rather
 * than sent as `?roleId=undefined`.
 */
export function toQueryParams(
  params: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    }
  });

  return result;
}

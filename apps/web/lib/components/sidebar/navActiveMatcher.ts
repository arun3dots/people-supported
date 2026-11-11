import type { NavItem, NavSubItem } from "./roleNavigation";

export interface SearchParamsReader {
  get: (name: string) => string | null;
}

function splitUrl(url: string): { path: string; query: string } {
  const [path = "", query = ""] = url.split("?");
  return { path, query };
}

function matchesQuery(
  query: string,
  searchParams: SearchParamsReader | null,
): boolean {
  if (!query) return true;
  if (!searchParams) return false;
  const expected = new URLSearchParams(query);
  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Matches a sidebar sub-navigation link against pathname + URL search params.
 * When a base-path link (e.g. `/admin/staff/rota`) shares its path with
 * query-parameterized siblings (`?tab=hours`), the base link is only active
 * when none of those query siblings match the current URL.
 */
export function isSubItemActive(
  sub: NavSubItem,
  siblings: NavSubItem[],
  pathname: string,
  searchParams: SearchParamsReader | null,
): boolean {
  if (sub.url === "#") return false;
  const { path, query } = splitUrl(sub.url);

  if (query) {
    return pathname === path && matchesQuery(query, searchParams);
  }

  const pathMatches = pathname === path || pathname.startsWith(`${path}/`);
  if (!pathMatches) return false;

  const hasMatchingQuerySibling = siblings.some((sibling) => {
    if (sibling.url === sub.url) return false;
    const siblingParts = splitUrl(sibling.url);
    return (
      Boolean(siblingParts.query) &&
      siblingParts.path === path &&
      pathname === path &&
      matchesQuery(siblingParts.query, searchParams)
    );
  });

  return !hasMatchingQuerySibling;
}

/** Checks whether a top-level item or any of its sub-items matches the current route. */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  searchParams: SearchParamsReader | null,
): boolean {
  const { path, query } = splitUrl(item.url);
  const selfActive =
    item.url !== "#" &&
    pathname === path &&
    matchesQuery(query, searchParams);

  if (selfActive) return true;
  if (!item.subItems?.length) return false;

  return item.subItems.some((sub) =>
    isSubItemActive(sub, item.subItems ?? [], pathname, searchParams),
  );
}

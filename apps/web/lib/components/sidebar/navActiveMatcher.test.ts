import { describe, it, expect } from "vitest";
import { ROLE_NAVIGATION, type NavItem } from "./roleNavigation";
import { isNavItemActive, isSubItemActive } from "./navActiveMatcher";

function findAdminItem(title: string): NavItem {
  const groups = ROLE_NAVIGATION.ADMIN ?? [];
  for (const group of groups) {
    const match = group.items.find((item) => item.title === title);
    if (match) return match;
  }
  throw new Error(`Missing ADMIN nav item: ${title}`);
}

describe("sidebar navActiveMatcher", () => {
  const rotaItem = findAdminItem("Rota Management");
  const rotaSubItems = rotaItem.subItems ?? [];
  const staffDirectoryItem = findAdminItem("Staff Directory");
  const facilityItem = findAdminItem("Properties & Schemes");
  const facilitySubItems = facilityItem.subItems ?? [];

  it("highlights only Shift Planner on /admin/staff/rota without a matching tab query", () => {
    const params = new URLSearchParams();
    const activeTitles = rotaSubItems
      .filter((sub) =>
        isSubItemActive(sub, rotaSubItems, "/admin/staff/rota", params),
      )
      .map((sub) => sub.title);

    expect(activeTitles).toEqual(["Shift Planner"]);
    expect(isNavItemActive(rotaItem, "/admin/staff/rota", params)).toBe(true);
    expect(
      isNavItemActive(staffDirectoryItem, "/admin/staff/rota", params),
    ).toBe(false);
  });

  it("highlights only Hours Summary on /admin/staff/rota?tab=hours", () => {
    const params = new URLSearchParams("tab=hours");
    const activeTitles = rotaSubItems
      .filter((sub) =>
        isSubItemActive(sub, rotaSubItems, "/admin/staff/rota", params),
      )
      .map((sub) => sub.title);

    expect(activeTitles).toEqual(["Hours Summary"]);
    expect(isNavItemActive(rotaItem, "/admin/staff/rota", params)).toBe(true);
  });

  it("highlights only Staff Allocation on /admin/staff/rota?tab=allocation", () => {
    const params = new URLSearchParams("tab=allocation");
    const activeTitles = rotaSubItems
      .filter((sub) =>
        isSubItemActive(sub, rotaSubItems, "/admin/staff/rota", params),
      )
      .map((sub) => sub.title);

    expect(activeTitles).toEqual(["Staff Allocation"]);
  });

  it("highlights only Attendance on /admin/staff/rota?tab=attendance", () => {
    const params = new URLSearchParams("tab=attendance");
    const activeTitles = rotaSubItems
      .filter((sub) =>
        isSubItemActive(sub, rotaSubItems, "/admin/staff/rota", params),
      )
      .map((sub) => sub.title);

    expect(activeTitles).toEqual(["Attendance"]);
  });

  it("highlights query-parameterized Properties & Schemes sub-items individually", () => {
    const params = new URLSearchParams("tab=schemes");
    const activeTitles = facilitySubItems
      .filter((sub) =>
        isSubItemActive(
          sub,
          facilitySubItems,
          "/admin/configuration/facility",
          params,
        ),
      )
      .map((sub) => sub.title);

    expect(activeTitles).toEqual(["Supported Living Schemes"]);
  });
});

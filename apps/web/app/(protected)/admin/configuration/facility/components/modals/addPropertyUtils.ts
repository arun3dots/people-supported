import type { PropertyRoomDraftDTO } from "@repo/schema";
import type { StaffMember } from "../../../../../../../lib/types/staff";

export function buildInitialRooms(
  count: number,
  unitConfig: string,
): PropertyRoomDraftDTO[] {
  const prefix = unitConfig.toLowerCase().includes("flat") ? "Flat" : "Room";
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    roomNumber: `${prefix} ${i + 1}`,
    name: `${prefix} ${i + 1}`,
    type: "Single",
    floor: i < 2 ? "Ground floor" : "First floor",
    weeklyRent: 158.0,
    isAccessible: i === 0,
    bedsCount: 1,
  }));
}

export function filterEligibleManagers(
  staffList: StaffMember[],
  currentManagerId?: string | null,
): StaffMember[] {
  return staffList.filter((s) => {
    if (currentManagerId && s.id === currentManagerId) return true;
    const roleName = s.role?.name?.toLowerCase() || "";
    // Only management, leadership, and admin roles may be assigned as Scheme or Property Managers
    if (
      roleName === "carer" ||
      roleName === "resident" ||
      roleName === "nurse"
    ) {
      return false;
    }
    return (
      roleName.includes("manager") ||
      roleName.includes("admin") ||
      roleName.includes("lead") ||
      roleName.includes("supervisor")
    );
  });
}


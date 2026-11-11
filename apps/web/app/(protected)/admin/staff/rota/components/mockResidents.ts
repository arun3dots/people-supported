import { z } from "zod";

export const LocalShiftSchema = z.object({
  typeId: z.string().min(1, "Shift pattern is required"),
  wingId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  bedId: z.string().optional().nullable(),
  startTime: z
    .union([z.string(), z.date()])
    .nullable()
    .refine((val) => val !== null && val !== undefined && val !== "", {
      message: "Start time and From date are required.",
    }),
  endTime: z
    .union([z.string(), z.date()])
    .nullable()
    .refine((val) => val !== null && val !== undefined && val !== "", {
      message: "End time is required.",
    }),
  status: z.enum(["Draft", "Published", "Cancelled"]).optional(),
  notes: z.string().optional().nullable(),
  userIds: z.array(z.string()).min(1, "At least one staff member is required"),
  residentIds: z
    .array(z.string())
    .min(1, "At least one resident must be assigned to schedule a shift."),
  repeatUntil: z.union([z.string(), z.date()]).optional().nullable(),
  repeatDays: z.array(z.number()).optional(),
}).refine(
  (data) => {
    if (!data.repeatUntil || !data.startTime) return true;
    const s = new Date(data.startTime);
    const u = new Date(data.repeatUntil);
    if (isNaN(s.getTime()) || isNaN(u.getTime())) return true;
    const sStr = s.toISOString().slice(0, 10);
    const uStr = u.toISOString().slice(0, 10);
    return uStr >= sStr;
  },
  {
    message: "To date cannot be earlier than From date.",
    path: ["repeatUntil"],
  }
).refine(
  (data) => {
    if (!data.startTime || !data.endTime) return true;
    const s = new Date(data.startTime);
    const e = new Date(data.endTime);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return true;
    return e.getTime() >= s.getTime();
  },
  {
    message: "End time cannot be earlier than start time.",
    path: ["endTime"],
  }
);

export const MOCK_RESIDENTS = [
  {
    id: "res-1",
    name: "Eleanor Vance",
    roomBed: "Bed: 06 | Room: 03",
    dependency: "Medium",
    conditions: ["Mental Health", "Fall Risk", "Medication"],
    status: "Unassigned",
    match: 93,
    matchLabel: "Excellent Match",
    overview: "Recommended",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    unitId: "unit-1",
    wingId: "wing-1",
    roomId: "room-1",
    bedId: "bed-1",
  },
  {
    id: "res-2",
    name: "Arthur Dent",
    roomBed: "Bed: 06 | Room: 03",
    dependency: "High",
    conditions: ["Mental Health", "Fall Risk", "Medication"],
    status: "Assigned to Sarah",
    assignedStaffId: "staff-2",
    assignedStaffName: "Sarah Jenkins",
    match: 60,
    matchLabel: "Suitable",
    overview: "Assign Anyway",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    unitId: "unit-1",
    wingId: "wing-1",
    roomId: "room-1",
    bedId: "bed-1",
  },
  {
    id: "res-3",
    name: "Clara Oswald",
    roomBed: "Bed: 06 | Room: 03",
    dependency: "High",
    conditions: ["Mental Health", "Fall Risk", "Medication"],
    status: "Unassigned",
    match: 60,
    matchLabel: "Suitable",
    overview: "Assign Anyway",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    unitId: "unit-2",
    wingId: "wing-2",
    roomId: "room-2",
    bedId: "bed-2",
  },
  {
    id: "res-4",
    name: "Harold Finch",
    roomBed: "Bed: 06 | Room: 03",
    dependency: "Medium",
    conditions: ["Mental Health", "Fall Risk", "Medication"],
    status: "Assigned to Sarah",
    assignedStaffId: "staff-2",
    assignedStaffName: "Sarah Jenkins",
    match: 85,
    matchLabel: "Good Match",
    overview: "Recommended",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    unitId: "unit-1",
    wingId: "wing-1",
    roomId: "room-1",
    bedId: "bed-1",
  },
  {
    id: "res-5",
    name: "Martha Jones",
    roomBed: "Bed: 06 | Room: 03",
    dependency: "Low",
    conditions: ["Mental Health", "Fall Risk", "Medication"],
    status: "Unassigned",
    match: 95,
    matchLabel: "Excellent Match",
    overview: "Recommended",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    unitId: "unit-2",
    wingId: "wing-2",
    roomId: "room-2",
    bedId: "bed-2",
  },
];

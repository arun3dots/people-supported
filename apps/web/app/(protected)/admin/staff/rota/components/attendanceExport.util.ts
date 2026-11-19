import { format } from "date-fns";
import type { AttendanceRecord } from "./AttendanceTable";

export function exportAttendanceTimesheetCsv(
  records: AttendanceRecord[],
  weekStart: Date,
): void {
  const escapeCsv = (val: string | number | null | undefined): string => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const headers = [
    "Date",
    "Staff Member",
    "Role",
    "Property",
    "Care Type",
    "Scheduled",
    "Clock In",
    "Clock Out",
    "Hours Logged",
    "Status",
  ];
  const csvRows = [
    headers.join(","),
    ...records.map((r) =>
      [
        r.dateLabel,
        r.staffName,
        r.staffRole,
        r.property,
        r.careType,
        r.scheduledTime,
        r.clockInTime || "",
        r.clockOutTime || "",
        r.hoursLogged ? `${r.hoursLogged}h` : "",
        r.status,
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-timesheet-${format(weekStart, "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


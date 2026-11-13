"use client";

import React from "react";
import { Edit2, MapPin, Monitor, Smartphone } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface AttendanceRecord {
  id: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  property: string;
  dateLabel: string;
  scheduledTime: string;
  careType: string;
  careTypeColor: string;
  clockInTime: string | null;
  clockInLateMinutes?: number;
  clockInMethod?: "app" | "kiosk" | "manual";
  clockOutTime: string | null;
  hoursLogged: string | null;
  status: "On time" | "Late" | "On shift" | "Not started" | "On leave" | "Absent" | "Left early";
  notes?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onAdjustRecord: (record: AttendanceRecord) => void;
}

export function AttendanceTable({
  records,
  onAdjustRecord,
}: AttendanceTableProps): React.JSX.Element {
  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "On time":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-none font-medium text-xs">On time</Badge>;
      case "Late":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none font-medium text-xs">Late</Badge>;
      case "On shift":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none font-medium text-xs">On shift</Badge>;
      case "Absent":
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-none font-medium text-xs">Absent</Badge>;
      case "Left early":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none font-medium text-xs">Left early</Badge>;
      case "On leave":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none font-medium text-xs">On leave</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-150 text-slate-600 border-none font-medium text-xs">Not started</Badge>;
    }
  };

  return (
    <Card variant="surface" border="default" className="p-5 font-sans gap-4 border-none shadow-none">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-b border-border-secondary/50 hover:bg-transparent">
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Staff Member</TableHead>
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Date</TableHead>
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Scheduled</TableHead>
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Clock In</TableHead>
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Clock Out</TableHead>
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Hours</TableHead>
              <TableHead className="py-2.5 px-3 text-md font-medium text-slate-500">Status</TableHead>
              <TableHead className="py-2.5 px-3 text-right text-md font-medium text-slate-500">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                  No attendance records found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => {
                const initials = r.staffName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow key={r.id} className="border-b border-border-secondary/30 hover:bg-white/50">
                    <TableCell className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{r.staffName}</p>
                          <p className="text-xs text-slate-500 truncate">{r.property} &bull; {r.staffRole}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{r.dateLabel}</span>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <div className="text-sm font-medium text-slate-800">{r.scheduledTime}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn("size-2 rounded-full", r.careTypeColor)} />
                        <span className="text-xs text-slate-500">{r.careType}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{r.dateLabel}</span>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      {r.clockInTime ? (
                        <div className="flex items-center gap-1.5">
                          {r.clockInMethod === "app" && <Smartphone className="size-3.5 text-slate-400" />}
                          {r.clockInMethod === "kiosk" && <Monitor className="size-3.5 text-slate-400" />}
                          {r.clockInMethod === "manual" && <MapPin className="size-3.5 text-slate-400" />}
                          <span className="text-sm font-medium text-slate-800">{r.clockInTime}</span>
                          {r.clockInLateMinutes && r.clockInLateMinutes > 0 ? (
                            <span className="text-xs font-semibold text-amber-600">+{r.clockInLateMinutes}m</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">&mdash;</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <span className="text-sm text-slate-700">{r.clockOutTime || <span className="text-slate-400">&mdash;</span>}</span>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <span className="text-sm font-medium text-slate-800">{r.hoursLogged ? `${r.hoursLogged}h` : <span className="text-slate-400">&mdash;</span>}</span>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      {getStatusBadge(r.status)}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdjustRecord(r)}
                        className="h-8 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 gap-1 cursor-pointer"
                      >
                        <Edit2 className="size-3" />
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Method Legend */}
      <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-border-secondary/40 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Smartphone className="size-3.5 text-slate-400" />
          <span>App (GPS verified)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Monitor className="size-3.5 text-slate-400" />
          <span>Property kiosk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-slate-400" />
          <span>Manual entry</span>
        </div>
      </div>
    </Card>
  );
}


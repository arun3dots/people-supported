"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui/components/ui";
import { TimeField } from "../../../../resident/admit/pre-admission/shared/fields";
import type { AttendanceRecord } from "./AttendanceTable";

interface AdjustAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
  onSave: (recordId: string, updates: Partial<AttendanceRecord>) => void;
}

export function AdjustAttendanceModal({
  open,
  onOpenChange,
  record,
  onSave,
}: AdjustAttendanceModalProps): React.JSX.Element {
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [status, setStatus] = useState<AttendanceRecord["status"]>("On time");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (record) {
      setClockIn(record.clockInTime || "");
      setClockOut(record.clockOutTime || "");
      setStatus(record.status);
      setNotes(record.notes || "");
    }
  }, [record]);

  if (!record) return <></>;

  const handleSave = () => {
    onSave(record.id, {
      clockInTime: clockIn.trim() || null,
      clockOutTime: clockOut.trim() || null,
      status,
      notes: notes.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 font-sans">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Adjust Attendance Record
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Adjust clock-in and clock-out times or log follow-up reasons for payroll accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <p className="font-semibold text-slate-900">{record.staffName}</p>
            <p className="text-xs text-slate-500">
              {record.property} &bull; Scheduled {record.scheduledTime} ({record.careType})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TimeField
              label="Clock In Time (24h)"
              value={clockIn}
              onChange={setClockIn}
              placeholder="HH:mm"
            />
            <TimeField
              label="Clock Out Time (24h)"
              value={clockOut}
              onChange={setClockOut}
              placeholder="HH:mm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Attendance Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as AttendanceRecord["status"])}>
              <SelectTrigger className="h-10 rounded-xl bg-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On time">On time</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="On shift">On shift</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Left early">Left early</SelectItem>
                <SelectItem value="Not started">Not started</SelectItem>
                <SelectItem value="On leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Follow-up Notes / Reason</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Traffic on motorway - manager approved late start"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="rounded-xl font-medium"
          >
            Save Adjustments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


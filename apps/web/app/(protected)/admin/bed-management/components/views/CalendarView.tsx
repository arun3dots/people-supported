"use client";

import { useState } from "react";
import { Bed } from "../../../../../../lib/types/facility";
import { Calendar } from "@repo/ui/components/ui/Calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/Card";
import { isSameDay, parseISO } from "date-fns";
import { Badge } from "@repo/ui/components/ui/Badge";
import { BedIcon } from "lucide-react";

interface CalendarViewProps {
  beds: Bed[];
}

export function CalendarView({ beds }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Filter beds that had an admission event on the selected date
  const admissionsOnDate = selectedDate
    ? beds.filter((bed) => {
      if (!bed.residentAdmissionDate || bed.status !== "Occupied") return false;
      return isSameDay(parseISO(bed.residentAdmissionDate), selectedDate);
    })
    : [];

  // Highlight days on the calendar that have admissions
  const admissionDates = beds
    .filter((b) => b.residentAdmissionDate && b.status === "Occupied")
    .map((b) => parseISO(b.residentAdmissionDate as string));

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Card className="w-full md:w-auto h-fit">
        <CardHeader>
          <CardTitle>Admissions Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasAdmission: admissionDates,
            }}
            modifiersStyles={{
              hasAdmission: { fontWeight: "bold", textDecoration: "underline" }
            }}
          />
        </CardContent>
      </Card>

      <Card className="flex-1 h-fit min-h-[400px]">
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Admissions on ${selectedDate.toLocaleDateString()}`
              : "Select a date to view admissions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admissionsOnDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BedIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>No admissions recorded for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admissionsOnDate.map((bed) => (
                <div key={bed.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                  <div>
                    <h4 className="font-medium text-foreground">{bed.residentName}</h4>
                    <p className="text-md text-muted-foreground mt-0.5">
                      Bed {bed.number || "Unassigned"} • Room {bed.roomNumber} • {bed.wingName}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    Admitted
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

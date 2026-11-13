"use client";

import React, { useMemo } from "react";
import { Award, Users } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";
import type { LeaveRequestItem } from "../../../../../../lib/queries/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";

interface AnnualLeaveBalancesCardProps {
  staffList: StaffMember[];
  requests: LeaveRequestItem[];
}

interface StaffLeaveBalance {
  id: string;
  name: string;
  role: string;
  allowanceDays: number;
  takenDays: number;
  bookedDays: number;
  remainingDays: number;
}

export function AnnualLeaveBalancesCard({
  staffList,
  requests,
}: AnnualLeaveBalancesCardProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  const balances: StaffLeaveBalance[] = useMemo(() => {
    return staffList.slice(0, 6).map((staff) => {
      const staffRequests = requests.filter(
        (r) => (r.staffId === staff.id || r.staff?.id === staff.id) && r.type === "Annual Leave",
      );

      let takenDays = 0;
      let bookedDays = 0;

      staffRequests.forEach((r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
        const diffDays = Math.max(
          1,
          Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        );

        if (r.status === "Approved") {
          takenDays += diffDays;
        } else if (r.status === "Pending") {
          bookedDays += diffDays;
        }
      });

      const allowanceDays = 28;
      const remainingDays = Math.max(0, allowanceDays - takenDays - bookedDays);

      return {
        id: staff.id,
        name: staff.fullName,
        role: staff.role?.name || "Staff",
        allowanceDays,
        takenDays,
        bookedDays,
        remainingDays,
      };
    });
  }, [staffList, requests]);

  return (
    <Card variant="surface" border="default" className="p-5 font-sans gap-3 border-none shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-border-secondary/50">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-primary" />
          <Text as="h2" size="md" weight="semibold" className="text-slate-900">
            Annual leave balances
          </Text>
        </div>
        <Text size="md" variant="muted">
          Leave year Apr {currentYear} &ndash; Mar {currentYear + 1}
        </Text>
      </div>

      <div className="space-y-3.5 pt-1">
        {balances.length === 0 ? (
          <div className="py-6 text-center">
            <Text size="md" variant="muted">
              No staff records found.
            </Text>
          </div>
        ) : (
          balances.map((b) => {
            const takenPct = Math.min(100, Math.round((b.takenDays / b.allowanceDays) * 100));
            const bookedPct = Math.min(
              100 - takenPct,
              Math.round((b.bookedDays / b.allowanceDays) * 100),
            );

            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-md">
                  <Text as="span" size="md" weight="medium" className="text-slate-900 truncate">
                    {b.name}
                  </Text>
                  <Text as="span" size="md" weight="medium" className="text-amber-700 shrink-0">
                    {b.remainingDays} of {b.allowanceDays} days left
                  </Text>
                </div>

                <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden flex">
                  {takenPct > 0 && (
                    <div
                      style={{ width: `${takenPct}%` }}
                      className="bg-primary h-full transition-all"
                      title={`Taken: ${b.takenDays} days`}
                    />
                  )}
                  {bookedPct > 0 && (
                    <div
                      style={{ width: `${bookedPct}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Booked: ${b.bookedDays} days`}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-border-secondary/40 text-md">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <Text size="md" variant="muted">
            Taken
          </Text>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-500" />
          <Text size="md" variant="muted">
            Booked
          </Text>
        </div>
      </div>
    </Card>
  );
}

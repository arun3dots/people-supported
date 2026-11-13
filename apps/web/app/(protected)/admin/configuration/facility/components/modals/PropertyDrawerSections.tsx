"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  DoorOpen,
  User,
} from "lucide-react";
import { format } from "date-fns";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  TabsContent,
  Text,
} from "@repo/ui/components/ui";
import type { PropertyItem } from "../../../../../../../lib/types/facility";

interface PropertyDrawerSectionsProps {
  property: PropertyItem;
  coreCharge: number;
  onViewRooms?: (property: PropertyItem) => void;
}

export function PropertyDrawerSections({
  property,
  coreCharge,
  onViewRooms,
}: PropertyDrawerSectionsProps) {
  return (
    <div className="space-y-4">
      <TabsContent value="tenancies" className="mt-0 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Text size="md" weight="semibold" className="text-slate-900">
              Individual Tenancies &amp; Units
            </Text>
            <Text size="md" variant="muted">
              Each person holds an individual tenancy agreement in this scheme.
            </Text>
          </div>
          <Badge variant="secondary" state="inactive" className="border">
            Core charge: £{coreCharge}/wk
          </Badge>
        </div>

        <div className="space-y-3">
          {property.roomTenancies.length === 0 ? (
            <Card variant="surface" className="p-0">
              <EmptyState
                icon={<DoorOpen className="size-6 text-primary" />}
                title="No rooms or tenancies configured"
                description="Add rooms to this property to track individual tenancies."
              />
            </Card>
          ) : (
            property.roomTenancies.map((room, index) => {
              const occupant =
                room.beds.find((b) => b.resident !== null)?.resident ?? null;
              const moveInLabel = occupant?.admissionDate
                ? format(new Date(occupant.admissionDate), "dd/MM/yyyy")
                : null;
              const tenancyState =
                room.tenancyStatus === "In tenancy"
                  ? "success"
                  : room.tenancyStatus === "Maintenance"
                    ? "warning"
                    : "inactive";

              return (
                <Card
                  key={room.id}
                  variant="surface"
                  border="secondary"
                  className="p-4 gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-lg bg-white border border-slate-200 text-slate-700 text-md font-medium flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Text
                            as="span"
                            size="md"
                            weight="semibold"
                            className="text-slate-900"
                          >
                            {room.roomNumber}
                          </Text>
                          <Text as="span" size="md" variant="muted">
                            · {room.floor || "Ground floor"}
                            {room.isAccessible ? " (Accessible)" : ""}
                          </Text>
                        </div>

                        {occupant ? (
                          <div className="mt-1.5 space-y-0.5">
                            <Link
                              href={`/admin/residents/${occupant.id}`}
                              className="inline-flex items-center gap-1.5 text-md font-medium text-slate-800 hover:text-primary hover:underline"
                            >
                              <User className="size-3.5 text-primary" />
                              <span>{occupant.fullName}</span>
                              <span className="font-normal text-slate-400">
                                (ID:{" "}
                                {occupant.referenceCode ||
                                  occupant.id.slice(0, 8)}
                                )
                              </span>
                            </Link>
                            <Text size="md" variant="muted">
                              Key worker:{" "}
                              {occupant.keyWorkerName || "Assigned"} ·{" "}
                              {occupant.supportHoursPerWeek ?? 24}h/wk support
                              {moveInLabel ? ` · Since ${moveInLabel}` : ""}
                            </Text>
                          </div>
                        ) : (
                          <Text size="md" variant="muted" className="mt-1">
                            {room.notes ||
                              "Void room ready; awaiting local authority referral panel decision."}
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="secondary"
                        state={tenancyState}
                        className="border"
                      >
                        {room.tenancyStatus}
                      </Badge>
                      <Text
                        as="span"
                        size="md"
                        variant="muted"
                        weight="medium"
                      >
                        {room.weeklyRent
                          ? `£${room.weeklyRent.toFixed(2)}/wk rent`
                          : "£158.00/wk rent"}
                      </Text>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </TabsContent>

      <TabsContent value="shifts" className="mt-0 space-y-4">
        <Card
          variant="secondary"
          border="secondary"
          className="p-4 gap-3 flex-row items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-primary shrink-0" />
            <div>
              <Text size="md" weight="medium" className="text-slate-900">
                Today&apos;s Shift Cover: {property.staffToday.assignedCount}/
                {property.staffToday.requiredCount} on shift
              </Text>
              <Text size="md" variant="muted">
                Live staffing allocation for {property.name}
              </Text>
            </div>
          </div>
          <Link href="/admin/staff/rota">
            <Button variant="outline" size="sm">
              Open Shift Planner
            </Button>
          </Link>
        </Card>

        {property.staffToday.shifts.length === 0 ? (
          <Card variant="surface" className="p-0">
            <EmptyState
              icon={<Clock className="size-6 text-primary" />}
              title="No active shifts scheduled specifically for this property today"
              description={`Assign shifts to ${property.name} in the Rota Shift Planner.`}
            />
          </Card>
        ) : (
          property.staffToday.shifts.map((sh) => (
            <Card
              key={sh.id}
              variant="surface"
              border="secondary"
              className="p-4 gap-3 flex-row items-center justify-between"
            >
              <div>
                <Text size="md" weight="medium" className="text-slate-900">
                  {format(new Date(sh.startTime), "HH:mm")} –{" "}
                  {format(new Date(sh.endTime), "HH:mm")}
                </Text>
                <Text size="md" variant="muted">
                  Staff:{" "}
                  {sh.staffNames.length > 0
                    ? sh.staffNames.join(", ")
                    : "Unassigned"}
                </Text>
              </div>
              <Badge variant="secondary" state="success" className="border">
                {sh.staffNames.length} assigned
              </Badge>
            </Card>
          ))
        )}
      </TabsContent>
    </div>
  );
}

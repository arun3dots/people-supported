"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Wrench,
  ShieldCheck,
  Edit3,
  DoorOpen,
} from "lucide-react";
import { format } from "date-fns";
import { Button, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyItem } from "../../../../../../../lib/types/facility";

interface PropertyDetailDrawerProps {
  property: PropertyItem | null;
  onClose: () => void;
  onEditProperty?: (property: PropertyItem) => void;
  onViewRooms?: (property: PropertyItem) => void;
}

type DrawerTab = "tenancies" | "safety" | "shifts" | "maintenance";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PropertyDetailDrawer({
  property,
  onClose,
  onEditProperty,
  onViewRooms,
}: PropertyDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("tenancies");

  if (!property) return null;

  const pd = property.parsedPropertyDetails ?? {};
  const certs = pd.safetyCertificates ?? [];
  const maintenanceRooms = property.roomTenancies.filter(
    (r) => r.tenancyStatus === "Maintenance" || r.tenancyStatus === "Void",
  );
  const housingPartner =
    pd.landlordDetails?.name ||
    property.scheme?.housingPartner ||
    "Yorkshire Housing Association";
  const teamLeader =
    pd.propertyManagerName || property.primaryContact || "Assigned Lead";
  const coreCharge = pd.landlordDetails?.coreChargePerWeek ?? 198;
  const addressLabel = [pd.streetAddress, pd.postcode]
    .filter(Boolean)
    .join(", ");
  const unitConfig = pd.unitConfiguration || pd.propertyType || "Self-contained flats";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-md font-medium text-slate-500">
              <Building2 className="size-3.5 text-emerald-800" />
              <span>
                {property.scheme?.name || "Supported Living Scheme"} · ID:{" "}
                {pd.referenceId || property.code || property.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-md font-semibold",
                  property.status === "Active"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : property.status === "Maintenance"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200",
                )}
              >
                <CheckCircle2 className="size-3" />
                {property.status === "Maintenance"
                  ? "Under maintenance"
                  : property.status}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-base shrink-0">
                {getInitials(property.name)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {property.name}
                </h2>
                <p className="text-md text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3.5 text-slate-400 shrink-0" />
                  <span>
                    {addressLabel || property.description || "Registered Home"}{" "}
                    ({unitConfig})
                  </span>
                </p>
              </div>
            </div>

            {onEditProperty && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditProperty(property)}
                className="gap-1.5 shrink-0"
              >
                <Edit3 className="size-3.5" /> Edit
              </Button>
            )}
          </div>

          {/* 3 Summary Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3">
              <p className="text-md text-slate-500">Occupancy</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {property.occupiedBeds}/{property.totalBeds} rooms (
                {property.occupancyRate}%)
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3">
              <p className="text-md text-slate-500">Housing Partner</p>
              <p
                className="text-sm font-bold text-slate-900 mt-0.5 truncate"
                title={housingPartner}
              >
                {housingPartner}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3">
              <p className="text-md text-slate-500">Team Leader</p>
              <p
                className="text-sm font-bold text-slate-900 mt-0.5 truncate"
                title={teamLeader}
              >
                {teamLeader}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-5 border-b border-slate-200 pt-1 -mb-6">
            {(
              [
                {
                  key: "tenancies",
                  label: `Rooms & Tenancies (${property.roomTenancies.length})`,
                },
                {
                  key: "safety",
                  label: `Safety Evidence (${certs.length})`,
                },
                {
                  key: "shifts",
                  label: "Shift Cover",
                },
                {
                  key: "maintenance",
                  label: `Maintenance (${property.maintenanceBeds})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-3 text-md font-bold transition-colors border-b-2 cursor-pointer",
                  activeTab === tab.key
                    ? "border-emerald-800 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "tenancies" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size="md" weight="bold" className="text-slate-900">
                    Individual Tenancies & Units
                  </Text>
                  <Text size="md" className="text-slate-500">
                    Each person holds an individual tenancy agreement in this
                    scheme.
                  </Text>
                </div>
                <span className="text-md font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Core charge: £{coreCharge}/wk
                </span>
              </div>

              <div className="space-y-3">
                {property.roomTenancies.map((room, index) => {
                  const occupant =
                    room.beds.find((b) => b.resident !== null)?.resident ??
                    null;
                  const moveInLabel = occupant?.admissionDate
                    ? format(new Date(occupant.admissionDate), "dd/MM/yyyy")
                    : null;

                  return (
                    <div
                      key={room.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-7 rounded-lg bg-slate-100 text-slate-700 text-md font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">
                                {room.roomNumber}
                              </span>
                              <span className="text-md text-slate-500">
                                · {room.floor || "Ground floor"}
                                {room.isAccessible ? " (Accessible)" : ""}
                              </span>
                            </div>

                            {occupant ? (
                              <div className="mt-1.5 space-y-0.5">
                                <Link
                                  href={`/admin/residents/${occupant.id}`}
                                  className="inline-flex items-center gap-1.5 text-md font-bold text-slate-800 hover:text-emerald-800 hover:underline"
                                >
                                  <User className="size-3.5 text-emerald-700" />
                                  <span>{occupant.fullName}</span>
                                  <span className="font-normal text-slate-400">
                                    (ID:{" "}
                                    {occupant.referenceCode ||
                                      occupant.id.slice(0, 8)}
                                    )
                                  </span>
                                </Link>
                                <p className="text-md text-slate-500">
                                  Key worker:{" "}
                                  {occupant.keyWorkerName || "Assigned"} ·{" "}
                                  {occupant.supportHoursPerWeek ?? 24}h/wk
                                  support
                                  {moveInLabel ? ` · Since ${moveInLabel}` : ""}
                                </p>
                              </div>
                            ) : (
                              <p className="text-md text-slate-500 mt-1">
                                {room.notes ||
                                  "Void room ready; awaiting local authority referral panel decision."}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-md font-semibold",
                              room.tenancyStatus === "In tenancy"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : room.tenancyStatus === "Maintenance"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200",
                            )}
                          >
                            {room.tenancyStatus}
                          </span>
                          <span className="text-md text-slate-500 font-medium">
                            {room.weeklyRent
                              ? `£${room.weeklyRent.toFixed(2)}/wk rent`
                              : "£158.00/wk rent"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "safety" && (
            <div className="space-y-3">
              <Text size="md" weight="bold" className="text-slate-900">
                Landlord Safety Evidence & Compliance Certificates
              </Text>
              {certs.map((cert, idx) => (
                <div
                  key={cert.id || idx}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="size-5 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {cert.name}
                      </p>
                      <p className="text-md text-slate-500">
                        {cert.notes || "Statutory landlord safety inspection"} ·
                        Expires: {cert.expiryDate || "Scheduled"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-md font-semibold",
                      cert.status === "On track"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : cert.status === "Due soon"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200",
                    )}
                  >
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "shifts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 text-emerald-800" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Today&apos;s Shift Cover:{" "}
                      {property.staffToday.assignedCount}/
                      {property.staffToday.requiredCount} on shift
                    </p>
                    <p className="text-md text-slate-600">
                      Live staffing allocation for {property.name}
                    </p>
                  </div>
                </div>
                <Link href="/admin/staff/rota">
                  <Button variant="outline" size="sm">
                    Open Shift Planner
                  </Button>
                </Link>
              </div>

              {property.staffToday.shifts.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-slate-200 bg-slate-50">
                  <Clock className="size-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No active shifts scheduled specifically for this property
                    today
                  </p>
                  <p className="text-md text-slate-500 mt-1">
                    Assign shifts to {property.name} in the Rota Shift Planner.
                  </p>
                </div>
              ) : (
                property.staffToday.shifts.map((sh) => (
                  <div
                    key={sh.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {format(new Date(sh.startTime), "HH:mm")} –{" "}
                        {format(new Date(sh.endTime), "HH:mm")}
                      </p>
                      <p className="text-md text-slate-500">
                        Staff:{" "}
                        {sh.staffNames.length > 0
                          ? sh.staffNames.join(", ")
                          : "Unassigned"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-md font-semibold bg-emerald-50 text-emerald-800">
                      {sh.staffNames.length} assigned
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text size="md" weight="bold" className="text-slate-900">
                  Void & Maintenance Units
                </Text>
                {onViewRooms && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewRooms(property)}
                    className="gap-1.5"
                  >
                    <DoorOpen className="size-3.5" /> Manage Rooms & Beds
                  </Button>
                )}
              </div>

              {maintenanceRooms.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-slate-200 bg-slate-50">
                  <Wrench className="size-6 text-emerald-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">
                    All units in {property.name} are active and occupied
                  </p>
                </div>
              ) : (
                maintenanceRooms.map((rm) => (
                  <div
                    key={rm.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="size-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {rm.roomNumber} · {rm.floor}
                        </p>
                        <p className="text-md text-slate-500">
                          {rm.notes || "Ready for referral or maintenance check"}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-md font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {rm.tenancyStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

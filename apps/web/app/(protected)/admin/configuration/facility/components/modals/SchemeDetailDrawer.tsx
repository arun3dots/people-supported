"use client";

import React from "react";
import { Building2, Clock, Edit3, MapPin, Users, X } from "lucide-react";
import { Badge, Button, Card, InfoField, Text } from "@repo/ui/components/ui";
import type { PropertyItem, SchemeItem } from "../../../../../../../lib/types/facility";

interface SchemeDetailDrawerProps {
  scheme: SchemeItem | null;
  properties: PropertyItem[];
  onClose: () => void;
  onEditScheme?: (scheme: SchemeItem) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function SchemeDetailDrawer({
  scheme,
  properties,
  onClose,
  onEditScheme,
}: SchemeDetailDrawerProps) {
  if (!scheme) return null;

  const linkedProperties = properties.filter((p) => p.schemeId === scheme.id);
  const statusState = scheme.status === "Active" ? "success" : "inactive";
  const targetOcc = scheme.schemeDetails?.targetOccupancy;

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
        <div className="p-6 border-b border-slate-200 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-md font-medium text-slate-500">
              <Building2 className="size-3.5 text-primary" />
              <span>
                Supported Living Scheme · ID:{" "}
                {scheme.referenceId || scheme.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onEditScheme && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditScheme(scheme)}
                  className="gap-1.5"
                >
                  <Edit3 className="size-3.5" />
                  Edit Scheme
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close scheme details"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-surface-primary-light flex items-center justify-center font-semibold text-primary text-base shrink-0">
              {getInitials(scheme.name)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Text size="lg" weight="semibold" className="text-slate-900">
                  {scheme.name}
                </Text>
                <Badge variant="secondary" state={statusState} className="border">
                  {scheme.status || "Active"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-slate-400" />
                  {scheme.location || "No location specified"}
                </span>
                {scheme.commissioningLa && (
                  <span>· {scheme.commissioningLa}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5 border border-slate-200 shadow-none">
              <Text size="xs" variant="muted">
                Properties
              </Text>
              <Text size="lg" weight="semibold" className="text-slate-900 mt-0.5">
                {scheme.totalProperties}
              </Text>
            </Card>
            <Card className="p-3.5 border border-slate-200 shadow-none">
              <Text size="xs" variant="muted">
                Rooms / Units
              </Text>
              <Text size="lg" weight="semibold" className="text-slate-900 mt-0.5">
                {scheme.totalRooms}
              </Text>
            </Card>
            <Card className="p-3.5 border border-slate-200 shadow-none">
              <Text size="xs" variant="muted">
                Occupancy
              </Text>
              <Text size="lg" weight="semibold" className="text-slate-900 mt-0.5">
                {scheme.occupiedBeds}/{scheme.totalBeds} ({scheme.occupancyRate}%)
              </Text>
            </Card>
            <Card className="p-3.5 border border-slate-200 shadow-none">
              <Text size="xs" variant="muted">
                Commissioned
              </Text>
              <Text size="lg" weight="semibold" className="text-slate-900 mt-0.5">
                {scheme.commissionedHours ? `${scheme.commissionedHours}h/wk` : "—"}
              </Text>
            </Card>
          </div>

          {/* Scheme Details */}
          <div className="space-y-3">
            <Text size="md" weight="semibold" className="text-slate-900">
              Scheme Overview
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <InfoField
                label="Housing Partner"
                value={scheme.housingPartner || "Unassigned"}
              />
              <InfoField
                label="Scheme Manager"
                value={scheme.schemeManagerName || "Unassigned"}
              />
              <InfoField
                label="Commissioning Local Authority"
                value={scheme.commissioningLa || "—"}
              />
              <InfoField
                label="Target Occupancy"
                value={targetOcc !== undefined ? `${targetOcc}%` : "—"}
              />
            </div>
            {scheme.description && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <Text size="xs" variant="muted" className="mb-1">
                  Description
                </Text>
                <Text size="sm" className="text-slate-700 leading-relaxed">
                  {scheme.description}
                </Text>
              </div>
            )}
          </div>

          {/* Linked Properties */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text size="md" weight="semibold" className="text-slate-900">
                Linked Properties ({linkedProperties.length})
              </Text>
            </div>
            {linkedProperties.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center">
                <Text size="sm" variant="muted">
                  No active properties are currently linked to this scheme.
                </Text>
              </div>
            ) : (
              <div className="space-y-2.5">
                {linkedProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="min-w-0">
                      <Text size="sm" weight="medium" className="text-slate-900 truncate">
                        {prop.name}
                      </Text>
                      <Text size="xs" variant="muted">
                        ID: {prop.parsedPropertyDetails?.referenceId || prop.code || prop.id.slice(0, 8)} ·{" "}
                        {prop.totalRooms} rooms
                      </Text>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <Text size="xs" weight="medium" className="text-slate-800 inline-flex items-center gap-1">
                          <Users className="size-3 text-emerald-700" />
                          {prop.occupiedBeds}/{prop.totalBeds}
                        </Text>
                      </div>
                      <Badge
                        variant="secondary"
                        state={prop.status === "Active" ? "success" : "inactive"}
                        className="border"
                      >
                        {prop.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="size-3.5" />
            <span>
              {scheme.commissionedHours
                ? `${scheme.commissionedHours} commissioned hours/week`
                : "No commissioned hours set"}
            </span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


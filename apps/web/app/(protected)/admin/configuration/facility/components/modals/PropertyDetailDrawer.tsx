"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2, Edit3, MapPin, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  InfoField,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from "@repo/ui/components/ui";
import type { PropertyItem } from "../../../../../../../lib/types/facility";
import { PropertyDrawerSections } from "./PropertyDrawerSections";
import {
  getPropertyManagerLabel,
  getPropertyPartnerLabel,
  getPropertySchemeLabel,
} from "../tabs/properties/propertyDisplay";

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
  const housingPartner = getPropertyPartnerLabel(property);
  const teamLeader = getPropertyManagerLabel(property);
  const coreCharge = pd.landlordDetails?.coreChargePerWeek ?? 198;
  const addressLabel = [pd.streetAddress, pd.postcode]
    .filter(Boolean)
    .join(", ");
  const unitConfig =
    pd.unitConfiguration || pd.propertyType || "Self-contained flats";
  const statusState =
    property.status === "Active"
      ? "success"
      : property.status === "Maintenance"
        ? "warning"
        : "inactive";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DrawerTab)}
          className="flex-1 flex flex-col overflow-hidden min-h-0 gap-0"
        >
          {/* Top Header */}
          <div className="p-6 pb-0 border-b border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-md font-medium text-slate-500">
                <Building2 className="size-3.5 text-primary" />
                <span>
                  {getPropertySchemeLabel(property)} · ID:{" "}
                  {pd.referenceId || property.code || property.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  state={statusState}
                  className="border gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  {property.status === "Maintenance"
                    ? "Under maintenance"
                    : property.status}
                </Badge>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close property details"
                  className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-full bg-surface-primary-light flex items-center justify-center text-primary font-medium text-base shrink-0">
                  {getInitials(property.name)}
                </div>
                <div>
                  <Text as="h2" size="xl" weight="semibold" className="text-slate-900">
                    {property.name}
                  </Text>
                  <Text size="md" variant="muted" className="flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3.5 text-slate-400 shrink-0" />
                    <span>
                      {addressLabel || property.description || "Registered Home"}{" "}
                      ({unitConfig})
                    </span>
                  </Text>
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
              <Card variant="surface" border="secondary" className="p-3 gap-0">
                <InfoField
                  label="Occupancy"
                  value={`${property.occupiedBeds}/${property.totalBeds} rooms (${property.occupancyRate}%)`}
                  valueClassName="font-medium text-slate-900"
                />
              </Card>
              <Card variant="surface" border="secondary" className="p-3 gap-0">
                <InfoField
                  label="Housing Partner"
                  value={housingPartner}
                  valueClassName="font-medium text-slate-900"
                />
              </Card>
              <Card variant="surface" border="secondary" className="p-3 gap-0">
                <InfoField
                  label="Team Leader"
                  value={teamLeader}
                  valueClassName="font-medium text-slate-900"
                />
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="-mb-px pt-1">
              <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none gap-5 flex-wrap">
                <TabsTrigger value="tenancies" className="px-0 pb-3 pt-1">
                  Rooms &amp; Tenancies ({property.roomTenancies.length})
                </TabsTrigger>
                <TabsTrigger value="safety" className="px-0 pb-3 pt-1">
                  Safety Evidence ({certs.length})
                </TabsTrigger>
                <TabsTrigger value="shifts" className="px-0 pb-3 pt-1">
                  Shift Cover
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="px-0 pb-3 pt-1">
                  Maintenance ({property.maintenanceBeds})
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <PropertyDrawerSections
            property={property}
            coreCharge={coreCharge}
            onViewRooms={onViewRooms}
          />
        </Tabs>
      </div>
    </div>
  );
}

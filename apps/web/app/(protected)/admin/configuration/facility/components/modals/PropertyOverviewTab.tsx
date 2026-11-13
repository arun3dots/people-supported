"use client";

import React from "react";
import {
  Building2,
  Home,
  MapPin,
  Shield,
  Layers,
  Phone,
  Banknote,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { Badge, Card, InfoField, TabsContent, Text } from "@repo/ui/components/ui";
import type { PropertyItem } from "../../../../../../../lib/types/facility";

interface PropertyOverviewTabProps {
  property: PropertyItem;
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  const pd = property.parsedPropertyDetails ?? {};
  const landlord = pd.landlordDetails ?? {};
  const facilities = pd.facilities ?? [];
  const accessibility = pd.featuresAndAccessibility ?? [];
  const propertyType = pd.propertyType || pd.unitConfiguration || "Self-contained flats";
  const coreCharge = landlord.coreChargePerWeek ?? 198;

  return (
    <TabsContent value="overview" className="mt-0 space-y-4">
      {/* 1. Core Property Metadata */}
      <Card variant="surface" border="secondary" className="p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="size-4 text-primary" />
          <Text size="md" weight="semibold" className="text-slate-900">
            Property Information
          </Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <InfoField
            label="Property Type"
            value={propertyType}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Supported Scheme"
            value={property.scheme?.name || "Independent / Standalone"}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Reference ID"
            value={pd.referenceId || property.code || property.id.slice(0, 8)}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Street Address"
            value={pd.streetAddress || "—"}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Postcode"
            value={pd.postcode || "—"}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Capacity (Units)"
            value={`${pd.totalCapacity || property.totalRooms || 0} units (${property.totalBeds} beds)`}
            valueClassName="font-medium text-slate-800"
          />
        </div>
      </Card>

      {/* 2. Landlord & Financial Details */}
      <Card variant="surface" border="secondary" className="p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Banknote className="size-4 text-primary" />
          <Text size="md" weight="semibold" className="text-slate-900">
            Landlord &amp; Management
          </Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <InfoField
            label="Housing Partner / Landlord"
            value={landlord.name || property.scheme?.housingPartner || "—"}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Landlord Contact Phone"
            value={landlord.phone || "—"}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Core Charge (£/wk)"
            value={`£${coreCharge}/wk`}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Property Manager"
            value={pd.propertyManagerName || property.primaryContact || "Unassigned"}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Occupancy Status"
            value={`${property.occupiedBeds}/${property.totalBeds} beds occupied (${property.occupancyRate}%)`}
            valueClassName="font-medium text-slate-800"
          />
          <InfoField
            label="Safety Evidence Status"
            value={property.safetyEvidenceStatus}
            valueClassName="font-medium text-slate-800"
          />
        </div>
        {property.notes && (
          <div className="pt-2 border-t border-slate-100">
            <Text size="xs" variant="muted" className="mb-0.5">
              Property Notes
            </Text>
            <Text size="sm" className="text-slate-700">
              {property.notes}
            </Text>
          </div>
        )}
      </Card>

      {/* 3. Facilities & Shared Amenities */}
      <Card variant="surface" border="secondary" className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Home className="size-4 text-primary" />
          <Text size="md" weight="semibold" className="text-slate-900">
            Facilities &amp; Shared Amenities ({facilities.length})
          </Text>
        </div>
        {facilities.length === 0 ? (
          <Text size="sm" variant="muted">
            No specific facilities recorded for this property.
          </Text>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {facilities.map((fac, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                state="inactive"
                className="px-2.5 py-1 text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800"
              >
                {fac}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* 4. Features & Accessibility */}
      <Card variant="surface" border="secondary" className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield className="size-4 text-primary" />
          <Text size="md" weight="semibold" className="text-slate-900">
            Features &amp; Accessibility ({accessibility.length})
          </Text>
        </div>
        {accessibility.length === 0 ? (
          <Text size="sm" variant="muted">
            No accessibility features specified for this property.
          </Text>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {accessibility.map((feat, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                state="success"
                className="px-2.5 py-1 text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-900"
              >
                <CheckCircle2 className="size-3 text-emerald-700 mr-1" />
                {feat}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </TabsContent>
  );
}


"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  Text,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from "@repo/ui/components/ui";
import { useGetIncidentsQuery } from "../../../../lib/queries/incidents";
import type { Incident } from "../../../../lib/types/incident";
import { cn } from "@repo/ui/lib/utils";
import { CarerIncidentKPICards } from "./components/CarerIncidentKPICards";

type IncidentFilterTab = "all" | "open" | "safeguarding" | "candour" | "cqc";

export default function CarerIncidentsPage() {
  const [activeTab, setActiveTab] = useState<IncidentFilterTab>("all");
  const { data: rawIncidents = [], isLoading } = useGetIncidentsQuery();

  const incidents = (Array.isArray(rawIncidents) ? rawIncidents : []) as Incident[];

  // Real Database Calculations for KPIs
  const openIncidents = incidents.filter((i) => i.status !== "Closed");
  const openCount = openIncidents.length;

  // Duty of candour applies to high-harm / Reg 20 notifiable safety incidents
  const candourIncidents = incidents.filter(
    (i) =>
      i.notes?.toLowerCase().includes("candour") ||
      i.severity === "High" ||
      i.harmLevel === "Level 3" ||
      i.harmLevel === "Severe" ||
      i.harmLevel === "Death"
  );
  const candourCount = candourIncidents.length;

  // CQC Statutory Notification (Reg 18): safeguarding, death, serious injury, police, unauthorized absence
  const cqcIncidents = incidents.filter(
    (i) =>
      i.category?.toLowerCase().includes("safeguarding") ||
      i.title?.toLowerCase().includes("safeguarding") ||
      i.severity === "High" ||
      i.harmLevel === "Level 3" ||
      i.harmLevel === "Severe" ||
      i.harmLevel === "Death" ||
      i.notes?.toLowerCase().includes("cqc")
  );
  const cqcCount = cqcIncidents.length;

  // Falls in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fallsCount = incidents.filter((i) => {
    const isFall =
      i.category?.toLowerCase() === "fall" ||
      i.title?.toLowerCase().includes("fall");
    if (!isFall) return false;
    if (!i.incidentDate) return true;
    const d = new Date(i.incidentDate);
    return isNaN(d.getTime()) || d >= thirtyDaysAgo;
  }).length;

  // Filter list by tab
  const filteredIncidents = incidents.filter((item) => {
    if (activeTab === "open") return item.status !== "Closed";
    if (activeTab === "safeguarding") {
      return (
        item.category?.toLowerCase().includes("safeguarding") ||
        item.title?.toLowerCase().includes("safeguarding") ||
        item.notes?.toLowerCase().includes("safeguarding")
      );
    }
    if (activeTab === "candour") {
      return (
        item.notes?.toLowerCase().includes("candour") ||
        item.severity === "High" ||
        item.harmLevel === "Level 3" ||
        item.harmLevel === "Severe" ||
        item.harmLevel === "Death"
      );
    }
    if (activeTab === "cqc") {
      return (
        item.category?.toLowerCase().includes("safeguarding") ||
        item.title?.toLowerCase().includes("safeguarding") ||
        item.severity === "High" ||
        item.harmLevel === "Level 3" ||
        item.harmLevel === "Severe" ||
        item.harmLevel === "Death" ||
        item.notes?.toLowerCase().includes("cqc")
      );
    }
    return true;
  });

  const getHarmBadge = (incident: Incident) => {
    const harm = incident.harmLevel || incident.severity;
    if (!harm || harm === "None" || harm === "Level 0") {
      return <Text size="md" variant="muted">None</Text>;
    }
    if (/high|level 3|severe|death/i.test(harm)) {
      return <Badge state="danger">High</Badge>;
    }
    if (/medium|level 2/i.test(harm)) {
      return <Badge state="warning">{harm}</Badge>;
    }
    return <Badge state="warning">Low</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "Closed") {
      return <Badge state="success">Closed</Badge>;
    }
    if (status === "Under Review" || status === "Under Investigation") {
      return <Badge state="info">Under Review</Badge>;
    }
    return <Badge state="danger">Open</Badge>;
  };

  const getFlags = (incident: Incident) => {
    const flags: string[] = [];
    const text = `${incident.category || ""} ${incident.title || ""} ${incident.notes || ""}`.toLowerCase();
    if (text.includes("fall")) {
      flags.push("Post-fall");
    }
    if (text.includes("safeguarding")) {
      flags.push("Safeguarding");
    }
    if (incident.severity === "High" || incident.priority === "High") {
      flags.push("High priority");
    }
    return flags;
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            Incidents & safeguarding
          </Text>
          <Text variant="subdued" size="md" weight="regular">
            Report, grade, escalate and review. Rules: RIDDOR 2013, duty of candour (Reg 20), CQC notifications (Reg 18), safeguarding (Care Act 2014 s42). Entries are append-only.
          </Text>
        </div>

        {/* Action Controls & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
          <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40">
            {(
              [
                ["all", "All"],
                ["open", "Open"],
                ["safeguarding", "Safeguarding"],
                ["candour", "Candour"],
                ["cqc", "CQC notifications"],
              ] as const
            ).map(([tabKey, tabLabel]) => {
              const isSelected = activeTab === tabKey;
              return (
                <Button
                  key={tabKey}
                  type="button"
                  variant={isSelected ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tabKey)}
                >
                  {tabLabel}
                </Button>
              );
            })}
          </div>

          <Link href="/carer/incidents/record">
            <Button
              variant="primary"
              size="default"
            >
              <Plus className="size-4" />
              Report incident
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row using UI Card & Text */}
      <CarerIncidentKPICards
        openCount={openCount}
        candourCount={candourCount}
        cqcCount={cqcCount}
        fallsCount={fallsCount}
      />

      {/* Incidents Table using centralized UI Table components */}
      <Card variant="surface" className="shadow-xs overflow-hidden p-0">
        <Table>
          <TableHeader className="bg-surface-primary-light/50 border-b border-border-secondary">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-5 font-semibold text-text-heading">ID</TableHead>
              <TableHead className="px-5 font-semibold text-text-heading">Resident</TableHead>
              <TableHead className="px-5 font-semibold text-text-heading">Type · when</TableHead>
              <TableHead className="px-5 font-semibold text-text-heading">Harm</TableHead>
              <TableHead className="px-5 font-semibold text-text-heading">Status</TableHead>
              <TableHead className="px-5 font-semibold text-text-heading">Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-text-description">
                  Loading incidents...
                </TableCell>
              </TableRow>
            ) : filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <EmptyState
                    title="No incidents found"
                    description="No incident records match the active filter criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((incident) => {
                const flags = getFlags(incident);
                const residentName = incident.resident?.fullName || "Unspecified resident";
                const room = incident.resident?.bed?.room?.roomNumber
                  ? `Room ${incident.resident.bed.room.roomNumber}`
                  : incident.resident?.bed?.number
                    ? `Bed ${incident.resident.bed.number}`
                    : incident.roomNumber
                      ? `Room ${incident.roomNumber}`
                      : "Unassigned room";
                const reporterName = incident.reportedBy?.fullName || "Staff member";
                const dateStr = incident.incidentDate
                  ? format(new Date(incident.incidentDate), "yyyy-MM-dd")
                  : "Date not recorded";
                const timeStr = incident.incidentTime || "";

                return (
                  <TableRow
                    key={incident.id}
                    className="hover:bg-surface-primary-light/20 transition-colors"
                  >
                    {/* ID + Reporter subtitle */}
                    <TableCell className="px-5 py-3.5 align-middle">
                      <Text size="md" weight="semibold">
                        {incident.incidentNumber || `INC-${incident.id.slice(0, 4)}`}
                      </Text>
                      <Text size="md" variant="muted" className="mt-0.5">
                        {reporterName}
                      </Text>
                    </TableCell>

                    {/* Resident + Room subtitle */}
                    <TableCell className="px-5 py-3.5 align-middle">
                      <Text size="md" weight="semibold">
                        {residentName}
                      </Text>
                      <Text size="md" variant="muted" className="mt-0.5">
                        {room}
                      </Text>
                    </TableCell>

                    {/* Type · when */}
                    <TableCell className="px-5 py-3.5 align-middle">
                      <Text size="md" weight="semibold">
                        {incident.category || incident.title}
                      </Text>
                      <Text size="md" variant="muted" className="mt-0.5 font-mono">
                        {dateStr} {timeStr}
                      </Text>
                    </TableCell>

                    {/* Harm */}
                    <TableCell className="px-5 py-3.5 align-middle">
                      {getHarmBadge(incident)}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-5 py-3.5 align-middle">
                      {getStatusBadge(incident.status)}
                    </TableCell>

                    {/* Flags */}
                    <TableCell className="px-5 py-3.5 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {flags.length > 0 ? (
                          flags.map((flag) => (
                            <Badge
                              key={flag}
                              state="inactive"
                              className="text-md"
                            >
                              {flag}
                            </Badge>
                          ))
                        ) : (
                          <Text size="md" variant="muted">—</Text>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

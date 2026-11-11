"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  ShieldAlert,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SummaryCardsGrid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { useGetIncidentsQuery } from "../../../../../../lib/queries/incidents";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import type { Resident } from "../../../../../../lib/types/resident";

interface ResidentIncidentsTabProps {
  resident: Resident;
}

export function ResidentIncidentsTab({
  resident,
}: ResidentIncidentsTabProps): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin =
    user?.roleName?.toLowerCase() === "admin" ||
    user?.roleName?.toLowerCase() === "manager";
  const baseRoute = isAdmin ? "/admin/incidents" : "/carer/incidents";

  const { data: allIncidents, isLoading } = useGetIncidentsQuery();

  const residentIncidents = useMemo(() => {
    const list = (allIncidents ?? []).filter((inc) => inc.residentId === resident.id);
    return list.sort(
      (a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime(),
    );
  }, [allIncidents, resident.id]);

  const counts = useMemo(() => {
    const total = residentIncidents.length;
    const open = residentIncidents.filter(
      (i) => i.status === "Open" || i.status === "Under Review",
    ).length;
    const closed = residentIncidents.filter((i) => i.status === "Closed").length;
    return { total, open, closed };
  }, [residentIncidents]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total incidents",
        value: counts.total,
        subtitle: "Recorded for this person",
        icon: <ShieldAlert className="size-5 text-slate-600" />,
        iconClassName: "bg-slate-100",
      },
      {
        title: "Open / Under review",
        value: counts.open,
        subtitle: "Active safeguarding or follow-up",
        subtitleColor: counts.open > 0 ? "text-amber-700" : undefined,
        icon: <Clock className="size-5 text-amber-700" />,
        iconClassName: "bg-amber-50",
      },
      {
        title: "Closed & resolved",
        value: counts.closed,
        subtitle: "Post-incident review completed",
        subtitleColor: "text-emerald-700",
        icon: <CheckCircle2 className="size-5 text-emerald-700" />,
        iconClassName: "bg-emerald-50",
      },
    ],
    [counts],
  );

  if (isLoading) {
    return (
      <Card
        variant="surface"
        className="py-20 flex flex-col items-center justify-center font-sans"
      >
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <Text size="sm" variant="muted">
          Loading incident records…
        </Text>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 3 KPI Summary Cards */}
      <SummaryCardsGrid
        cards={summaryCards}
        className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
      />

      {/* Incidents Table Card */}
      <Card variant="surface" className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="size-4 text-primary shrink-0" />
            <div>
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Incidents & Safeguarding Log
              </Text>
              <Text size="sm" variant="muted">
                All reported accidents, behavioural triggers, and safeguarding events
              </Text>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => router.push(`${baseRoute}?residentId=${resident.id}`)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add Incident
          </Button>
        </div>

        {residentIncidents.length === 0 ? (
          <Card variant="white" border="secondary" className="p-4">
            <EmptyState
              icon={<AlertTriangle className="size-5 text-slate-400" />}
              title="No incidents recorded"
              description="There are no open or historical incident reports for this person."
            />
          </Card>
        ) : (
          <Card variant="white" border="secondary" className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Ref #</TableHead>
                  <TableHead>Incident</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date & Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residentIncidents.map((inc) => {
                  const statusState =
                    inc.status === "Closed"
                      ? "success"
                      : inc.status === "Open"
                        ? "danger"
                        : "warning";

                  const sevState =
                    inc.priority === "High"
                      ? "danger"
                      : inc.priority === "Medium"
                        ? "warning"
                        : "inactive";

                  return (
                    <TableRow key={inc.id}>
                      <TableCell className="px-4 font-mono text-slate-600">
                        {inc.incidentNumber}
                      </TableCell>
                      <TableCell>
                        <Text size="sm" weight="medium" className="text-slate-900">
                          {inc.title}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text size="sm" className="text-slate-700">
                          {inc.category}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" state={sevState} className="border">
                          {inc.severity || inc.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Text size="sm" weight="medium" className="text-slate-800">
                            {new Date(inc.incidentDate).toLocaleDateString("en-GB")}
                          </Text>
                          <Text size="xs" variant="muted">
                            {inc.reportedBy?.fullName ?? "Support Staff"}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" state={statusState} className="border">
                          {inc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`${baseRoute}/${inc.id}`)}
                          className="gap-1"
                        >
                          View
                          <ExternalLink className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </Card>
    </div>
  );
}

"use client";

import React from "react";
import { Building2, Home } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { roundHours } from "./rotaDataUtils";

export interface HoursBreakdownRow {
  key: string;
  scheme: string;
  property: string | null;
  commissioned: number;
  planned: number;
  delivered: number;
  variance: number;
  coverage: string;
  status: "On track" | "Shortfall" | "No data";
}

interface HoursSummaryTableProps {
  viewMode: "both" | "scheme" | "property";
  rows: HoursBreakdownRow[];
  metrics: {
    required: number;
    planned: number;
    delivered: number;
    gap: number;
    coveragePercent: string;
  };
}

function getStatusBadgeState(
  status: HoursBreakdownRow["status"],
): "success" | "warning" | "inactive" {
  if (status === "On track") return "success";
  if (status === "Shortfall") return "warning";
  return "inactive";
}

export function HoursSummaryTable({
  viewMode,
  rows,
  metrics,
}: HoursSummaryTableProps): React.JSX.Element {
  const totalVariance =
    metrics.required > 0 ? roundHours(metrics.planned - metrics.required) : 0;
  const totalCoveragePct =
    metrics.required > 0
      ? ((metrics.planned / metrics.required) * 100).toFixed(1)
      : metrics.planned > 0
        ? "100.0"
        : "0.0";
  const totalStatus: HoursBreakdownRow["status"] =
    metrics.required === 0 && metrics.planned === 0
      ? "No data"
      : metrics.required > 0 && metrics.planned < metrics.required
        ? "Shortfall"
        : "On track";

  return (
    <Card
      variant="surface"
      border="default"
      className="p-5 lg:p-6 gap-0 border-none shadow-none"
    >
      <div className="pb-4 border-b border-border-secondary/50 mb-4">
        <Text as="h2" size="md" weight="semibold" className="text-slate-900">
          Hours Summary by Scheme &amp; Property
        </Text>
        <Text size="md" variant="muted">
          Compare commissioned and planned weekly support hours
        </Text>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No hours data available"
          description="Add schemes, properties, or scheduled shifts to view weekly support hours."
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border-secondary/50">
                <TableHead className="pl-3 font-medium text-slate-500">#</TableHead>
                <TableHead className="font-medium text-slate-500">Scheme</TableHead>
                {viewMode !== "scheme" && (
                  <TableHead className="font-medium text-slate-500">
                    Property
                  </TableHead>
                )}
                <TableHead className="text-right font-medium text-slate-500">
                  Commissioned / Wk
                </TableHead>
                <TableHead className="text-right font-medium text-slate-500">
                  Planned / Wk
                </TableHead>
                <TableHead className="text-right font-medium text-slate-500">
                  Variance
                </TableHead>
                <TableHead className="text-right font-medium text-slate-500">
                  Coverage (%)
                </TableHead>
                <TableHead className="pr-3 text-center font-medium text-slate-500">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.key}
                  className="border-b border-border-secondary/40 hover:bg-white/50"
                >
                  <TableCell className="pl-3 text-slate-500">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-primary shrink-0" />
                      <Text as="span" size="md" weight="medium" className="text-slate-900">
                        {row.scheme}
                      </Text>
                    </div>
                  </TableCell>
                  {viewMode !== "scheme" && (
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Home className="size-3.5 text-slate-400" />
                        {row.property || "Unassigned"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-right text-slate-700">
                    {row.commissioned > 0 ? `${row.commissioned} hrs` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    {row.planned} hrs
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.variance < 0 ? "text-rose-600" : "text-slate-700"
                    }`}
                  >
                    {row.commissioned > 0
                      ? `${row.variance > 0 ? `+${row.variance}` : row.variance} hrs`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    {row.coverage}
                  </TableCell>
                  <TableCell className="pr-3 text-center">
                    <Badge
                      variant="secondary"
                      state={getStatusBadgeState(row.status)}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="bg-white/70 text-slate-900 border-t border-border-secondary/50">
              <TableRow className="hover:bg-transparent">
                <TableCell
                  className="pl-3 font-semibold text-slate-900"
                  colSpan={viewMode !== "scheme" ? 3 : 2}
                >
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {metrics.required > 0 ? `${metrics.required} hrs` : "—"}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {metrics.planned} hrs
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    totalVariance < 0 ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  {metrics.required > 0
                    ? `${totalVariance > 0 ? `+${totalVariance}` : totalVariance} hrs`
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {totalCoveragePct}%
                </TableCell>
                <TableCell className="pr-3 text-center">
                  <Badge
                    variant="secondary"
                    state={getStatusBadgeState(totalStatus)}
                  >
                    {totalStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </Card>
  );
}

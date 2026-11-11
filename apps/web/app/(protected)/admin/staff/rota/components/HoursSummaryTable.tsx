"use client";

import React from "react";
import { Building2, Home } from "lucide-react";
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";

interface HoursSummaryTableProps {
  viewMode: "both" | "scheme" | "property";
  metrics: {
    required: number;
    planned: number;
    delivered: number;
    gap: number;
    coveragePercent: string;
  };
}

const SUMMARY_ROWS = [
  {
    id: 1,
    scheme: "North Yorkshire Supported Living",
    property: "Oak House",
    commissioned: 96,
    planned: 92,
    delivered: 91,
    variance: -5,
    coverage: "94.8%",
    status: "On track",
  },
  {
    id: 2,
    scheme: "Wharfedale Community Homes",
    property: "Birch Lane",
    commissioned: 52,
    planned: 50,
    delivered: 50,
    variance: -2,
    coverage: "96.2%",
    status: "On track",
  },
];

export function HoursSummaryTable({
  viewMode,
  metrics,
}: HoursSummaryTableProps): React.JSX.Element {
  return (
    <Card
      variant="white"
      border="secondary"
      className="gap-0 overflow-hidden p-0"
    >
      <div className="p-5 border-b border-slate-100">
        <Text as="h2" size="md" weight="semibold" className="text-slate-900">
          Hours Summary by Scheme &amp; Property
        </Text>
        <Text size="sm" variant="muted">
          Compare commissioned, planned and delivered weekly support hours
        </Text>
      </div>

      <Table>
        <TableHeader className="bg-surface-card-grey/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 font-medium text-slate-600">#</TableHead>
            <TableHead className="font-medium text-slate-600">Scheme</TableHead>
            {viewMode !== "scheme" && (
              <TableHead className="font-medium text-slate-600">
                Property
              </TableHead>
            )}
            <TableHead className="text-right font-medium text-slate-600">
              Commissioned / Wk
            </TableHead>
            <TableHead className="text-right font-medium text-slate-600">
              Planned / Wk
            </TableHead>
            <TableHead className="text-right font-medium text-slate-600">
              Delivered / Wk
            </TableHead>
            <TableHead className="text-right font-medium text-slate-600">
              Variance
            </TableHead>
            <TableHead className="text-right font-medium text-slate-600">
              Coverage (%)
            </TableHead>
            <TableHead className="pr-5 text-center font-medium text-slate-600">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {SUMMARY_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="pl-5 text-slate-500">{row.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary shrink-0" />
                  <Text as="span" size="sm" weight="medium" className="text-slate-900">
                    {row.scheme}
                  </Text>
                </div>
              </TableCell>
              {viewMode !== "scheme" && (
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <Home className="size-3.5 text-slate-400" />
                    {row.property}
                  </span>
                </TableCell>
              )}
              <TableCell className="text-right text-slate-700">
                {row.commissioned} hrs
              </TableCell>
              <TableCell className="text-right font-medium text-slate-900">
                {row.planned} hrs
              </TableCell>
              <TableCell className="text-right font-medium text-primary">
                {row.delivered} hrs
              </TableCell>
              <TableCell className="text-right font-medium text-rose-600">
                {row.variance} hrs
              </TableCell>
              <TableCell className="text-right font-medium text-slate-900">
                {row.coverage}
              </TableCell>
              <TableCell className="pr-5 text-center">
                <Badge variant="secondary" state="success" className="border">
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter className="bg-surface-card-grey text-slate-900 border-t border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableCell
              className="pl-5 font-semibold text-slate-900"
              colSpan={viewMode !== "scheme" ? 3 : 2}
            >
              Total
            </TableCell>
            <TableCell className="text-right font-semibold text-slate-900">
              {metrics.required} hrs
            </TableCell>
            <TableCell className="text-right font-semibold text-slate-900">
              {metrics.planned} hrs
            </TableCell>
            <TableCell className="text-right font-semibold text-primary">
              {metrics.delivered} hrs
            </TableCell>
            <TableCell className="text-right font-semibold text-rose-600">
              -{metrics.gap} hrs
            </TableCell>
            <TableCell className="text-right font-semibold text-slate-900">
              {metrics.coveragePercent}%
            </TableCell>
            <TableCell className="pr-5 text-center">
              <Badge variant="secondary" state="success" className="border">
                On track
              </Badge>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}

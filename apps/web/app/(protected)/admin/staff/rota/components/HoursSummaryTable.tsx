"use client";

import React from "react";
import { Building2, Home } from "lucide-react";
import { Badge, Card, Text } from "@repo/ui/components/ui";

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

export function HoursSummaryTable({
  viewMode,
  metrics,
}: HoursSummaryTableProps): React.JSX.Element {
  return (
    <Card variant="white" border="secondary" className="gap-0 overflow-hidden p-0 shadow-xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <Text as="h2" size="md" weight="semibold">
            Hours Summary by Scheme & Property
          </Text>
          <Text size="md" variant="subdued">
            Compare commissioned, planned and delivered weekly support hours
          </Text>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-md">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Scheme</th>
              {viewMode !== "scheme" && <th className="py-3 px-4">Property</th>}
              <th className="py-3 px-4 text-right">Commissioned / Wk</th>
              <th className="py-3 px-4 text-right">Planned / Wk</th>
              <th className="py-3 px-4 text-right">Delivered / Wk</th>
              <th className="py-3 px-4 text-right">Variance</th>
              <th className="py-3 px-4 text-right">Coverage (%)</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            <tr>
              <td className="py-3 px-4 font-medium text-slate-500">1</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">
                    North Yorkshire Supported Living
                  </span>
                </div>
              </td>
              {viewMode !== "scheme" && (
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <Home className="size-3 text-slate-400" /> Oak House
                  </span>
                </td>
              )}
              <td className="py-3 px-4 text-right">96 hrs</td>
              <td className="py-3 px-4 text-right font-semibold text-slate-900">
                92 hrs
              </td>
              <td className="py-3 px-4 text-right text-emerald-800">91 hrs</td>
              <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                -5 hrs
              </td>
              <td className="py-3 px-4 text-right font-semibold">94.8%</td>
              <td className="py-3 px-4 text-center">
                <Badge variant="success" className="border border-emerald-200/60 p-0 px-2 py-0.5 text-md font-medium">
                  On track
                </Badge>
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-slate-500">2</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">
                    Wharfedale Community Homes
                  </span>
                </div>
              </td>
              {viewMode !== "scheme" && (
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <Home className="size-3 text-slate-400" /> Birch Lane
                  </span>
                </td>
              )}
              <td className="py-3 px-4 text-right">52 hrs</td>
              <td className="py-3 px-4 text-right font-semibold text-slate-900">
                50 hrs
              </td>
              <td className="py-3 px-4 text-right text-emerald-800">50 hrs</td>
              <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                -2 hrs
              </td>
              <td className="py-3 px-4 text-right font-semibold">96.2%</td>
              <td className="py-3 px-4 text-center">
                <Badge variant="success" className="border border-emerald-200/60 p-0 px-2 py-0.5 text-md font-medium">
                  On track
                </Badge>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
              <td className="py-3 px-4" colSpan={viewMode !== "scheme" ? 3 : 2}>
                Total
              </td>
              <td className="py-3 px-4 text-right">{metrics.required} hrs</td>
              <td className="py-3 px-4 text-right">{metrics.planned} hrs</td>
              <td className="py-3 px-4 text-right text-emerald-800">
                {metrics.delivered} hrs
              </td>
              <td className="py-3 px-4 text-right text-rose-600">
                -{metrics.gap} hrs
              </td>
              <td className="py-3 px-4 text-right">
                {metrics.coveragePercent}%
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant="success" className="border border-emerald-200/60 p-0 px-2 py-0.5 text-md font-medium">
                  On track
                </Badge>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

"use client";

import React from "react";
import { Card, Text } from "@repo/ui/components/ui";

export interface DayHoursPoint {
  day: string;
  req: number;
  plan: number;
  del: number;
  offCount: number;
}

interface HoursSummaryChartsProps {
  days: DayHoursPoint[];
  metrics: {
    required: number;
    planned: number;
    delivered: number;
    gap: number;
    offDays: number;
    coveragePercent: string;
  };
}

export function HoursSummaryCharts({
  days,
  metrics,
}: HoursSummaryChartsProps): React.JSX.Element {
  const maxDayHours = Math.max(
    1,
    ...days.flatMap((d) => [d.req, d.plan, d.del]),
  );
  const hasAnyHours = days.some(
    (d) => d.req > 0 || d.plan > 0 || d.del > 0 || d.offCount > 0,
  );
  const clampedCoverage = Math.min(
    100,
    Math.max(0, Number.parseFloat(metrics.coveragePercent) || 0),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card variant="surface" className="lg:col-span-2 p-5 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <Text as="h2" size="md" weight="semibold" className="text-slate-900">
              Weekly Hours Comparison
            </Text>
            <Text size="md" variant="muted">
              Daily commissioned (required), planned (staff) and delivered (actual) hours
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Text as="span" size="md" weight="medium" className="flex items-center gap-1.5 text-slate-600">
              <span className="size-2.5 rounded-full bg-emerald-600 inline-block" /> Commissioned
            </Text>
            <Text as="span" size="md" weight="medium" className="flex items-center gap-1.5 text-slate-600">
              <span className="size-2.5 rounded-full bg-primary inline-block" /> Planned
            </Text>
            <Text as="span" size="md" weight="medium" className="flex items-center gap-1.5 text-slate-600">
              <span className="size-2.5 rounded-full bg-blue-600 inline-block" /> Delivered
            </Text>
          </div>
        </div>

        <Card
          variant="white"
          border="default"
          className="p-4 pt-6 flex-row items-end justify-between gap-3 h-52 shadow-none"
        >
          {!hasAnyHours ? (
            <div className="w-full h-full flex items-center justify-center">
              <Text size="md" variant="muted">
                No commissioned or scheduled hours recorded for this week.
              </Text>
            </div>
          ) : (
            days.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <div className="w-full flex items-end justify-center gap-1.5 h-36">
                  <div
                    title={`Commissioned: ${d.req} hrs`}
                    style={{ height: `${(d.req / maxDayHours) * 100}%` }}
                    className="w-3 bg-emerald-600 rounded-t-sm"
                  />
                  <div
                    title={`Planned: ${d.plan} hrs`}
                    style={{ height: `${(d.plan / maxDayHours) * 100}%` }}
                    className="w-3 bg-primary rounded-t-sm"
                  />
                  <div
                    title={`Delivered: ${d.del} hrs`}
                    style={{ height: `${(d.del / maxDayHours) * 100}%` }}
                    className="w-3 bg-blue-600 rounded-t-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Text as="span" size="md" weight="medium" variant="muted">
                    {d.day}
                  </Text>
                  {d.offCount > 0 && (
                    <span
                      title={`${d.offCount} staff off / rest day`}
                      className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
                    >
                      {d.offCount} off
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      </Card>

      <Card variant="surface" className="p-5 justify-between gap-4">
        <div>
          <Text as="h2" size="md" weight="semibold" className="text-slate-900">
            Overall Coverage
          </Text>
          <Text size="md" variant="muted">
            Delivered support hours vs target
          </Text>
        </div>

        <div className="flex items-center justify-center my-2">
          <div className="relative size-36 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {clampedCoverage > 0 && (
                <path
                  className="text-primary"
                  strokeDasharray={`${clampedCoverage}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center">
              <Text as="span" size="2xl" weight="semibold" className="text-slate-900">
                {metrics.coveragePercent}%
              </Text>
              <Text as="span" size="md" variant="muted">
                Coverage
              </Text>
            </div>
          </div>
        </div>

        <Card variant="white" border="default" className="p-3.5 gap-2 shadow-none">
          <div className="flex justify-between">
            <Text as="span" size="md" variant="muted">
              Planned Hours
            </Text>
            <Text as="span" size="md" weight="medium" className="text-slate-900">
              {metrics.planned} hrs
            </Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" size="md" variant="muted">
              Delivered Hours
            </Text>
            <Text as="span" size="md" weight="medium" className="text-slate-900">
              {metrics.delivered} hrs
            </Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" size="md" variant="muted">
              Variance (Gap)
            </Text>
            <Text as="span" size="md" weight="medium" className="text-amber-700">
              {metrics.gap} hrs
            </Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" size="md" variant="muted">
              Required Hours
            </Text>
            <Text as="span" size="md" weight="medium" className="text-slate-900">
              {metrics.required} hrs
            </Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" size="md" variant="muted">
              Off / Rest Days
            </Text>
            <Text as="span" size="md" weight="medium" className="text-slate-700">
              {metrics.offDays} {metrics.offDays === 1 ? "shift" : "shifts"}
            </Text>
          </div>
        </Card>
      </Card>
    </div>
  );
}

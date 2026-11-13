"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowUp, ArrowDown, ChevronDown, Info } from "lucide-react";
import { Card, Text, Button, Separator } from "@repo/ui/components/ui";
import {
  useGetFinanceStatsQuery,
  useGetInvoicesQuery,
  useGetExpensesQuery,
} from "../../../../../lib/queries/finance/useFinanceQueries";
import type { InvoiceResponse, ExpenseResponse } from "../../../../../lib/queries/finance/types";

function formatCurrency(val?: number): string {
  if (val === undefined || val === null) return "£0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatShortCurrency(val: number): string {
  if (val >= 1000000) return `£${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `£${Math.round(val / 1000)}k`;
  return `£${Math.round(val)}`;
}

export function FinancialOverviewCard() {
  const { data: stats, isLoading: isLoadingStats } = useGetFinanceStatsQuery();
  const { data: invoices } = useGetInvoicesQuery();
  const { data: expenses } = useGetExpensesQuery();

  // SVG Donut Calculations
  const radius = 55;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Animation trigger state
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 1. Metrics from DB
  const totalRevenue = stats?.totalInvoiced ?? stats?.totalCollected ?? 0;
  const totalOutstanding = stats?.totalOutstanding ?? 0;
  const overdueCount = stats?.overdueCount ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const expensesCount = stats?.expensesCount ?? 0;

  // 2. Compute Weekly Revenue Trend from DB Invoices
  const { points, pathD, yAxisLabels } = useMemo(() => {
    const now = new Date();
    const weeks: [number, number, number, number, number] = [0, 0, 0, 0, 0];

    if (invoices && invoices.length > 0) {
      invoices.forEach((inv: InvoiceResponse) => {
        const d = new Date(inv.issuedDate);
        const day = d.getDate();
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          if (day <= 7) weeks[0] += inv.amount;
          else if (day <= 14) weeks[1] += inv.amount;
          else if (day <= 21) weeks[2] += inv.amount;
          else if (day <= 28) weeks[3] += inv.amount;
          else weeks[4] += inv.amount;
        } else {
          weeks[0] += inv.amount / 4;
        }
      });
    }

    const maxVal = Math.max(...weeks, 5000);

    const pts = weeks.map((val, idx) => {
      const x = 10 + idx * 80;
      const normalizedY = 105 - (val / maxVal) * 90;
      return { x, y: Math.max(10, Math.min(105, normalizedY)) };
    });

    const defaultPoints = [
      { x: 10, y: 98 },
      { x: 90, y: 60 },
      { x: 170, y: 22 },
      { x: 250, y: 35 },
      { x: 330, y: 8 },
    ];

    const p0 = pts[0] ?? defaultPoints[0]!;
    const p1 = pts[1] ?? defaultPoints[1]!;
    const p2 = pts[2] ?? defaultPoints[2]!;
    const p3 = pts[3] ?? defaultPoints[3]!;
    const p4 = pts[4] ?? defaultPoints[4]!;

    const dPath =
      `M ${p0.x} ${p0.y} ` +
      `C ${p0.x + 30} ${p0.y}, ${p1.x - 30} ${p1.y}, ${p1.x} ${p1.y} ` +
      `C ${p1.x + 30} ${p1.y}, ${p2.x - 30} ${p2.y}, ${p2.x} ${p2.y} ` +
      `C ${p2.x + 30} ${p2.y}, ${p3.x - 30} ${p3.y}, ${p3.x} ${p3.y} ` +
      `C ${p3.x + 30} ${p3.y}, ${p4.x - 30} ${p4.y}, ${p4.x} ${p4.y}`;

    const yLabels = [
      formatShortCurrency(maxVal),
      formatShortCurrency(maxVal * 0.75),
      formatShortCurrency(maxVal * 0.5),
      formatShortCurrency(maxVal * 0.25),
      "£0",
    ];

    return { points: pts, pathD: dPath, yAxisLabels: yLabels };
  }, [invoices]);

  // 3. Compute Expense Breakdown Percentages from DB Expenses
  const { staffPct, suppliesPct, facilityPct, adminPct } = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { staffPct: 62, suppliesPct: 16, facilityPct: 11, adminPct: 11 };
    }

    let staff = 0;
    let supplies = 0;
    let facility = 0;
    let admin = 0;

    expenses.forEach((exp: ExpenseResponse) => {
      const cat = exp.category.toLowerCase();
      if (cat.includes("staff") || cat.includes("payroll") || cat.includes("salary")) {
        staff += exp.amount;
      } else if (cat.includes("suppl") || cat.includes("care") || cat.includes("medical")) {
        supplies += exp.amount;
      } else if (cat.includes("facilit") || cat.includes("rent") || cat.includes("utility")) {
        facility += exp.amount;
      } else {
        admin += exp.amount;
      }
    });

    const totalExp = staff + supplies + facility + admin;
    if (totalExp === 0) {
      return { staffPct: 62, suppliesPct: 16, facilityPct: 11, adminPct: 11 };
    }

    const sPct = Math.round((staff / totalExp) * 100);
    const supPct = Math.round((supplies / totalExp) * 100);
    const fPct = Math.round((facility / totalExp) * 100);
    const aPct = Math.max(0, 100 - sPct - supPct - fPct);

    return { staffPct: sPct, suppliesPct: supPct, facilityPct: fPct, adminPct: aPct };
  }, [expenses]);

  // Calculate SVG stroke offsets for Donut chart
  const staffOffset = 0;
  const suppliesOffset = -circumference * (staffPct / 100);
  const facilityOffset = -circumference * ((staffPct + suppliesPct) / 100);
  const adminOffset = -circumference * ((staffPct + suppliesPct + facilityPct) / 100);

  return (
    <Card
      variant="surface"
      border="default"
      className="w-full h-auto flex flex-col justify-between box-border overflow-hidden"
    >
      {/* Top Bar Header */}
      <div className="w-full flex flex-row items-center justify-between pb-4 gap-2">
        <div className="flex items-center gap-[5px]">
          <Text as="h3" size="md" weight="medium" className="leading-tight">
            Revenue & Financial Overview
          </Text>
        </div>

        {/* <Button
          variant="outline"
          size="sm"
          className="gap-0"
        >
          <Text size="md" className="mr-2">
            This Month
          </Text>
          <ChevronDown className="w-[16px] h-[16px] text-[#000000]" />
        </Button> */}
      </div>

      {/* Main Container */}
      <div className="w-full flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-8 xl:gap-[50px]">

        {/* ==================== LEFT COLUMN: Metrics ==================== */}
        <div className="w-full lg:w-[220px] shrink-0 flex flex-col sm:flex-row lg:flex-col justify-between items-stretch gap-4 sm:gap-6 lg:gap-4">
          {/* Total Revenue */}
          <div className="flex flex-col gap-[8px] sm:gap-[10px] flex-1 justify-center">
            <Text size="md" className="leading-[18px]">
              Total Revenue
            </Text>
            <Text size="md" weight="medium" className="leading-[24px]">
              {isLoadingStats ? "..." : formatCurrency(totalRevenue)}
            </Text>
            <div className="flex items-center gap-[5px]">
              <ArrowUp className="w-[16px] h-[16px] text-[#1E7735]" />
              <Text size="md" variant="success" className="leading-[10px]">
                Invoiced to date
              </Text>
            </div>
          </div>

          {/* Separator between Metrics */}
          <Separator
            orientation="horizontal"
            className="h-[1px] bg-[#B0B0B0]/40 my-auto flex sm:hidden lg:flex"
          />
          <Separator
            orientation="vertical"
            className="w-[1px] bg-[#B0B0B0]/40 my-auto hidden sm:flex lg:hidden"
          />

          {/* Outstanding Invoices */}
          <div className="flex flex-col gap-[8px] sm:gap-[10px] flex-1 justify-center">
            <Text size="md" className="leading-[18px]">
              Outstanding Invoices
            </Text>
            <Text size="md" weight="medium" className="leading-[24px]">
              {isLoadingStats ? "..." : formatCurrency(totalOutstanding)}
            </Text>
            <div className="flex items-center gap-[5px]">
              <ArrowDown className="w-[16px] h-[16px] text-[#ED2115]" />
              <Text size="md" variant="error" className="leading-[10px]">
                {overdueCount} overdue invoices
              </Text>
            </div>
          </div>
          {/* Separator between Metrics */}
          <Separator
            orientation="horizontal"
            className="h-[1px] bg-[#B0B0B0]/40 my-auto flex sm:hidden lg:flex"
          />
          <Separator
            orientation="vertical"
            className="w-[1px] bg-[#B0B0B0]/40 my-auto hidden sm:flex lg:hidden"
          />
          {/* Total Expenses */}
          <div className="flex flex-col gap-[8px] sm:gap-[10px] flex-1 justify-center">
            <Text size="md" className="leading-[18px]">
              Total Expenses
            </Text>
            <Text size="md" weight="medium" className="leading-[24px]">
              {isLoadingStats ? "..." : formatCurrency(totalExpenses)}
            </Text>
            <div className="flex items-center gap-[5px]">
              <ArrowDown className="w-[16px] h-[16px] text-[#ED2115]" />
              <Text size="md" variant="error" className="leading-[10px]">
                {expensesCount} expense records
              </Text>
            </div>
          </div>
        </div>

        {/* Vertical Separator Line between Left Column & Trend Chart */}
        <div className="hidden lg:block w-[1px] bg-[#B0B0B0]/40 shrink-0 self-stretch my-1" />

        {/* ==================== MIDDLE COLUMN: Revenue Trend ==================== */}
        <div className="w-full lg:max-w-[388px] min-h-[197px] flex-1 flex flex-col justify-start gap-5">
          {/* Title Header */}
          <div className="w-full h-[15px] flex items-center mb-2 lg:mb-0">
            <Text size="md" className="leading-[18px]">
              Revenue Trend
            </Text>
          </div>

          {/* Chart Body */}
          <div className="w-full h-[162px] flex flex-col justify-between items-end">
            {/* Plot Area */}
            <div className="w-full h-[129px] flex flex-row items-center gap-2 sm:gap-[13px]">
              {/* Y-Axis Labels */}
              <div className="w-[38px] h-[129px] flex flex-col justify-between items-start shrink-0">
                {yAxisLabels.map((lbl, idx) => (
                  <Text
                    key={idx}
                    size="md"
                    className="w-full text-right leading-[15px]"
                  >
                    {lbl}
                  </Text>
                ))}
              </div>

              {/* Grid and Spline Canvas */}
              <div className="flex-1 h-[120px] relative">
                {/* Grid Lines */}
                <div className="w-full h-[120px] flex flex-col justify-between absolute inset-0 pointer-events-none">
                  <div className="w-full h-[1px] bg-[#B0B0B0]/30" />
                  <div className="w-full h-[1px] bg-[#B0B0B0]/30" />
                  <div className="w-full h-[1px] bg-[#B0B0B0]/30" />
                  <div className="w-full h-[1px] bg-[#B0B0B0]/30" />
                  <div className="w-full h-[1px] bg-[#B0B0B0]/30" />
                </div>

                {/* Scalable Spline Path */}
                <svg
                  className="w-full h-full overflow-visible relative z-10"
                  viewBox="0 0 337 120"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d={pathD}
                    stroke="#6C958D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="500"
                    strokeDashoffset={isLoaded ? 0 : 500}
                    style={{
                      transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#6C958D"
                      className="transition-opacity duration-500"
                      style={{ opacity: isLoaded ? 1 : 0 }}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="w-full pl-[46px] h-[33px] grid grid-cols-5 items-center gap-1">
              {["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"].map((w) => (
                <Text key={w} size="md" className="text-center">
                  {w}
                </Text>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: Expense Breakdown ==================== */}
        <div className="w-full lg:max-w-[358px] flex-1 flex flex-col gap-[18px]">
          {/* Section Title */}
          <div className="w-full h-[15px] flex items-center">
            <Text size="md" className="leading-[18px]">
              Expense Breakdown
            </Text>
          </div>

          {/* Donut Chart & Legend Container */}
          <div className="w-full flex flex-wrap xs:flex-nowrap items-center justify-center xs:justify-start gap-4 sm:gap-[18.36px]">

            {/* Flexible Scaling Donut Chart Container */}
            <div className="w-[120px] h-[120px] sm:w-[143.2px] sm:h-[143.2px] relative shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 143.2 143.2">
                <circle
                  cx="71.6"
                  cy="71.6"
                  r={radius}
                  fill="transparent"
                  stroke="#4A706A"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference * (staffPct / 100)} ${circumference * (1 - staffPct / 100)}`}
                  strokeDashoffset={isLoaded ? staffOffset : circumference}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
                <circle
                  cx="71.6"
                  cy="71.6"
                  r={radius}
                  fill="transparent"
                  stroke="#D9B498"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference * (suppliesPct / 100)} ${circumference * (1 - suppliesPct / 100)}`}
                  strokeDashoffset={isLoaded ? suppliesOffset : circumference}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
                <circle
                  cx="71.6"
                  cy="71.6"
                  r={radius}
                  fill="transparent"
                  stroke="#E8D2C0"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference * (facilityPct / 100)} ${circumference * (1 - facilityPct / 100)}`}
                  strokeDashoffset={isLoaded ? facilityOffset : circumference}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
                <circle
                  cx="71.6"
                  cy="71.6"
                  r={radius}
                  fill="transparent"
                  stroke="#BC734E"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference * (adminPct / 100)} ${circumference * (1 - adminPct / 100)}`}
                  strokeDashoffset={isLoaded ? adminOffset : circumference}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
              </svg>
            </div>

            {/* Legend List */}
            <div className="w-full xs:w-auto flex-1 min-w-[150px] max-w-[220px] flex flex-col gap-1 justify-center">
              {/* Row 1: Staff Costs */}
              <div className="w-full h-7 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-xs bg-[#4A706A] shrink-0" />
                  <Text size="md" className="leading-[15px]">
                    Staff Costs
                  </Text>
                </div>
                <Text size="md" className="leading-[15px]">
                  {staffPct}%
                </Text>
              </div>

              {/* Row 2: Care Supplies */}
              <div className="w-full h-7 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-xs bg-[#D9B498] shrink-0" />
                  <Text size="md" className="leading-[15px]">
                    Care Supplies
                  </Text>
                </div>
                <Text size="md" className="leading-[15px]">
                  {suppliesPct}%
                </Text>
              </div>

              {/* Row 3: Facility Costs */}
              <div className="w-full h-7 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-xs bg-[#E8D2C0] shrink-0" />
                  <Text size="md" className="leading-[15px]">
                    Facility Costs
                  </Text>
                </div>
                <Text size="md" className="leading-[15px]">
                  {facilityPct}%
                </Text>
              </div>

              {/* Row 4: Admin & other */}
              <div className="w-full h-7 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-xs bg-[#BC734E] shrink-0" />
                  <Text size="md" className="leading-[15px]">
                    Admin & other
                  </Text>
                </div>
                <Text size="md" className="leading-[15px]">
                  {adminPct}%
                </Text>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Card>
  );
}
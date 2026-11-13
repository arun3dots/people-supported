"use client";

import React from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@repo/ui/components/ui/Table";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Button } from "@repo/ui/components/ui/Button";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/Avatar";
import type { ComplianceReviewItemDTO } from "@repo/schema";

interface ReviewTableProps {
  items: ComplianceReviewItemDTO[];
  isLoading: boolean;
  page?: number;
  limit?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function ReviewTable({
  items,
  isLoading,
  page = 1,
  limit = 15,
}: ReviewTableProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100">
        <Loader2 className="size-6 text-[#4a706a] animate-spin mb-2" />
        <p className="text-sm font-medium text-slate-500">Loading compliance reviews...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 text-center">
        <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle2 className="size-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">No Expiries Due</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          All care plans, staff certifications, and medications are up to date within the selected timeframe.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow>
            <TableHead className="w-12 text-xs font-semibold text-slate-600 py-3 text-center">#</TableHead>
            <TableHead className="text-xs font-semibold text-slate-600 py-3">Person</TableHead>
            <TableHead className="text-xs font-semibold text-slate-600 py-3">Category</TableHead>
            <TableHead className="text-xs font-semibold text-slate-600 py-3">Item & Details</TableHead>
            <TableHead className="text-xs font-semibold text-slate-600 py-3">Expiry / Review Date</TableHead>
            <TableHead className="text-xs font-semibold text-slate-600 py-3">Urgency</TableHead>
            <TableHead className="text-xs font-semibold text-slate-600 py-3 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const days = item.daysRemaining;
            const isOverdue = days < 0;
            const is1to7 = days >= 0 && days <= 7;
            const is8to14 = days > 7 && days <= 14;
            const is15to30 = days > 14 && days <= 30;
            const is31to45 = days > 30 && days <= 45;
            const is46to60 = days > 45 && days <= 60;
            const serialNumber = (page - 1) * limit + index + 1;

            return (
              <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Serial Number */}
                <TableCell className="py-3.5 text-center text-xs font-medium text-slate-400">
                  {serialNumber}
                </TableCell>

                {/* Person */}
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 rounded-full border border-slate-200 bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center">
                      <AvatarFallback>{getInitials(item.personName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {item.personName}
                      </span>
                      {item.personRoleOrRoom && (
                        <span className="text-xs text-slate-500 font-normal truncate">
                          {item.personRoleOrRoom}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Category Pill */}
                <TableCell className="py-3.5">
                  {item.category === "support-plan" && (
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium">
                      Support Plan
                    </Badge>
                  )}
                  {item.category === "staff-certification" && (
                    <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-xs font-medium">
                      Staff Training
                    </Badge>
                  )}
                  {item.category === "medication" && (
                    <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium">
                      Medication
                    </Badge>
                  )}
                </TableCell>

                {/* Title & Details */}
                <TableCell className="py-3.5 max-w-xs">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {item.title}
                    </span>
                    {item.details && (
                      <span className="text-xs text-slate-500 font-normal truncate mt-0.5">
                        {item.details}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Target Date */}
                <TableCell className="py-3.5 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-700">
                    {formatDate(item.targetDate)}
                  </span>
                </TableCell>

                {/* Urgency Badge (Color-coded without icons) */}
                <TableCell className="py-3.5 whitespace-nowrap">
                  {isOverdue && (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold text-xs">
                      Overdue ({Math.abs(days)}d ago)
                    </Badge>
                  )}
                  {is1to7 && (
                    <Badge className="bg-red-100 text-red-800 border-red-300 font-medium text-xs">
                      Critical: {days} {days === 1 ? "day" : "days"} left
                    </Badge>
                  )}
                  {is8to14 && (
                    <Badge className="bg-red-50 text-red-700 border-red-200 font-medium text-xs">
                      Urgent: {days} days left
                    </Badge>
                  )}
                  {is15to30 && (
                    <Badge className="bg-red-50 text-red-700 border-red-200 font-medium text-xs">
                      Due in {days} days
                    </Badge>
                  )}
                  {is31to45 && (
                    <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-medium text-xs">
                      Due in {days} days
                    </Badge>
                  )}
                  {is46to60 && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs">
                      Due in {days} days
                    </Badge>
                  )}
                  {!isOverdue && !is1to7 && !is8to14 && !is15to30 && !is31to45 && !is46to60 && (
                    <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-normal text-xs">
                      Due in {days} days
                    </Badge>
                  )}
                </TableCell>

                {/* Direct Action Link - without arrow icon */}
                <TableCell className="py-3.5 text-right whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs font-medium border-slate-200 hover:border-[#4a706a] hover:bg-[#4a706a]/5 hover:text-[#4a706a]"
                    asChild
                  >
                    <Link href={item.linkUrl}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

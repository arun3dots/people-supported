"use client";

import React from "react";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { Building2 } from "lucide-react";

interface WingData {
  id: string;
  name: string;
  type: string;
  totalStaff: number;
  onDuty: number;
  status: string;
  statusDetail: string;
  isUnderstaffed: boolean;
  avatars: string[];
}

interface FacilityViewGridProps {
  onViewShift: (wing: WingData) => void;
}

const MOCK_WINGS: WingData[] = [
  {
    id: "wing-1",
    name: "Maple Wing",
    type: "General residential care",
    totalStaff: 28,
    onDuty: 6,
    status: "Fully Staffed",
    statusDetail: "All Shifts covered",
    isUnderstaffed: false,
    avatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "wing-2",
    name: "Sunrise Wing",
    type: "Dementia Care unit",
    totalStaff: 28,
    onDuty: 6,
    status: "Under Staffed",
    statusDetail: "2 shifts need cover",
    isUnderstaffed: true,
    avatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "wing-3",
    name: "Oak Wing",
    type: "General Residential Care",
    totalStaff: 28,
    onDuty: 6,
    status: "Under Staffed",
    statusDetail: "3 shifts need cover",
    isUnderstaffed: true,
    avatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "wing-4",
    name: "Willow Wing",
    type: "Rehabilitation Unit",
    totalStaff: 28,
    onDuty: 7,
    status: "Fully Staffed",
    statusDetail: "All Shifts covered",
    isUnderstaffed: false,
    avatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    ],
  },
];

export function FacilityViewGrid({ onViewShift }: FacilityViewGridProps) {
  return (
    <div className="bg-surface-card-grey border-none rounded-2xl p-5 lg:p-6 shadow-none overflow-x-auto font-sans">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap min-w-44">Facility ({MOCK_WINGS.length})</TableHead>
              <TableHead className="whitespace-nowrap">Total Staff</TableHead>
              <TableHead className="whitespace-nowrap">On Duty Today</TableHead>
              <TableHead className="whitespace-nowrap">Available Now</TableHead>
              <TableHead className="whitespace-nowrap">Staffing Status</TableHead>
              <TableHead className="whitespace-nowrap text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_WINGS.map((wing) => (
              <TableRow key={wing.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Facility Name */}
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-surface-primary-light text-icon-primary border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 className="size-5" />
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <Text size="sm" weight="medium" className="text-slate-900 truncate">
                        {wing.name}
                      </Text>
                      <Text size="sm" weight="regular" className="text-slate-500 truncate">
                        {wing.type}
                      </Text>
                    </div>
                  </div>
                </TableCell>

                {/* Total Staff */}
                <TableCell className="py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <Text size="sm" weight="medium" className="text-slate-900">
                      {wing.totalStaff}
                    </Text>
                    <Text size="sm" weight="regular" className="text-slate-500">
                      Registered
                    </Text>
                  </div>
                </TableCell>

                {/* On Duty Today */}
                <TableCell className="py-3.5">
                  <div className="flex flex-col gap-1">
                    <Text size="sm" weight="medium" className="text-slate-900">
                      {wing.onDuty} Staff
                    </Text>
                    <Badge variant="secondary" state="success" className="px-2 py-0.5 shadow-none w-fit">
                      Active on Duty
                    </Badge>
                  </div>
                </TableCell>

                {/* Available Now Avatars */}
                <TableCell className="py-3.5">
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {wing.avatars.map((src, i) => (
                      <div key={i} className="inline-block size-7 rounded-full ring-2 ring-white overflow-hidden bg-slate-100 shrink-0">
                        <Image unoptimized src={src} alt="Staff" width={28} height={28} className="object-cover size-full" />
                      </div>
                    ))}
                  </div>
                </TableCell>

                {/* Staffing Status */}
                <TableCell className="py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${wing.isUnderstaffed ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <Text
                        size="sm"
                        weight="medium"
                        className={wing.isUnderstaffed ? "text-amber-700" : "text-primary"}
                      >
                        {wing.status}
                      </Text>
                    </div>
                    <Text size="sm" weight="regular" className="text-slate-500">
                      {wing.statusDetail}
                    </Text>
                  </div>
                </TableCell>

                {/* Action */}
                <TableCell className="py-3.5 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewShift(wing)}
                    className="rounded-xl cursor-pointer"
                  >
                    View Shifts
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

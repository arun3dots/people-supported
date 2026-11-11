"use client";

import React, { useState } from "react";
import { Search, Download, MoreVertical, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Text,
} from "@repo/ui/components/ui";

interface FacilityShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  wing: {
    name?: string;
    type?: string;
  } | null;
}

const MOCK_FACILITY_STAFF = [
  { id: "1", name: "Mary Vance", nhs: "NHS: 123 456 7890", role: "Administrator", roleState: "success" as const, shiftStatus: "Fully Staffed", hours: "12 Hours", availability: "On Duty", status: "Active", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
  { id: "2", name: "Sarah Jenkins", nhs: "NHS: 123 456 7890", role: "Clinical Lead", roleState: "info" as const, shiftStatus: "Fully Staffed", hours: "10 Hours", availability: "On Duty", status: "Active", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
  { id: "3", name: "David Kim", nhs: "NHS: 123 456 7890", role: "Care Coordinator", roleState: "info" as const, shiftStatus: "Fully Staffed", hours: "12 Hours", availability: "On Duty", status: "Active", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { id: "4", name: "Emily Watson", nhs: "NHS: 123 456 7890", role: "Senior Carer", roleState: "warning" as const, shiftStatus: "Fully Staffed", hours: "12 Hours", availability: "On Duty", status: "Active", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" },
  { id: "5", name: "James Carter", nhs: "NHS: 123 456 7890", role: "Finance Officer", roleState: "inactive" as const, shiftStatus: "Fully Staffed", hours: "12 Hours", availability: "On Duty", status: "Active", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" },
];

export function FacilityShiftModal({ isOpen, onClose, wing }: FacilityShiftModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!wing) return null;

  const filteredStaff = MOCK_FACILITY_STAFF.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="4xl">
        <DialogHeader className="p-0 border-b pb-4 border-border-secondary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-surface-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {wing.name || "Facility"} Shift Rota
                </DialogTitle>
                <DialogDescription className="text-md text-slate-500 mt-0.5">
                  {wing.type || "General residential care"} • Unit &amp; Bed Allocations
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">
                Fully Staffed
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-48 max-w-64">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-white border-slate-200"
              />
            </div>

            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-36 rounded-xl bg-white border-slate-200 text-slate-700">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="carer">Carer</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-36 rounded-xl bg-white border-slate-200 text-slate-700">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="early">Early Shift</SelectItem>
                <SelectItem value="late">Late Shift</SelectItem>
                <SelectItem value="night">Night Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 cursor-pointer"
          >
            <Download className="size-4 text-icon-primary" /> Export
          </Button>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto max-h-96 border border-border-secondary/80 rounded-xl">
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap min-w-44">Staff Name</TableHead>
                <TableHead className="whitespace-nowrap">Role</TableHead>
                <TableHead className="whitespace-nowrap">Shifts</TableHead>
                <TableHead className="whitespace-nowrap">Working Hours</TableHead>
                <TableHead className="whitespace-nowrap">Availability</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar size="sm" className="size-8 shrink-0">
                        {staff.avatar && (
                          <AvatarImage src={staff.avatar} alt={staff.name} />
                        )}
                        <AvatarFallback className="bg-slate-200 text-slate-700 font-bold">
                          {staff.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <Text size="sm" weight="medium" className="text-slate-900 truncate">
                          {staff.name}
                        </Text>
                        <Text size="sm" weight="regular" className="text-slate-500 truncate">
                          {staff.nhs}
                        </Text>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <Badge variant="secondary" state={staff.roleState} className="px-2.5 py-0.5 shadow-none">
                      {staff.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-900">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <Text size="sm" weight="medium">
                        {staff.shiftStatus}
                      </Text>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <Text size="sm" weight="medium" className="text-slate-900">
                      {staff.hours}
                    </Text>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">
                      {staff.availability}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">
                      {staff.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5 text-right">
                    <Button variant="ghost" size="icon" className="size-8 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer">
                      <MoreVertical className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/Table";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Users, Mail, ShieldCheck } from "lucide-react";
import { FacilityStaff } from "../../../../../../../lib/types/facility";

interface FacilityStaffModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  staff: FacilityStaff[];
  title: string;
}

export function FacilityStaffModal({
  isOpen,
  onOpenChange,
  staff,
  title,
}: FacilityStaffModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Assigned Staff - {title}
          </DialogTitle>
          <DialogDescription>
            List of care team members currently assigned to this facility.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Card
            variant="white"
            border="secondary"
            className="overflow-hidden p-0 rounded-xl"
          >
            <Table>
              <TableHeader className="bg-surface-card-grey/60">
                <TableRow>
                  <TableHead className="font-medium">Staff Member</TableHead>
                  <TableHead className="font-medium">Role</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-muted-foreground italic"
                    >
                      No staff members assigned to this location yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow
                      key={member.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-primary-light flex items-center justify-center text-primary text-md font-medium">
                            {member.fullName.charAt(0)}
                          </div>
                          <span className="font-medium text-md text-slate-800">
                            {member.fullName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          state="info"
                          className="px-2.5 py-0.5 shadow-none"
                        >
                          {member.role.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-md text-slate-500">
                          {member.email && (
                            <>
                              <Mail className="size-3.5 text-slate-400" />
                              <span className="truncate max-w-32">
                                {member.email}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="flex justify-end pt-2">
          <Badge
            variant="secondary"
            state="inactive"
            className="px-2.5 py-0.5 shadow-none"
          >
            Total assigned: {staff.length}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

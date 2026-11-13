"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Users, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface RoleReallocateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  userCount: number;
}

export function RoleReallocateDialog({
  isOpen,
  onOpenChange,
  roleName,
  userCount,
}: RoleReallocateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="font-sans">
        <DialogHeader className="flex flex-col gap-2">
          <div className="size-10 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mb-1">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Cannot Delete Role
          </DialogTitle>
          <DialogDescription className="text-md text-slate-600 leading-relaxed">
            The <span className="font-semibold text-slate-900">&ldquo;{roleName}&rdquo;</span> role currently has{" "}
            <span className="font-semibold text-amber-800">{userCount}</span> staff{" "}
            {userCount === 1 ? "member" : "members"} assigned to it.
            <br />
            <br />
            Please reallocate these staff members to a different role in the Staff Directory before deleting this role.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200"
          >
            Close
          </Button>
          <Button
            asChild
            type="button"
            variant="primary"
            className="rounded-xl gap-2 cursor-pointer"
          >
            <Link href="/admin/staff" onClick={() => onOpenChange(false)}>
              <Users className="size-4" />
              Manage Staff
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

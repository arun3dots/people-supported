"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
} from "@repo/ui/components/ui";
import {
  MoreHorizontal,
  Eye,
  Settings,
  History,
  Copy,
} from "lucide-react";
import type { Tenant } from "../../../lib/types/tenant";

interface TenantRowActionsProps {
  tenant: Tenant;
  onCopyVerificationLink: (token: string) => void;
}

export function TenantRowActions({
  tenant,
  onCopyVerificationLink,
}: TenantRowActionsProps) {
  const verificationToken =
    tenant.status === "Pending" ? tenant.users?.[0]?.verificationToken : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-slate-500 hover:text-slate-900"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1.5 bg-white">
        <DropdownMenuLabel className="text-2xs uppercase tracking-wider text-slate-400 font-bold px-2.5 py-1.5">
          Lifecycle Management
        </DropdownMenuLabel>
        <DropdownMenuItem className="rounded-lg px-2.5 py-2 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
          <Eye className="size-3.5 text-slate-500" />
          <span>Full Tenant Dossier</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg px-2.5 py-2 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
          <Settings className="size-3.5 text-slate-500" />
          <span>Override System Config</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem className="rounded-lg px-2.5 py-2 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
          <History className="size-3.5 text-slate-500" />
          <span>Audit History</span>
        </DropdownMenuItem>
        {verificationToken && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="rounded-lg px-2.5 py-2 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800"
              onClick={() => onCopyVerificationLink(verificationToken)}
            >
              <Copy className="size-3.5" />
              <span>Copy Verification Link</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

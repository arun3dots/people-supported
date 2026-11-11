"use client";

import { useMemo } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from "@repo/ui/components/ui";
import { useAuth } from "../context/AuthContext";
import { useBranchesQuery, useSwitchBranchMutation } from "../queries/branches";

/**
 * Topbar control for multi-branch staff to change their active branch. All
 * branch-scoped API data follows `activeBranchId`, so switching re-fetches the
 * whole app for the chosen branch. Renders nothing unless the user actually has
 * a choice (>= 2 branches available to them).
 */
export function BranchSwitcher() {
  const { user } = useAuth();
  // Only tenant users can list branches; SuperAdmin (no tenant) 403s.
  const { data: branches = [] } = useBranchesQuery({ enabled: !!user?.tenantId });
  const switchBranch = useSwitchBranchMutation();

  const availableBranches = useMemo(() => {
    const assigned = user?.branchIds ?? [];
    // Branch-assigned users pick from their own branches; tenant-wide roles
    // (no UserBranch rows) may target any branch in the tenant.
    return assigned.length > 0
      ? branches.filter((b) => assigned.includes(b.id))
      : branches;
  }, [branches, user?.branchIds]);

  const activeBranch = useMemo(
    () => availableBranches.find((b) => b.id === user?.activeBranchId),
    [availableBranches, user?.activeBranchId],
  );

  if (availableBranches.length < 2) return null;

  const onSelect = (branchId: string) => {
    if (branchId === user?.activeBranchId || switchBranch.isPending) return;
    switchBranch.mutate(branchId, {
      onError: (err) =>
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Could not switch branch",
          variant: "destructive",
        }),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-0 disabled:opacity-60"
          disabled={switchBranch.isPending}
        >
          {switchBranch.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Building2 className="size-4 text-primary" />
          )}
          <span className="max-w-[160px] truncate">
            {activeBranch?.name ?? "Select branch"}
          </span>
          <ChevronDown className="size-4 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel>Active branch</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {availableBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            className="flex cursor-pointer items-center justify-between py-2.5"
            onSelect={() => onSelect(branch.id)}
          >
            <span className="truncate">{branch.name}</span>
            {branch.id === user?.activeBranchId && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

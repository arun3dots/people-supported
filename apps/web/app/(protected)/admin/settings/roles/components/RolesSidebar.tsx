"use client";

import React from "react";
import { Search, ChevronRight, ShieldCheck, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Skeleton,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { RoleMember } from "../../../../../../lib/types/role";

type SidebarRole = RoleMember & { userCount?: number };

interface RolesSidebarProps {
  filteredRoles: SidebarRole[] | undefined;
  selectedRole: SidebarRole | null;
  setSelectedRole: (role: SidebarRole) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export function RolesSidebar({
  filteredRoles = [],
  selectedRole,
  setSelectedRole,
  searchTerm,
  setSearchTerm,
  isLoading,
  setIsAddModalOpen,
}: RolesSidebarProps) {
  return (
    <Card
      variant="surface"
      className="w-full lg:w-[350px] lg:self-stretch shrink-0 rounded-2xl p-5 flex flex-col justify-between gap-5 font-sans border-none shadow-none"
    >
      <div className="flex flex-col gap-4">
        {/* Panel Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Text size="md" weight="bold" className="text-slate-900">
              Roles ({filteredRoles?.length ?? 0})
            </Text>
            <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
              Select a role to view assigned permissions and users.
            </Text>
          </div>
        </div>

        {/* Create Custom Role */}
        <Button
          type="button"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full rounded-xl gap-2 text-md font-semibold cursor-pointer"
        >
          <Plus className="size-4" /> Create Custom Role
        </Button>

        {/* Search Header */}
        <div className="relative w-full [&_[data-slot=input-error]]:hidden">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <Input
            placeholder="Search roles..."
            className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Role List */}
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-200/60" />
            ))
          ) : filteredRoles.length === 0 ? (
            <div className="p-6 text-center">
              <Text size="sm" weight="regular" className="text-slate-400 italic">
                No access roles found.
              </Text>
            </div>
          ) : (
            filteredRoles.map((role) => {
              const isActive = selectedRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "w-full p-3.5 flex items-center justify-between rounded-xl transition-all text-left border gap-3 cursor-pointer",
                    isActive
                      ? "bg-emerald-50/80 border-emerald-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-emerald-300"
                  )}
                >
                  {/* Left Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-surface-primary-light text-icon-primary border border-emerald-100/60 flex items-center justify-center font-bold text-md shrink-0">
                      <ShieldCheck className="size-5 text-icon-primary" />
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <Text size="sm" weight="medium" className="text-slate-900 truncate">
                        {role.name}
                      </Text>
                      <Text size="sm" weight="regular" className="text-slate-500 truncate">
                        {role.userCount ?? 0} {role.userCount === 1 ? "User" : "Users"} assigned
                      </Text>
                    </div>
                  </div>

                  {/* Right Badge + Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      state={role.isSystem ? "success" : "inactive"}
                      className="px-2 py-0.5 text-md shadow-none"
                    >
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                    <ChevronRight className="size-4 text-slate-400" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer count */}
        <Text size="sm" weight="regular" className="text-slate-400">
          Showing {filteredRoles?.length ?? 0} {filteredRoles?.length === 1 ? "role" : "roles"}
        </Text>
      </div>
    </Card>
  );
}
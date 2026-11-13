"use client";

import React from "react";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff/useGetStaffQuery";
import { RoleMember } from "../../../../../../lib/types/role";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  RotateCw,
  Calendar,
  UserCog,
  PencilLine,
  Building2,
  Settings,
  ClipboardList,
  FileText,
  Monitor,
  Ban,
  ListCheck,
  ChartColumn,
  LayoutGrid,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";
import { format } from "date-fns";

const MODULE_LIST = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "staff", label: "Staff Management", icon: Users },
  { id: "payments", label: "Finance", icon: ChartColumn },
  { id: "residents", label: "Residents", icon: Building2 },
  { id: "facilities", label: "Facilities", icon: ListCheck },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "riskAssessments", label: "Risk Assessments", icon: ClipboardList },
  { id: "reports", label: "Reports & Audit", icon: FileText },
  { id: "system", label: "System", icon: Monitor },
];

interface RoleDetailPanelProps {
  role: RoleMember;
  onManagePermissions: (role: RoleMember) => void;
  onManageUsers?: (role: RoleMember) => void;
  onDelete?: (role: RoleMember) => void;
}

export function RoleDetailPanel({
  role,
  onManagePermissions,
  onManageUsers,
  onDelete,
}: RoleDetailPanelProps) {
  const { data: staff } = useGetStaffQuery();

  const assignedUsers =
    staff?.filter((u) => u.role?.name?.toLowerCase() === role.name.toLowerCase()) || [];

  const permissions = (role.permissions || {}) as Record<string, Record<string, boolean>>;

  const countGranted = (): number => {
    let count = 0;
    Object.values(permissions).forEach((mod) => {
      if (mod?.read) count++;
      if (mod?.write) count++;
      if (mod?.delete) count++;
    });
    return count;
  };

  const granted = countGranted();
  const totalPossible = MODULE_LIST.length * 3;

  const hasModuleAccess = (moduleId: string): boolean => {
    const p = permissions[moduleId];
    return Boolean(p?.read || p?.write || p?.delete);
  };

  const hasFullAccess = (moduleId: string): boolean => {
    const p = permissions[moduleId];
    return Boolean(p?.read && p?.write && p?.delete);
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* Hero Card */}
      <Card variant="primary">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-full lg:max-w-[480px]">
            <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <UserCog className="size-6 text-white" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Text size="lg" weight="bold" className="text-white">
                  {role.name}
                </Text>
                <Badge
                  variant="secondary"
                  state={role.isSystem ? "success" : "info"}
                  className="px-2.5 py-0.5 text-md shadow-none"
                >
                  {role.isSystem ? "System Role" : "Custom Role"}
                </Badge>
              </div>

              <Text size="md" weight="regular" className="text-emerald-100 leading-relaxed">
                {role.isSystem
                  ? "Full system access and operational management capabilities."
                  : "Custom role with specific access rights configured."}
              </Text>

              {/* Metadata Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-emerald-200" />
                  <Text size="md" weight="regular" className="text-emerald-100">
                    {assignedUsers.length} {assignedUsers.length === 1 ? "user assigned" : "users assigned"}
                  </Text>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-emerald-200" />
                  <Text size="md" weight="regular" className="text-emerald-100">
                    Created {format(new Date(role.createdAt), "dd MMM yyyy")}
                  </Text>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCw className="size-3.5 text-emerald-200" />
                  <Text size="md" weight="regular" className="text-emerald-100">
                    Updated {format(new Date(role.updatedAt), "dd MMM yyyy")}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {!role.isSystem && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onManagePermissions(role)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-md font-semibold gap-2 shadow-none cursor-pointer"
              >
                <PencilLine className="size-3.5" />
                Edit Permissions
              </Button>
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={() => onDelete(role)}
                  className="bg-white/10 hover:bg-red-500/20 text-white hover:text-red-100 border-white/20 hover:border-red-300/40 rounded-xl text-md font-semibold gap-1.5 shadow-none cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Delete Role
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Module Access Grid */}
      <Card
        variant="surface"
        className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 flex flex-col gap-4 shadow-none border-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Text size="md" weight="bold" className="text-slate-900">
              Module Access Overview
            </Text>
            <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
              Active permission scopes assigned to this role by system module.
            </Text>
          </div>

          {!role.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManagePermissions(role)}
              className="rounded-xl h-9 px-3 text-md font-semibold gap-1.5 shadow-none border-slate-200 bg-white cursor-pointer"
            >
              <PencilLine className="size-3.5 text-icon-primary" />
              Manage Access
            </Button>
          )}
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULE_LIST.map((mod) => {
            const full = hasFullAccess(mod.id);
            const any = hasModuleAccess(mod.id);
            const IconComponent = mod.icon;

            return (
              <div
                key={mod.id}
                className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <IconComponent className="size-4 text-icon-primary shrink-0" />
                  <Text size="md" weight="semibold" className="text-slate-900 truncate">
                    {mod.label}
                  </Text>
                </div>

                <Badge
                  variant="secondary"
                  state={full ? "success" : any ? "info" : "inactive"}
                  className="px-2 py-0.5 text-md font-medium shadow-none"
                >
                  {full ? "Full Access" : any ? "Partial" : "No Access"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Users Assigned */}
      <Card
        variant="surface"
        className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 flex flex-col gap-4 shadow-none border-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Text size="md" weight="bold" className="text-slate-900">
              Assigned Staff Members ({assignedUsers.length})
            </Text>
            <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
              Users currently mapped to this permission profile.
            </Text>
          </div>

          {onManageUsers && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageUsers(role)}
              className="rounded-xl h-9 px-3 text-md font-semibold gap-1.5 shadow-none border-slate-200 bg-white"
            >
              <PencilLine className="size-3.5 text-icon-primary" />
              Manage Users
            </Button>
          )}
        </div>

        {/* User Avatars */}
        <div className="flex items-center gap-2 flex-wrap">
          {assignedUsers.slice(0, 8).map((u) => (
            <div
              key={u.id}
              title={u.fullName}
              className="size-10 rounded-full bg-surface-primary-light text-icon-primary border border-emerald-100 flex items-center justify-center font-bold text-md"
            >
              {u.avatarUrl ? (
                <img
                  src={u.avatarUrl}
                  alt={u.fullName}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                u.fullName.charAt(0).toUpperCase()
              )}
            </div>
          ))}

          {assignedUsers.length > 8 && (
            <div className="size-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-md font-bold text-slate-600">
              +{assignedUsers.length - 8}
            </div>
          )}

          {assignedUsers.length === 0 && (
            <Text size="md" weight="regular" className="text-slate-400 italic">
              No staff members currently assigned to this role.
            </Text>
          )}
        </div>
      </Card>

      {/* Permissions Stats Summary */}
      <Card
        variant="surface"
        className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 flex flex-col gap-4 shadow-none border-none"
      >
        <div>
          <Text size="md" weight="bold" className="text-slate-900">
            Permission Coverage Summary
          </Text>
          <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
            Total capabilities granted vs restricted across the {MODULE_LIST.length} system modules.
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-surface-primary-light text-icon-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 text-icon-primary" />
            </div>
            <div>
              <Text size="md" weight="medium" className="text-slate-500 block">
                Total Scopes
              </Text>
              <Text size="lg" weight="bold" className="text-slate-900">
                {totalPossible}
              </Text>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-surface-primary-light text-icon-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5 text-icon-primary" />
            </div>
            <div>
              <Text size="md" weight="medium" className="text-slate-500 block">
                Granted Scopes
              </Text>
              <Text size="lg" weight="bold" className="text-emerald-800">
                {granted} ({totalPossible > 0 ? Math.round((granted / totalPossible) * 100) : 0}%)
              </Text>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Ban className="size-5 text-amber-700" />
            </div>
            <div>
              <Text size="md" weight="medium" className="text-slate-500 block">
                Restricted Scopes
              </Text>
              <Text size="lg" weight="bold" className="text-amber-700">
                {totalPossible - granted} (
                {totalPossible > 0 ? Math.round(((totalPossible - granted) / totalPossible) * 100) : 0}%)
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

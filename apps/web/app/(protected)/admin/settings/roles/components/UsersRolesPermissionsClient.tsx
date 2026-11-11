"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GET_ROLES_LIST } from "@repo/endpoints";
import { useGetRolesListQuery } from "../../../../../../lib/queries/role/useGetRolesListQuery";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff/useGetStaffQuery";
import {
  useCreateRoleMutationQuery,
  useUpdateRoleMutationQuery,
  useDeleteRoleMutationQuery,
} from "../../../../../../lib/queries/role/roleMutations";
import { DeleteConfirmDialog } from "../../../../../../lib/components/shared/DeleteConfirmDialog";
import { Text, Skeleton, toast } from "@repo/ui/components/ui";
import { RoleMember } from "../../../../../../lib/types/role";

import { RoleStatCards } from "./RoleStatCards";
import { RoleFilterSection } from "./RoleFilterSection";
import { RolesSidebar } from "./RolesSidebar";
import { RoleDetailPanel } from "./RoleDetailPanel";
import { RoleDialog } from "./RoleDialog";
import { RoleReallocateDialog } from "./RoleReallocateDialog";

export function UsersRolesPermissionsClient() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [selectedRole, setSelectedRole] = useState<RoleMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reallocateRole, setReallocateRole] = useState<{ name: string; count: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleMember | null>(null);

  const { data: roles, isLoading, isError } = useGetRolesListQuery();
  const { data: staff } = useGetStaffQuery();

  const staffRoles = roles?.filter((r) => r.name.toLowerCase() !== "resident") || [];

  const rolesWithCounts = staffRoles.map((role) => ({
    ...role,
    userCount: staff?.filter((s) => s.role?.name?.toLowerCase() === role.name.toLowerCase()).length || 0,
  }));

  useEffect(() => {
    if (!selectedRole && rolesWithCounts && rolesWithCounts.length > 0) {
      setSelectedRole(rolesWithCounts[0] ?? null);
    }
  }, [rolesWithCounts, selectedRole]);

  const filteredRoles = rolesWithCounts?.filter((r) => {
    const matchesSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "All Types" ||
      (typeFilter === "System" && r.isSystem) ||
      (typeFilter === "Custom" && !r.isSystem);
    return matchesSearch && matchesType;
  });

  const formatErrorMessage = (error: unknown, fallback: string): string => {
    if (!error) return fallback;
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : fallback;
    if (!msg || msg === "Failed to fetch") {
      return "Unable to connect to the server. Please check your connection and try again.";
    }
    return msg;
  };

  const createMutation = useCreateRoleMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_ROLES_LIST] });
      setIsAddModalOpen(false);
      toast({ title: "Success", description: "Role created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: formatErrorMessage(error, "Failed to create role"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useUpdateRoleMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_ROLES_LIST] });
      setEditRole(null);
      toast({ title: "Success", description: "Role updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: formatErrorMessage(error, "Failed to update role"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteRoleMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_ROLES_LIST] });
      setDeleteId(null);
      if (selectedRole?.id === deleteId) {
        setSelectedRole(rolesWithCounts?.[0] ?? null);
      }
      toast({ title: "Success", description: "Role deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: formatErrorMessage(error, "Failed to delete role"),
        variant: "destructive",
      });
    },
  });

  if (isError) {
    return (
      <div className="text-red-700 p-6 font-semibold text-center mt-12 bg-red-50 rounded-2xl font-sans">
        Error loading roles directory. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <Text size="xl" weight="bold">Roles &amp; Permissions</Text>
        <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
          Manage system access roles, define module permission scopes, and configure operational access levels.
        </Text>
      </div>

      {/* Stats */}
      <RoleStatCards roles={roles || []} staff={staff || []} />

      {/* Filters */}
      <RoleFilterSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onReset={() => { setSearchTerm(""); setTypeFilter("All Types"); }}
      />

      {/* Main Content — Overview */}
      {isLoading ? (
        <div className="bg-surface-card-grey rounded-2xl p-6 min-h-[400px]">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-200/60" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">
          <RolesSidebar
            filteredRoles={filteredRoles}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
            setIsAddModalOpen={setIsAddModalOpen}
          />
          <div className="flex-1 w-full min-w-0">
            {selectedRole ? (
              <RoleDetailPanel
                role={selectedRole}
                onManagePermissions={(r) => {
                  if (!r.isSystem) {
                    setEditRole(r);
                  }
                }}
                onDelete={(r) => {
                  if (r.isSystem) return;
                  const assignedCount =
                    staff?.filter((s) => s.role?.name?.toLowerCase() === r.name.toLowerCase()).length || 0;
                  if (assignedCount > 0) {
                    setReallocateRole({ name: r.name, count: assignedCount });
                  } else {
                    setDeleteId(r.id);
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-surface-card-grey rounded-2xl text-slate-400 text-md w-full">
                Select a role from the list to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <RoleDialog
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={(v) => createMutation.mutateAsync(v)}
        title="Create Custom Role"
        isLoading={createMutation.isPending}
      />
      <RoleDialog
        isOpen={!!editRole}
        onOpenChange={(open) => !open && setEditRole(null)}
        initialData={editRole}
        onSubmit={(v) => {
          if (editRole) {
            return updateMutation.mutateAsync({ id: editRole.id, payload: v });
          }
        }}
        title="Manage Permissions"
        isLoading={updateMutation.isPending}
      />
      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Delete Custom Role"
        description="Are you sure you want to delete this custom role? This action cannot be undone."
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
      <RoleReallocateDialog
        isOpen={!!reallocateRole}
        onOpenChange={(open) => !open && setReallocateRole(null)}
        roleName={reallocateRole?.name || ""}
        userCount={reallocateRole?.count || 0}
      />
    </div>
  );
}

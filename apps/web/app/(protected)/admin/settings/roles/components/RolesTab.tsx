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
import { RoleDialog } from "./RoleDialog";
import { RoleDetailPanel } from "./RoleDetailPanel";
import { RoleReallocateDialog } from "./RoleReallocateDialog";
import { RoleMember } from "../../../../../../lib/types/role";
import { toast } from "@repo/ui/components/ui";
import { RolesSidebar } from "./RolesSidebar";
import { isSelectableStaffRole } from "../../../../../../lib/utils/roleVisibility";

interface RolesTabProps {
  openAddRole?: boolean;
  setOpenAddRole?: (open: boolean) => void;
}

export function RolesTab({ openAddRole, setOpenAddRole }: RolesTabProps = {}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reallocateRole, setReallocateRole] = useState<{ name: string; count: number } | null>(null);
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const isAddModalOpen = openAddRole ?? internalAddOpen;
  const setIsAddModalOpen = setOpenAddRole ?? setInternalAddOpen;
  const [editRole, setEditRole] = useState<RoleMember | null>(null);

  const { data: roles, isLoading, isError } = useGetRolesListQuery();
  const { data: staff } = useGetStaffQuery();

  // Auto-select first role when data loads
  useEffect(() => {
    if (roles && roles.length > 0) {
      const selectableRoles = roles.filter((role) =>
        isSelectableStaffRole(role.name)
      );
      if (
        selectedRole &&
        !isSelectableStaffRole(selectedRole.name)
      ) {
        setSelectedRole(selectableRoles[0] ?? null);
        return;
      }
      if (selectedRole) return;
      setSelectedRole(selectableRoles[0] ?? null);
    }
  }, [roles, selectedRole]);

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
      if (selectedRole?.id === deleteId) setSelectedRole(roles?.[0] ?? null);
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

  const staffRoles = roles?.filter((role) =>
    isSelectableStaffRole(role.name)
  ) || [];

  const filteredRoles = staffRoles.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isError) return <div className="text-red-500 p-4 font-semibold text-center mt-8">Error loading roles.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">
      {/* Left Panel — Role List */}
      <RolesSidebar
        filteredRoles={filteredRoles}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoading={isLoading}
        setIsAddModalOpen={setIsAddModalOpen}
      />

      {/* Right Panel — Role Detail */}
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
          <div className="flex items-center justify-center h-64 bg-[#F7F7F7] rounded-2xl text-muted-foreground text-md w-full">
            Select a role from the list to view details.
          </div>
        )}
      </div>

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
        title="Delete Role"
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

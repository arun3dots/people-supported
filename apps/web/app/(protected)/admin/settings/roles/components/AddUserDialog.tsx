"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@repo/ui/components/ui";
import { GET_STAFF } from "@repo/endpoints";
import { addUserSchema, AddUserDTO } from "@repo/schema";
import { useGetRolesListQuery } from "../../../../../../lib/queries/role/useGetRolesListQuery";
import { useGetWingsQuery } from "../../../../../../lib/queries/facility";
import { useGetDepartmentsQuery } from "../../../../../../lib/queries/department/useDepartments";
import {
  useCreateStaffMutationQuery,
  useGetStaffQuery,
  useUpdateStaffMutation,
} from "../../../../../../lib/queries/staff";
import { StaffMember } from "../../../../../../lib/types/staff";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { AddUserForm } from "./addUser/AddUserForm";

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: StaffMember | null;
}

const NON_STAFF_ROLES = ["resident", "superadmin"];

const DEFAULT_FORM_VALUES: AddUserDTO = {
  firstName: "",
  middleName: "",
  lastName: "",
  fullName: "",
  email: "",
  phone: "",
  username: "",
  dob: "",
  department: "",
  roleId: "",
  jobTitle: "",
  employeeId: "",
  location: "",
  timeZone: "",
  managerId: "",
  notes: "",
};

export function AddUserDialog({ isOpen, onOpenChange, initialUser }: AddUserDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: roles } = useGetRolesListQuery();
  const { data: wings } = useGetWingsQuery();
  const { data: staffList } = useGetStaffQuery();
  const { data: departments } = useGetDepartmentsQuery();

  const isEditing = !!initialUser;

  const staffRoles = useMemo(
    () =>
      (roles || []).filter(
        (role) => !NON_STAFF_ROLES.includes(role.name.toLowerCase())
      ),
    [roles]
  );

  const locationOptions = useMemo(
    () =>
      (wings || []).map((w) => ({
        label: w.name,
        value: w.name,
      })),
    [wings]
  );

  const form = useForm<AddUserDTO>({
    mode: "all",
    reValidateMode: "onChange",
    resolver: zodResolver(addUserSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { reset } = form;

  useEffect(() => {
    if (!isOpen) return;

    if (initialUser) {
      const nameParts = initialUser.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || initialUser.fullName;
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

      reset({
        firstName,
        middleName,
        lastName,
        fullName: initialUser.fullName,
        email: initialUser.email,
        phone: initialUser.phoneNumber || "",
        username: initialUser.email.split("@")[0] || "",
        dob: initialUser.dob || "",
        department: initialUser.department || "",
        roleId: initialUser.role?.id || "",
        jobTitle: initialUser.department || initialUser.role?.name || "",
        employeeId: `EMP-CL-${initialUser.id.slice(0, 4).toUpperCase()}`,
        location: initialUser.assignedWings?.[0]?.name || "",
        timeZone: "Europe/London",
        managerId: "",
        notes: "",
      });
    } else {
      reset(DEFAULT_FORM_VALUES);
    }
  }, [initialUser, isOpen, reset]);

  const handleClose = () => {
    reset(DEFAULT_FORM_VALUES);
    onOpenChange(false);
  };

  const createMutation = useCreateStaffMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF, "paginated"] });
      toast({
        title: "User Invited Successfully",
        description: "Invitation sent successfully",
        variant: "success",
      });
      handleClose();
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useUpdateStaffMutation(initialUser?.id || "");

  const onSubmit = (data: AddUserDTO) => {
    const fullName =
      [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || data.fullName || "User";
    const today = new Date().toISOString().split("T")[0] || "2026-01-01";

    if (isEditing && initialUser) {
      updateMutation.mutate(
        {
          fullName,
          email: data.email,
          phone: data.phone?.trim() ? data.phone.trim() : undefined,
          roleId: data.roleId || initialUser.role?.id || "",
          department: data.department || undefined,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
            queryClient.invalidateQueries({ queryKey: [GET_STAFF, "paginated"] });
            toast({
              title: "User Updated Successfully",
              description: `User details updated for ${fullName}`,
            });
            handleClose();
          },
          onError: (err: unknown) => {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to update user";
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      const selectedWing = wings?.find((w) => w.name === data.location);
      const unitIds = selectedWing ? [selectedWing.id] : [];

      createMutation.mutate({
        fullName,
        email: data.email,
        phone: data.phone?.trim() ? data.phone.trim() : undefined,
        roleId: data.roleId || staffRoles?.[0]?.id || "",
        department: data.department || undefined,
        dob: data.dob,
        startDate: today,
        unitIds,
        branchId: user?.activeBranchId ?? undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="5xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-foreground text-left">
            {isEditing ? `Edit User: ${initialUser.fullName}` : "Add New User"}
          </DialogTitle>
        </DialogHeader>

        <AddUserForm
          form={form}
          onSubmit={onSubmit}
          isEditing={isEditing}
          isPending={isPending}
          roles={staffRoles}
          departments={departments}
          staffList={staffList}
          locations={locationOptions}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}

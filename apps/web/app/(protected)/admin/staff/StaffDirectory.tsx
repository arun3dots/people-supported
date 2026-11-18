"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { GET_STAFF } from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";
import {
  useGetStaffQuery,
  useGetPaginatedStaffQuery,
} from "../../../../lib/queries/staff";
import { useUpdateStaffStatusMutationQuery } from "../../../../lib/queries/staff/useUpdateStaffStatusMutationQuery";
import { useDeleteStaffMutationQuery } from "../../../../lib/queries/staff/useDeleteStaffMutationQuery";
import { useGetRolesListQuery } from "../../../../lib/queries/role/useGetRolesListQuery";
import { useGetSchemesQuery } from "../../../../lib/queries/facility/useGetSchemesQuery";
import { useGetPropertiesQuery } from "../../../../lib/queries/facility/useGetPropertiesQuery";
import { DeleteConfirmDialog } from "../../../../lib/components/shared/DeleteConfirmDialog";
import { EntityListView } from "../../../../lib/components/shared";
import { useListQueryState } from "../../../../lib/hooks";
import type { StaffMember } from "../../../../lib/types/staff";

import { StaffStatCards } from "./components/StaffStatCards";
import { StaffFilterSection } from "./components/StaffFilterSection";
import { useStaffColumns } from "./components/useStaffColumns";
import { StaffCard } from "./components/StaffCardGrid";
import { AddStaffMemberModal } from "./components/AddStaffMemberModal";
import { resolveStaffLocation } from "./components/staffUtils";

const STAFF_FILTERS = {
  role: "All Roles",
  scheme: "All Schemes",
  property: "All Properties",
  status: "All Status",
} as const;

export function StaffDirectory() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleCategory, setRoleCategory] = useState<string>("all");

  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    filterParams,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    filters: STAFF_FILTERS,
    storageKey: "staff_page_size",
  });

  const { data: allStaff } = useGetStaffQuery();
  const { data: roles } = useGetRolesListQuery();
  const { data: schemesData } = useGetSchemesQuery();
  const { data: propertiesData } = useGetPropertiesQuery();

  const schemes = useMemo(
    () => (Array.isArray(schemesData) ? schemesData : []),
    [schemesData],
  );
  const properties = useMemo(
    () => (Array.isArray(propertiesData) ? propertiesData : []),
    [propertiesData],
  );

  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedStaffQuery({
    page,
    limit,
    search,
    status:
      filterParams.status === "Active" || filterParams.status === "Inactive"
        ? filterParams.status
        : undefined,
  });

  const rawStaffList = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const counts = useMemo(() => {
    const list = allStaff ?? [];
    return {
      all: list.length,
      support: list.filter((s) => {
        const r = s.role?.name?.toLowerCase() || "";
        return (
          r.includes("support") ||
          r.includes("worker") ||
          r.includes("nurse") ||
          r.includes("carer")
        );
      }).length,
      managers: list.filter((s) =>
        (s.role?.name?.toLowerCase() || "").includes("manager"),
      ).length,
      admin: list.filter((s) =>
        (s.role?.name?.toLowerCase() || "").includes("admin"),
      ).length,
      other: list.filter((s) => {
        const r = s.role?.name?.toLowerCase() || "";
        return (
          !r.includes("support") &&
          !r.includes("worker") &&
          !r.includes("nurse") &&
          !r.includes("carer") &&
          !r.includes("manager") &&
          !r.includes("admin")
        );
      }).length,
    };
  }, [allStaff]);

  const roleOptions = useMemo(
    () => [
      { key: "all", label: "All Staff", count: counts.all },
      { key: "support", label: "Support Workers", count: counts.support },
      { key: "managers", label: "Managers", count: counts.managers },
      { key: "admin", label: "Admin", count: counts.admin },
      { key: "other", label: "Other Roles", count: counts.other },
    ],
    [counts],
  );

  const selectedScheme = filterParams.scheme;
  const selectedProperty = filterParams.property;

  const displayStaffList = useMemo(() => {
    return rawStaffList.filter((m) => {
      if (selectedScheme && selectedScheme !== STAFF_FILTERS.scheme) {
        const { schemeId } = resolveStaffLocation(m, schemes, properties);
        if (schemeId !== selectedScheme) return false;
      }

      if (selectedProperty && selectedProperty !== STAFF_FILTERS.property) {
        const { propertyId } = resolveStaffLocation(m, schemes, properties);
        if (propertyId !== selectedProperty) return false;
      }

      if (roleCategory === "all") return true;
      const r = m.role?.name?.toLowerCase() || "";
      if (roleCategory === "support") {
        return (
          r.includes("support") ||
          r.includes("worker") ||
          r.includes("nurse") ||
          r.includes("carer")
        );
      }
      if (roleCategory === "managers") return r.includes("manager");
      if (roleCategory === "admin") return r.includes("admin");
      if (roleCategory === "other") {
        return (
          !r.includes("support") &&
          !r.includes("worker") &&
          !r.includes("nurse") &&
          !r.includes("carer") &&
          !r.includes("manager") &&
          !r.includes("admin")
        );
      }
      return true;
    });
  }, [rawStaffList, roleCategory, selectedScheme, selectedProperty, schemes, properties]);

  const statusMutation = useUpdateStaffStatusMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      toast({
        title: "Success",
        description: "Staff status updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "error",
      });
    },
  });

  const deleteMutation = useDeleteStaffMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      setDeleteId(null);
      toast({
        title: "Success",
        description: "Staff member removed successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff",
        variant: "error",
      });
    },
  });

  const toggleStatus = (id: string, currentStatus: boolean) => {
    statusMutation.mutate({
      id,
      payload: { status: currentStatus ? "Inactive" : "Active" },
    });
  };

  const columns = useStaffColumns({
    onToggleStatus: toggleStatus,
    onDelete: setDeleteId,
    schemes,
    properties,
  });

  return (
    <>
      <EntityListView<StaffMember>
        title="Staff Directory"
        description="Manage staff profiles, roles, qualifications, training and compliance records."
        overviewTitle="Staff Directory"
        storageKey="staff_directory_view_mode"
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Staff"
        addIcon={<Plus className="size-4" />}
        stats={<StaffStatCards staff={allStaff} />}
        filters={
          <StaffFilterSection
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
            roleFilter={roleCategory}
            setRoleFilter={setRoleCategory}
            roleOptions={roleOptions}
            schemeFilter={filters.scheme ?? STAFF_FILTERS.scheme}
            setSchemeFilter={(value) => setFilter("scheme", value)}
            propertyFilter={filters.property ?? STAFF_FILTERS.property}
            setPropertyFilter={(value) => setFilter("property", value)}
            statusFilter={filters.status ?? STAFF_FILTERS.status}
            setStatusFilter={(value) => setFilter("status", value)}
            schemes={schemes}
            properties={properties}
            onReset={() => {
              setRoleCategory("all");
              resetFilters();
            }}
          />
        }
        columns={columns}
        data={displayStaffList}
        paginatedData={displayStaffList}
        renderCard={(member, idx) => (
          <StaffCard
            key={member.id}
            member={member}
            schemes={schemes}
            properties={properties}
            showRightDivider={
              idx % 3 !== 2 && idx !== displayStaffList.length - 1
            }
            onToggleStatus={toggleStatus}
            onDelete={setDeleteId}
          />
        )}
        onRowClick={(member) => router.push(`/admin/staff/${member.id}`)}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Error loading staff directory. Please try again."
        emptyTitle="No staff members found"
        emptyDescription="No staff profiles match your active search or filter criteria."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          showLimitSelector: true,
          entityName: "staff",
        }}
      />

      {/* Add Staff Member Modal */}
      <AddStaffMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        schemes={schemes}
        properties={properties}
        roles={roles ?? []}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Remove Staff Member"
        description="Are you sure you want to remove this staff member? This will deactivate their account and soft-delete their record per CQC guidelines."
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
